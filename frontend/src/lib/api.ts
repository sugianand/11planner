import {
  Course,
  CourseCreate,
  Assignment,
  AssignmentCreate,
  Task,
  TaskCreate,
  ScheduleBlock,
  ScheduleBlockCreate,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ========== API Helper Functions ==========

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let detailMessage = response.statusText;
    try {
      const errorPayload = await response.json();
      detailMessage =
        errorPayload?.detail ||
        errorPayload?.message ||
        response.statusText;
    } catch {
      // Fallback to status text when response body is not JSON
    }
    throw new Error(detailMessage || `API Error (${response.status})`);
  }

  return response.json();
}

// ========== COURSE ENDPOINTS ==========

export const courseAPI = {
  create: (course: CourseCreate) =>
    fetchAPI<Course>("/api/courses", {
      method: "POST",
      body: JSON.stringify(course),
    }),

  getByUser: (userId: string) =>
    fetchAPI<Course[]>(`/api/courses/${userId}`, { method: "GET" }),

  getById: (courseId: string) =>
    fetchAPI<Course>(`/api/courses/detail/${courseId}`, { method: "GET" }),

  update: (courseId: string, course: Partial<Course>) =>
    fetchAPI<Course>(`/api/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(course),
    }),

  delete: (courseId: string) =>
    fetchAPI<{ message: string }>(`/api/courses/${courseId}`, {
      method: "DELETE",
    }),
};

// ========== ASSIGNMENT ENDPOINTS ==========

export const assignmentAPI = {
  create: (assignment: AssignmentCreate) =>
    fetchAPI<Assignment>("/api/assignments", {
      method: "POST",
      body: JSON.stringify(assignment),
    }),

  getByUser: (userId: string) =>
    fetchAPI<Assignment[]>(`/api/assignments/${userId}`, { method: "GET" }),

  getById: (assignmentId: string) =>
    fetchAPI<Assignment>(`/api/assignments/detail/${assignmentId}`, {
      method: "GET",
    }),

  update: (assignmentId: string, assignment: Partial<Assignment>) =>
    fetchAPI<Assignment>(`/api/assignments/${assignmentId}`, {
      method: "PUT",
      body: JSON.stringify(assignment),
    }),

  delete: (assignmentId: string) =>
    fetchAPI<{ message: string }>(`/api/assignments/${assignmentId}`, {
      method: "DELETE",
    }),
};

// ========== TASK ENDPOINTS ==========

export const taskAPI = {
  create: (task: TaskCreate) =>
    fetchAPI<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),

  getByUser: (userId: string) =>
    fetchAPI<Task[]>(`/api/tasks/${userId}`, { method: "GET" }),

  getById: (taskId: string) =>
    fetchAPI<Task>(`/api/tasks/detail/${taskId}`, { method: "GET" }),

  update: (taskId: string, task: Partial<Task>) =>
    fetchAPI<Task>(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(task),
    }),

  delete: (taskId: string) =>
    fetchAPI<{ message: string }>(`/api/tasks/${taskId}`, {
      method: "DELETE",
    }),
};

// ========== SCHEDULE BLOCK ENDPOINTS ==========

export const scheduleAPI = {
  create: (block: ScheduleBlockCreate) =>
    fetchAPI<ScheduleBlock>("/api/schedule-blocks", {
      method: "POST",
      body: JSON.stringify(block),
    }),

  generate: (userId: string, studyLimitHours?: number) =>
    fetchAPI<{ message: string; blocks: ScheduleBlock[]; stats: Record<string, unknown> | null }>(
      `/api/schedule/generate/${userId}`,
      {
        method: "POST",
        body: JSON.stringify({ study_limit_hours: studyLimitHours }),
      }
    ),

  getByUser: (userId: string) =>
    fetchAPI<ScheduleBlock[]>(`/api/schedule-blocks/${userId}`, {
      method: "GET",
    }),

  update: (blockId: string, block: Partial<ScheduleBlock>) =>
    fetchAPI<ScheduleBlock>(`/api/schedule-blocks/${blockId}`, {
      method: "PUT",
      body: JSON.stringify(block),
    }),

  delete: (blockId: string) =>
    fetchAPI<{ message: string }>(`/api/schedule-blocks/${blockId}`, {
      method: "DELETE",
    }),
};

// ========== HEALTH CHECK ==========

export const healthAPI = {
  check: () => fetchAPI<{ status: string; service: string }>("/health", { method: "GET" }),
};
