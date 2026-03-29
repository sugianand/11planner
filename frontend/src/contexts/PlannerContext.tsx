"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
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
  description: string | null;
  status: string;
  created_at: string;
};

function parseCourseDays(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((d) => d.trim())
    .filter(Boolean);
}

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

function normalizeDeadlineForDb(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid deadline date/time.");
  }
  return date.toISOString();
}

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
    created_at: row.created_at,
  };
}

function mapTaskRowToModel(row: SupabaseTaskRow): Task {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.task_title,
    course_id: row.course_id || undefined,
    deadline: row.deadline_at,
    estimated_hours: row.estimated_hours ?? 0,
    priority: row.priority_level ?? 2,
    description: row.description || "",
    completed: row.status === "completed",
    created_at: row.created_at,
  };
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

  // Sync with Supabase Auth
  useEffect(() => {
    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          setUserId("user_demo");
        }
      })
      .catch((err) => {
        // Suppress auth session errors for guest users
        console.debug("No active session, using guest mode:", err.message);
        setUserId("user_demo");
      });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId("user_demo");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ========== Courses ==========
  const loadCourses = useCallback(async () => {
    try {
      if (userId === "user_demo") {
        setCourses([]);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setCourses((data as SupabaseCourseRow[]).map(mapCourseRowToModel));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [userId]);


  const loadPreferences = useCallback(async () => {
    try {
      if (userId === "user_demo") {
        setPreferences(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("worktime, workdays, workstyle, assignmentplan, additional_info")
        .eq("id", userId)
        .single();

      if (queryError) throw queryError;

      setPreferences({
        worktime: data.worktime || "",
        workdays: data.workdays || [],
        workstyle: data.workstyle || "",
        assignmentplan: data.assignmentplan || "",
        additionalInfo: data.additional_info || "",
      });
    } catch (err) {
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
        const payload = {
          user_id: course.user_id || userId,
          course_name: course.name,
          course_days: parseCourseDays(course.courseDate),
          start_time: normalizeTimeForDb(course.startTime),
          end_time: normalizeTimeForDb(course.endTime),
          course_code: course.code,
          professor: course.professor || null,
          description: course.description || null,
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

  const updateCourse = useCallback(async (id: string, course: Partial<Course>) => {
    try {
      if (userId === "user_demo") {
        throw new Error("Please sign in to update courses.");
      }
      setLoading(true);
      const updatePayload: Record<string, unknown> = {};
      if (course.name !== undefined) updatePayload.course_name = course.name;
      if (course.code !== undefined) updatePayload.course_code = course.code;
      if (course.courseDate !== undefined) updatePayload.course_days = parseCourseDays(course.courseDate);
      if (course.startTime !== undefined) updatePayload.start_time = normalizeTimeForDb(course.startTime);
      if (course.endTime !== undefined) updatePayload.end_time = normalizeTimeForDb(course.endTime);
      if (course.professor !== undefined) updatePayload.professor = course.professor || null;
      if (course.description !== undefined) updatePayload.description = course.description || null;

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
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentAPI.getByUser(userId);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
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

  const updateAssignment = useCallback(
    async (id: string, assignment: Partial<Assignment>) => {
      try {
        setLoading(true);
        // build update payload
        const updatePayload: Record<string, unknown> = {};
        if (assignment.title !== undefined) updatePayload.title = assignment.title;
        if (assignment.course_id !== undefined) updatePayload.course_id = assignment.course_id || null;
        if (assignment.deadline !== undefined) updatePayload.deadline = assignment.deadline;
        if (assignment.description !== undefined) updatePayload.description = assignment.description || null;
        if (assignment.priority !== undefined) updatePayload.priority = assignment.priority;
        if (assignment.estimated_hours !== undefined) updatePayload.estimated_hours = assignment.estimated_hours;
        if (assignment.status !== undefined) updatePayload.status = assignment.status;
        if (assignment.completed !== undefined) {
          updatePayload.completed = assignment.completed;
          updatePayload.status = assignment.completed ? "completed" : "pending";
        }
        if (assignment.points !== undefined) updatePayload.points = assignment.points;
        if (assignment.url !== undefined) updatePayload.url = assignment.url;

        const { error: updateError } = await supabase
          .from("assignments")
          .update(updatePayload)
          .eq("id", id);

        if (updateError) throw updateError;
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
    try {
      if (userId === "user_demo") {
        setTasks([]);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setTasks((data as SupabaseTaskRow[]).map(mapTaskRowToModel));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
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
          description: task.description || null,
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

  const updateTask = useCallback(async (id: string, task: Partial<Task>) => {
    try {
      if (userId === "user_demo") {
        throw new Error("Please sign in to update tasks.");
      }
      setLoading(true);
      const updatePayload: Record<string, unknown> = {};
      if (task.title !== undefined) updatePayload.task_title = task.title;
      if (task.course_id !== undefined) updatePayload.course_id = task.course_id || null;
      if (task.deadline !== undefined) updatePayload.deadline_at = normalizeDeadlineForDb(task.deadline);
      if (task.estimated_hours !== undefined) updatePayload.estimated_hours = task.estimated_hours;
      if (task.priority !== undefined) updatePayload.priority_level = task.priority;
      if (task.description !== undefined) updatePayload.description = task.description || null;
      if (task.completed !== undefined) updatePayload.status = task.completed ? "completed" : "pending";

      const { error: updateError } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...task } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleAPI.getByUser(userId);
      setScheduleBlocks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule blocks");
    } finally {
      setLoading(false);
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

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within PlannerProvider");
  }
  return context;
}
