"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  Course,
  CourseCreate,
  Assignment,
  AssignmentCreate,
  Task,
  TaskCreate,
  ScheduleBlock,
  UserPreferences,
} from "@/types";
import {
  assignmentAPI,
  scheduleAPI,
} from "@/lib/api";

interface PlannerContextType {
  userId: string;
  setUserId: (id: string) => void;

  // Courses
  courses: Course[];
  loadCourses: () => Promise<void>;
  createCourse: (course: CourseCreate) => Promise<Course>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Assignments
  assignments: Assignment[];
  loadAssignments: () => Promise<void>;
  createAssignment: (assignment: AssignmentCreate) => Promise<Assignment>;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  loadTasks: () => Promise<void>;
  createTask: (task: TaskCreate) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Schedule Blocks
  scheduleBlocks: ScheduleBlock[];
  loadScheduleBlocks: () => Promise<void>;
  updateScheduleBlock: (id: string, block: Partial<ScheduleBlock>) => Promise<void>;

  // Loading state
  loading: boolean;
  error: string | null;

  // Profile preferences
  preferences: UserPreferences | null;
  loadPreferences: () => Promise<void>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

import { supabase } from "@/lib/supabaseClient";

type SupabaseCourseRow = {
  id: string;
  user_id: string;
  course_name: string;
  course_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  course_code: string;
  professor: string | null;
  description: string | null;
  is_online: boolean | null;
  isOnline?: boolean | null;
  has_lab: boolean | null;
  hasLab?: boolean | null;
  lab_day: string | null;
  labDay?: string | null;
  lab_start_time: string | null;
  labStartTime?: string | null;
  lab_end_time: string | null;
  labEndTime?: string | null;
  lab_is_online: boolean | null;
  labIsOnline?: boolean | null;
  created_at: string;
};

type SupabaseTaskRow = {
  id: string;
  user_id: string;
  task_title: string;
  course_id: string | null;
  deadline_at: string;
  estimated_hours: number | null;
  priority_level: number | null;
  task_type: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

type TaskCategory = "assignment" | "exam" | "project";
const TASK_CATEGORY_TAG_RE = /^\s*\[\[type:(assignment|exam|project)\]\]\s*/i;

// Extracts a tagged task category from description text and returns cleaned text.
function parseTaskCategoryFromDescription(
  description: string | null
): { category: TaskCategory; description: string } {
  const raw = description || "";
  const match = raw.match(TASK_CATEGORY_TAG_RE);
  if (match) {
    const category = match[1].toLowerCase() as TaskCategory;
    return {
      category,
      description: raw.replace(TASK_CATEGORY_TAG_RE, "").trim(),
    };
  }
  return {
    category: "assignment",
    description: raw,
  };
}

// Normalizes task category values to the supported enum set.
function normalizeTaskCategory(value: string | null | undefined): TaskCategory {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "exam" || normalized === "project") {
    return normalized;
  }
  return "assignment";
}

// Removes internal category metadata from persisted task descriptions.
function sanitizeTaskDescription(description: string | null | undefined): string | null {
  const clean = (description || "").replace(TASK_CATEGORY_TAG_RE, "").trim();
  return clean.length > 0 ? clean : null;
}

// Splits a day list string into an array of individual weekday names.
function parseCourseDays(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((d) => d.trim())
    .filter(Boolean);
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

// Keeps only recognized weekdays in canonical order for storage.
function normalizeCourseDays(value: string): string[] {
  return WEEK_DAYS.filter((day) => parseCourseDays(value).includes(day));
}

// Converts user-entered time to HH:MM:SS 24-hour format.
function normalizeTimeForDb(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) {
    throw new Error("Time must be in HH:MM or HH:MM AM/PM format.");
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] || "0");
  const meridiem = match[4]?.toLowerCase();

  if (minute > 59 || second > 59) {
    throw new Error("Invalid time value.");
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) throw new Error("Invalid 12-hour time.");
    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    throw new Error("Invalid 24-hour time.");
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

// Converts optional time input to DB format while preserving empty values.
function normalizeOptionalTimeForDb(value: string | undefined | null): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return null;
  }
  return normalizeTimeForDb(trimmed);
}

// Validates and converts a deadline value to an ISO timestamp.
function normalizeDeadlineForDb(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid deadline date/time.");
  }
  return date.toISOString();
}

// Clamps daily study limit values to a safe scheduler range.
function clampStudyLimit(value: unknown, fallback = 4): number {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return Math.min(12, Math.max(1, numeric));
}

// Maps raw Supabase course rows to frontend course model shape.
function mapCourseRowToModel(row: SupabaseCourseRow): Course {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.course_name,
    code: row.course_code,
    courseDate: (row.course_days || []).join(" "),
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    professor: row.professor || "",
    description: row.description || "",
    isOnline: row.is_online ?? row.isOnline ?? false,
    hasLab: row.has_lab ?? row.hasLab ?? false,
    labDay: row.lab_day ?? row.labDay ?? "",
    labStartTime: row.lab_start_time ?? row.labStartTime ?? "",
    labEndTime: row.lab_end_time ?? row.labEndTime ?? "",
    labIsOnline: row.lab_is_online ?? row.labIsOnline ?? false,
    created_at: row.created_at,
  };
}

// Maps raw Supabase task rows to frontend task model shape.
function mapTaskRowToModel(row: SupabaseTaskRow): Task {
  const parsed = parseTaskCategoryFromDescription(row.description);
  const category = row.task_type ? normalizeTaskCategory(row.task_type) : parsed.category;

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.task_title,
    category,
    course_id: row.course_id || undefined,
    deadline: row.deadline_at,
    estimated_hours: row.estimated_hours ?? 0,
    priority: row.priority_level ?? 2,
    description: parsed.description,
    completed: row.status === "completed",
    created_at: row.created_at,
  };
}

// Reads and writes local completion timestamps used for insights-history filtering.
const TASK_COMPLETION_TIMESTAMPS_KEY = "taskCompletionTimestamps";

function readTaskCompletionTimestamps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TASK_COMPLETION_TIMESTAMPS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

function writeTaskCompletionTimestamps(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASK_COMPLETION_TIMESTAMPS_KEY, JSON.stringify(map));
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("user_demo");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const activeUserIdRef = useRef(userId);

  // Clears all planner data when auth context resets to guest mode.
  const resetPlannerState = useCallback(() => {
    setCourses([]);
    setAssignments([]);
    setTasks([]);
    setScheduleBlocks([]);
    setPreferences(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    activeUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (userId === "user_demo") {
      resetPlannerState();
    }
  }, [userId, resetPlannerState]);

  // Sync with Supabase Auth
  useEffect(() => {
    let isMounted = true;

    const syncUserFromAuth = async (allowGuestFallback: boolean) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (user?.id) {
          setUserId(user.id);
          return;
        }

        if (allowGuestFallback || activeUserIdRef.current === "user_demo") {
          resetPlannerState();
          setUserId("user_demo");
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        // Keep prior auth state if this is a transient error.
        if (allowGuestFallback || activeUserIdRef.current === "user_demo") {
          console.debug("No active session, using guest mode:", err instanceof Error ? err.message : err);
          resetPlannerState();
          setUserId("user_demo");
        }
      }
    };

    void syncUserFromAuth(activeUserIdRef.current === "user_demo");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (session?.user?.id) {
        setUserId(session.user.id);
        return;
      }

      if (event === "SIGNED_OUT") {
        resetPlannerState();
        setUserId("user_demo");
        return;
      }

      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void syncUserFromAuth(false);
      }
    });

    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void syncUserFromAuth(false);
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [resetPlannerState]);

  // ========== Courses ==========
  const loadCourses = useCallback(async () => {
    const requestUserId = userId;
    try {
      if (requestUserId === "user_demo") {
        setCourses([]);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", requestUserId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setCourses((data as SupabaseCourseRow[]).map(mapCourseRowToModel));
    } catch (err) {
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      if (activeUserIdRef.current === requestUserId) {
        setLoading(false);
      }
    }
  }, [userId]);


  // Loads profile planning preferences used by schedule generation.
  const loadPreferences = useCallback(async () => {
    const requestUserId = userId;
    try {
      if (requestUserId === "user_demo") {
        setPreferences(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("worktime, workdays, workstyle, assignmentplan, additional_info, daily_study_limit")
        .eq("id", requestUserId)
        .single();

      if (queryError) throw queryError;
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }

      setPreferences({
        worktime: data.worktime || "",
        workdays: data.workdays || [],
        workstyle: data.workstyle || "",
        assignmentplan: data.assignmentplan || "",
        additionalInfo: data.additional_info || "",
        dailyLimit: clampStudyLimit(data.daily_study_limit, 4),
      });
    } catch (err) {
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load preferences");
    }
  }, [userId]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const createCourse = useCallback(
    async (course: CourseCreate) => {
      try {
        if (userId === "user_demo") {
          throw new Error("Please sign in to save courses.");
        }
        setLoading(true);
        const isOnline = !!course.isOnline;
        const payload = {
          user_id: course.user_id || userId,
          course_name: course.name,
          course_days: isOnline ? [] : normalizeCourseDays(course.courseDate),
          start_time: isOnline ? null : normalizeOptionalTimeForDb(course.startTime),
          end_time: isOnline ? null : normalizeOptionalTimeForDb(course.endTime),
          course_code: course.code,
          professor: course.professor || null,
          description: course.description || null,
          is_online: isOnline,
          has_lab: !!course.hasLab,
          lab_day: course.hasLab ? course.labDay || null : null,
          lab_start_time: course.hasLab && !course.labIsOnline ? normalizeOptionalTimeForDb(course.labStartTime) : null,
          lab_end_time: course.hasLab && !course.labIsOnline ? normalizeOptionalTimeForDb(course.labEndTime) : null,
          lab_is_online: !!course.labIsOnline,
        };

        const { data, error: insertError } = await supabase
          .from("courses")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) throw insertError;
        const newCourse = mapCourseRowToModel(data as SupabaseCourseRow);
        setCourses((prev) => [...prev, newCourse]);
        return newCourse;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create course");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Updates an existing course and mirrors the changes in local state.
  const updateCourse = useCallback(async (id: string, course: Partial<Course>) => {
    try {
      if (userId === "user_demo") {
        throw new Error("Please sign in to update courses.");
      }
      setLoading(true);
      const updatePayload: Record<string, unknown> = {};
      if (course.name !== undefined) updatePayload.course_name = course.name;
      if (course.code !== undefined) updatePayload.course_code = course.code;
      const isOnline = course.isOnline === true;
      if (course.isOnline !== undefined) updatePayload.is_online = !!course.isOnline;
      if (course.courseDate !== undefined) {
        updatePayload.course_days = isOnline ? [] : normalizeCourseDays(course.courseDate);
      }
      if (course.startTime !== undefined) {
        updatePayload.start_time = isOnline ? null : normalizeOptionalTimeForDb(course.startTime);
      }
      if (course.endTime !== undefined) {
        updatePayload.end_time = isOnline ? null : normalizeOptionalTimeForDb(course.endTime);
      }
      if (course.professor !== undefined) updatePayload.professor = course.professor || null;
      if (course.description !== undefined) updatePayload.description = course.description || null;
      if (course.hasLab !== undefined) updatePayload.has_lab = !!course.hasLab;
      if (course.labDay !== undefined) updatePayload.lab_day = course.hasLab ? course.labDay || null : null;
      if (course.labIsOnline !== undefined) updatePayload.lab_is_online = !!course.labIsOnline;
      if (course.labStartTime !== undefined) {
        updatePayload.lab_start_time = course.hasLab && !course.labIsOnline
          ? normalizeOptionalTimeForDb(course.labStartTime)
          : null;
      }
      if (course.labEndTime !== undefined) {
        updatePayload.lab_end_time = course.hasLab && !course.labIsOnline
          ? normalizeOptionalTimeForDb(course.labEndTime)
          : null;
      }

      const { error: updateError } = await supabase
        .from("courses")
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...course } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Deletes a course for the active user and removes it from local cache.
  const deleteCourse = useCallback(async (id: string) => {
    try {
      if (userId === "user_demo") {
        throw new Error("Please sign in to delete courses.");
      }
      setLoading(true);
      const { error: deleteError } = await supabase
        .from("courses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ========== Assignments ==========
  const loadAssignments = useCallback(async () => {
    const requestUserId = userId;
    try {
      if (requestUserId === "user_demo") {
        setAssignments([]);
        return;
      }
      setLoading(true);
      setError(null);
      const data = await assignmentAPI.getByUser(requestUserId);
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setAssignments(data);
    } catch (err) {
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      if (activeUserIdRef.current === requestUserId) {
        setLoading(false);
      }
    }
  }, [userId]);

  const createAssignment = useCallback(
    async (assignment: AssignmentCreate) => {
      try {
        setLoading(true);
        const newAssignment = await assignmentAPI.create(assignment);
        setAssignments((prev) => [...prev, newAssignment]);
        return newAssignment;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create assignment");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Updates an assignment and keeps UI state synchronized.
  const updateAssignment = useCallback(
    async (id: string, assignment: Partial<Assignment>) => {
      try {
        setLoading(true);
        await assignmentAPI.update(id, assignment);
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...assignment } : a))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update assignment");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Deletes an assignment and removes it from local assignment state.
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await assignmentAPI.delete(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ========== Tasks ==========
  const loadTasks = useCallback(async () => {
    const requestUserId = userId;
    try {
      if (requestUserId === "user_demo") {
        setTasks([]);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", requestUserId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setTasks((data as SupabaseTaskRow[]).map(mapTaskRowToModel));
    } catch (err) {
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      if (activeUserIdRef.current === requestUserId) {
        setLoading(false);
      }
    }
  }, [userId]);

  const createTask = useCallback(
    async (task: TaskCreate) => {
      try {
        if (userId === "user_demo") {
          throw new Error("Please sign in to save tasks.");
        }
        setLoading(true);
        const payload = {
          user_id: task.user_id || userId,
          task_title: task.title,
          course_id: task.course_id || null,
          deadline_at: normalizeDeadlineForDb(task.deadline),
          estimated_hours: task.estimated_hours ?? 0,
          priority_level: task.priority ?? 2,
          task_type: normalizeTaskCategory(task.category),
          description: sanitizeTaskDescription(task.description),
          status: "pending",
        };

        const { data, error: insertError } = await supabase
          .from("tasks")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) throw insertError;
        const newTask = mapTaskRowToModel(data as SupabaseTaskRow);
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Updates a task row and applies the same delta to local state.
  const updateTask = useCallback(async (id: string, task: Partial<Task>) => {
    try {
      if (userId === "user_demo") {
        throw new Error("Please sign in to update tasks.");
      }
      
      const updatePayload: Record<string, unknown> = {};
      if (task.title !== undefined) updatePayload.task_title = task.title;
      if (task.course_id !== undefined) updatePayload.course_id = task.course_id || null;
      if (task.deadline !== undefined) updatePayload.deadline_at = normalizeDeadlineForDb(task.deadline);
      if (task.estimated_hours !== undefined) updatePayload.estimated_hours = task.estimated_hours;
      if (task.priority !== undefined) updatePayload.priority_level = task.priority;
      if (task.category !== undefined) updatePayload.task_type = normalizeTaskCategory(task.category);
      if (task.description !== undefined) updatePayload.description = sanitizeTaskDescription(task.description);
      if (task.completed !== undefined) updatePayload.status = task.completed ? "completed" : "pending";

      if (Object.keys(updatePayload).length === 0) return;

      const { error: updateError } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Update local state immediately
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...task } : t))
      );

      // Store completion timestamp if completing
      if (task.completed !== undefined && typeof window !== "undefined") {
        const completionTimestamps = readTaskCompletionTimestamps();
        if (task.completed) {
          completionTimestamps[id] = new Date().toISOString();
        } else {
          delete completionTimestamps[id];
        }
        writeTaskCompletionTimestamps(completionTimestamps);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    }
  }, [userId]);

  // Deletes a task row for the active user and updates local cache.
  const deleteTask = useCallback(async (id: string) => {
    try {
      if (userId === "user_demo") {
        throw new Error("Please sign in to delete tasks.");
      }
      setLoading(true);
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ========== Schedule Blocks ==========
  const loadScheduleBlocks = useCallback(async () => {
    const requestUserId = userId;
    try {
      if (requestUserId === "user_demo") {
        setScheduleBlocks([]);
        return;
      }
      setLoading(true);
      setError(null);
      const data = await scheduleAPI.getByUser(requestUserId);
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setScheduleBlocks(data);
    } catch (err) {
      if (activeUserIdRef.current !== requestUserId) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load schedule blocks");
    } finally {
      if (activeUserIdRef.current === requestUserId) {
        setLoading(false);
      }
    }
  }, [userId]);

  const updateScheduleBlock = useCallback(async (id: string, block: Partial<ScheduleBlock>) => {
    try {
      setLoading(true);
      const updated = await scheduleAPI.update(id, block);
      setScheduleBlocks((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update schedule block");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: PlannerContextType = {
    userId,
    setUserId,
    courses,
    loadCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    assignments,
    loadAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    tasks,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    scheduleBlocks,
    loadScheduleBlocks,
    updateScheduleBlock,
    loading,
    error,
    preferences,
    loadPreferences,
  };

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
}

// Provides typed access to planner context state and actions.
export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within PlannerProvider");
  }
  return context;
}
