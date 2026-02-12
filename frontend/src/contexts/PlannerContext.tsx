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
} from "@/types";
import {
  courseAPI,
  assignmentAPI,
  taskAPI,
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
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

import { supabase } from "@/lib/supabaseClient";

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("user_demo");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);
      const data = await courseAPI.getByUser(userId);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createCourse = useCallback(
    async (course: CourseCreate) => {
      try {
        setLoading(true);
        const newCourse = await courseAPI.create(course);
        setCourses((prev) => [...prev, newCourse]);
        return newCourse;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create course");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCourse = useCallback(async (id: string, course: Partial<Course>) => {
    try {
      setLoading(true);
      await courseAPI.update(id, course);
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...course } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await courseAPI.delete(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
      setLoading(true);
      setError(null);
      const data = await taskAPI.getByUser(userId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createTask = useCallback(
    async (task: TaskCreate) => {
      try {
        setLoading(true);
        const newTask = await taskAPI.create(task);
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateTask = useCallback(async (id: string, task: Partial<Task>) => {
    try {
      setLoading(true);
      await taskAPI.update(id, task);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...task } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
