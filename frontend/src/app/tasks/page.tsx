"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { Task, TaskCreate } from "@/types";
import Footer from "@/components/Footer";
import AppDialog from "@/components/AppDialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DESCRIPTION_PREVIEW_LIMIT = 160;

function getApiBaseUrl(): string {
  if (API_BASE_URL && API_BASE_URL.trim().length > 0) {
    return API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

function toDateTimeLocalValue(value: string | undefined): string {
  if (!value) return "";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const normalized = value.replace(" ", "T").slice(0, 16);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized) ? normalized : "";
}

type TaskCategory = "assignment" | "exam" | "project";

function getTaskCategoryLabel(category: TaskCategory): string {
  if (category === "exam") return "Exam";
  if (category === "project") return "Project";
  return "Assignment";
}

function getTaskCategoryPillClass(category: TaskCategory): string {
  if (category === "exam") return "bg-rose-100 text-rose-800 dark:bg-rose-900/25 dark:text-rose-200";
  if (category === "project") return "bg-violet-100 text-violet-800 dark:bg-violet-900/25 dark:text-violet-200";
  return "bg-sky-100 text-sky-800 dark:bg-sky-900/25 dark:text-sky-200";
}

function renderDescriptionWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (/^https?:\/\/\S+$/i.test(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 text-[#306844] hover:text-[#255236] dark:text-emerald-300 dark:hover:text-emerald-200 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

export default function TasksPage() {
  const {
    userId,
    tasks,
    courses,
    loadCourses,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    loading,
    error,
  } = usePlanner();
  const [, startTransition] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [formData, setFormData] = useState<Partial<TaskCreate>>({
    title: "",
    category: "assignment",
    course_id: "",
    deadline: "",
    estimated_hours: 2,
    priority: 2,
    description: "",
    user_id: userId,
  });
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"deadline_asc" | "deadline_desc" | "name_asc" | "name_desc" | "priority_desc">("deadline_asc");
  const [courseFilter, setCourseFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "today" | "next7" | "next30" | "overdue">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskCategory>("all");
  const [pageSize, setPageSize] = useState<5 | 10 | 25 | 50>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [estimatingTaskId, setEstimatingTaskId] = useState<string | null>(null);
  const [expandedDescriptionTaskIds, setExpandedDescriptionTaskIds] = useState<Set<string>>(new Set());
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [deletingAllTasks, setDeletingAllTasks] = useState(false);

  useEffect(() => {
    loadCourses();
    loadTasks();
  }, [userId, loadCourses, loadTasks]);

  // Simple, clean task completion handler
  const handleToggleTaskCompletion = useCallback(async (taskId: string, currentCompleted: boolean) => {
    try {
      setTogglingTaskId(taskId);
      await updateTask(taskId, { completed: !currentCompleted });
      setTogglingTaskId(null);
      
      // Auto-switch tab when marking complete
      if (!currentCompleted) {
        setTimeout(() => setActiveTab("completed"), 300);
      }
    } catch (err) {
      setTogglingTaskId(null);
      setDialog({
        isOpen: true,
        title: "Error updating task",
        message: err instanceof Error ? err.message : "Failed to update task",
      });
    }
  }, [updateTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline || !formData.course_id) {
      setDialog({
        isOpen: true,
        title: "Missing required fields",
        message: "Please fill in Task Title, Course, and Deadline before saving.",
      });
      return;
    }
    try {
      if (editingId) {
        await updateTask(editingId, formData as Partial<Task>);
        setEditingId(null);
      } else {
        await createTask({ ...formData, user_id: userId } as TaskCreate);
      }
      setFormData({ title: "", category: "assignment", course_id: "", deadline: "", estimated_hours: 2, priority: 2, description: "", user_id: userId });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      category: (task.category as TaskCategory | undefined) || "assignment",
      course_id: task.course_id,
      deadline: toDateTimeLocalValue(task.deadline),
      estimated_hours: task.estimated_hours,
      priority: task.priority,
      description: task.description,
      user_id: task.user_id,
    });
    setEditingId(task.id);
    setShowForm(true);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setDialog({
      isOpen: true,
      title: "Delete task?",
      message: "This task will be permanently removed.",
      confirmText: "Delete",
      cancelText: "Keep",
      destructive: true,
      onConfirm: async () => {
        await deleteTask(id);
        setDialog({ isOpen: false, title: "", message: "" });
      },
    });
  };

  const handleEstimateTaskTime = async (task: Task) => {
    if (!userId || userId === "user_demo") {
      setDialog({
        isOpen: true,
        title: "Sign in required",
        message: "Please sign in to use AI estimated time.",
      });
      return;
    }

    try {
      setEstimatingTaskId(task.id);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/tasks/${task.id}/estimate-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, apply_estimate: false }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to estimate task time");
      }

      const data = await response.json();
      const aiEstimatedHours = Number(data?.estimated_hours);
      if (!Number.isFinite(aiEstimatedHours) || aiEstimatedHours <= 0) {
        throw new Error("AI returned an invalid estimate. Please try again.");
      }
      setDialog({
        isOpen: true,
        title: "AI estimated time",
        message: `AI estimate: ${aiEstimatedHours} hours`,
        confirmText: "Update Estimated Time",
        cancelText: "Keep Current",
        onConfirm: async () => {
          await updateTask(task.id, { estimated_hours: aiEstimatedHours });
          setDialog({
            isOpen: true,
            title: "Estimated time updated",
            message: `Estimated time is now ${aiEstimatedHours} hours.`,
          });
        },
      });
    } catch (err) {
      const isNetworkError = err instanceof TypeError;
      setDialog({
        isOpen: true,
        title: "Could not estimate time",
        message: isNetworkError
          ? `Could not reach the backend API at ${getApiBaseUrl()}. Start the backend server or set NEXT_PUBLIC_API_URL.`
          : err instanceof Error
            ? err.message
            : "Unexpected error while estimating task time.",
      });
    } finally {
      setEstimatingTaskId(null);
    }
  };

  const handleDeleteAllTasks = () => {
    if (tasks.length === 0 || deletingAllTasks) {
      return;
    }

    setDialog({
      isOpen: true,
      title: "Delete all tasks?",
      message: "This will permanently remove every task in your account.",
      confirmText: "Delete All",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        const taskIds = tasks.map((task) => task.id);
        if (taskIds.length === 0) {
          setDialog({ isOpen: false, title: "", message: "" });
          return;
        }

        setDeletingAllTasks(true);
        let deletedCount = 0;
        let failedCount = 0;

        for (const taskId of taskIds) {
          try {
            await deleteTask(taskId);
            deletedCount += 1;
          } catch (err) {
            failedCount += 1;
            console.error(`Failed to delete task ${taskId}:`, err);
          }
        }

        await loadTasks();
        setCourseFilter("all");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          title: "",
          category: "assignment",
          course_id: "",
          deadline: "",
          estimated_hours: 2,
          priority: 2,
          description: "",
          user_id: userId,
        });
        setDeletingAllTasks(false);

        if (failedCount === 0) {
          setDialog({
            isOpen: true,
            title: "Tasks deleted",
            message: `Deleted ${deletedCount} task${deletedCount === 1 ? "" : "s"}.`,
          });
          return;
        }

        setDialog({
          isOpen: true,
          title: "Some tasks could not be deleted",
          message: `Deleted ${deletedCount} of ${taskIds.length} tasks. ${failedCount} failed.`,
        });
      },
    });
  };

  const getCourseName = (courseId: string | undefined) => {
    if (!courseId) return "No Course";
    return courses.find((c) => c.id === courseId)?.name || "Unknown Course";
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return "bg-red-100 text-red-800";
      case 4: return "bg-orange-100 text-orange-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 2: return "bg-blue-100 text-blue-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels: { [key: number]: string } = { 5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Very Low" };
    return labels[priority] || "Unknown";
  };

  const toggleDescriptionExpanded = (taskId: string) => {
    setExpandedDescriptionTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const now = new Date();
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const overdueTasks = tasks.filter(
    (task) => !task.completed && new Date(task.deadline).getTime() < now.getTime()
  ).length;
  const assignmentCount = tasks.filter((task) => (task.category || "assignment") === "assignment").length;
  const examCount = tasks.filter((task) => (task.category || "assignment") === "exam").length;
  const projectCount = tasks.filter((task) => (task.category || "assignment") === "project").length;

  const getDeadlineTime = (task: Task) => new Date(task.deadline).getTime();

  const filteredTasks = useMemo(() => {
    const getCourseName = (courseId: string | undefined) => {
      if (!courseId) return "No Course";
      return courses.find((c) => c.id === courseId)?.name || "Unknown Course";
    };

    const base = tasks.filter((task) =>
      activeTab === "completed" ? task.completed : !task.completed
    );

    const q = searchQuery.trim().toLowerCase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);

    const matchesDeadline = (task: Task) => {
      const d = new Date(task.deadline);
      if (isNaN(d.getTime())) return false;
      if (deadlineFilter === "all") return true;
      if (deadlineFilter === "today") return d >= startOfToday && d < endOfToday;
      if (deadlineFilter === "next7") return d >= new Date() && d <= next7;
      if (deadlineFilter === "next30") return d >= new Date() && d <= next30;
      if (deadlineFilter === "overdue") return d < new Date();
      return true;
    };

    const searchedAndFiltered = base.filter((task) => {
      const courseName = getCourseName(task.course_id).toLowerCase();
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        title.includes(q) ||
        courseName.includes(q) ||
        description.includes(q);

      const matchesCourse = courseFilter === "all" || task.course_id === courseFilter;
      const matchesType = typeFilter === "all" || (task.category || "assignment") === typeFilter;

      return matchesSearch && matchesCourse && matchesDeadline(task) && matchesType;
    });

    return searchedAndFiltered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        case "deadline_desc":
          const diff1 = getDeadlineTime(b) - getDeadlineTime(a);
          return diff1 !== 0 ? diff1 : a.title.localeCompare(b.title);
        case "priority_desc":
          const diff2 = b.priority - a.priority;
          return diff2 !== 0 ? diff2 : a.title.localeCompare(b.title);
        case "deadline_asc":
        default:
          const diff3 = getDeadlineTime(a) - getDeadlineTime(b);
          return diff3 !== 0 ? diff3 : a.title.localeCompare(b.title);
      }
    });
  }, [tasks, activeTab, searchQuery, sortBy, courseFilter, deadlineFilter, typeFilter, courses]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    startTransition(() => setCurrentPage(1));
  }, [activeTab, searchQuery, sortBy, courseFilter, deadlineFilter, typeFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) startTransition(() => setCurrentPage(totalPages));
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex-1">
        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          {/* Header */}
          <div className="mb-8 rounded-2xl border border-white/50 dark:border-slate-700/50 theme-header-gradient p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Tasks</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  Manage your tasks and deadlines to generate better study sessions.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Total: {tasks.length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Pending: {pendingTasks}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Completed: {completedTasks}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Overdue: {overdueTasks}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100/85 dark:bg-sky-900/30 border border-sky-200/70 dark:border-sky-800/40 text-sky-800 dark:text-sky-200">
                    Assignments: {assignmentCount}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/85 dark:bg-rose-900/30 border border-rose-200/70 dark:border-rose-800/40 text-rose-800 dark:text-rose-200">
                    Exams: {examCount}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100/85 dark:bg-violet-900/30 border border-violet-200/70 dark:border-violet-800/40 text-violet-800 dark:text-violet-200">
                    Projects: {projectCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowForm(true); setEditingId(null);
                    setFormData({ title: "", category: "assignment", course_id: "", deadline: "", estimated_hours: 2, priority: 2, description: "", user_id: userId });
                  }}
                  disabled={courses.length === 0}
                  title={courses.length === 0 ? "Add a course first to create tasks" : "Create a new task"}
                  className="text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--theme-accent-strong)",
                    boxShadow: "0 10px 30px -18px var(--theme-accent-strong)",
                  }}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  New Task
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/60 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* No Courses Warning */}
          {courses.length === 0 && tasks.length === 0 && !showForm && (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700/40 mb-6">
              <p className="text-slate-600 dark:text-slate-300 text-lg font-semibold mb-2">No courses added yet.</p>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Please add a course first before creating tasks.</p>
              <a
                href="/courses"
                className="inline-flex items-center gap-2 text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-md"
                style={{
                  backgroundColor: "var(--theme-accent-strong)",
                  boxShadow: "0 10px 30px -18px var(--theme-accent-strong)",
                }}
              >
                <span className="material-symbols-outlined text-sm">school</span>
                Go to Courses
              </a>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700/40">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                {editingId ? "Edit Task" : "Create New Task"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Task Title *</label>
                    <input type="text" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Finish calculus worksheet"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Type</label>
                    <select
                      value={(formData.category as TaskCategory) || "assignment"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Course *</label>
                    <select value={formData.course_id || ""} onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800">
                      <option value="">Select a course</option>
                      {courses.map((course) => (<option key={course.id} value={course.id}>{course.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Deadline *</label>
                    <input type="datetime-local" value={formData.deadline || ""} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Estimated Hours</label>
                    <input type="number" min="0.5" step="0.5" value={formData.estimated_hours || 2}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Priority</label>
                    <select value={formData.priority || 2} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800">
                      <option value="1">Very Low</option>
                      <option value="2">Low</option>
                      <option value="3">Medium</option>
                      <option value="4">High</option>
                      <option value="5">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                  <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details about the task" rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading}
                    className="text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--theme-accent-strong)",
                      boxShadow: "0 10px 30px -18px var(--theme-accent-strong)",
                    }}>
                    {loading ? "Saving..." : editingId ? "Update Task" : "Create Task"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-2.5 px-6 rounded-xl transition border border-slate-200 dark:border-slate-600">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Task Controls */}
          {(courses.length > 0 || tasks.length > 0) && (
            <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-4 md:p-5 backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "pending"
                      ? "text-white"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                  }`}
                  style={activeTab === "pending" ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                >
                  Pending ({pendingTasks})
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "completed"
                      ? "text-white"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                  }`}
                  style={activeTab === "completed" ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                >
                  Completed ({completedTasks})
                </button>
                <button
                  onClick={handleDeleteAllTasks}
                  disabled={tasks.length === 0 || deletingAllTasks}
                  title={tasks.length === 0 ? "No tasks to delete" : "Delete all tasks"}
                  className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold transition border disabled:opacity-50 disabled:cursor-not-allowed text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/70 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/35"
                >
                  {deletingAllTasks ? "Deleting..." : "Delete All Tasks"}
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {(["all", "assignment", "exam", "project"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      typeFilter === type
                        ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {type === "all" ? "All Types" : getTaskCategoryLabel(type)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, course, or description"
                  className="xl:col-span-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                />

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                >
                  <option value="deadline_asc">Deadline (earliest)</option>
                  <option value="deadline_desc">Deadline (latest)</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="priority_desc">Priority (high to low)</option>
                </select>

                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                >
                  <option value="all">All courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>

                <select
                  value={deadlineFilter}
                  onChange={(e) => setDeadlineFilter(e.target.value as typeof deadlineFilter)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                >
                  <option value="all">All deadlines</option>
                  <option value="today">Due today</option>
                  <option value="next7">Due in next 7 days</option>
                  <option value="next30">Due in next 30 days</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Showing {filteredTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  –{Math.min(currentPage * pageSize, filteredTasks.length)} of {filteredTasks.length}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Tasks per page</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value) as 5 | 10 | 25 | 50)}
                    className="px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
          {(courses.length > 0 || tasks.length > 0) && (
            <div className="space-y-4">
              {loading && tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-300 text-lg">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700/40">
                  <p className="text-slate-600 dark:text-slate-300 text-lg">
                    No {activeTab} tasks match your current search/filter.
                  </p>
                </div>
              ) : (
                paginatedTasks.map((task) => (
                  <div key={task.id}
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 hover:bg-white/70 dark:hover:bg-slate-800/70 transition group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{getCourseName(task.course_id)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTaskCategoryPillClass((task.category as TaskCategory) || "assignment")}`}>
                          {getTaskCategoryLabel((task.category as TaskCategory) || "assignment")}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <div className="mb-4">
                        {(() => {
                          const descriptionPreview = task.description.length > DESCRIPTION_PREVIEW_LIMIT &&
                            !expandedDescriptionTaskIds.has(task.id)
                              ? `${task.description.slice(0, DESCRIPTION_PREVIEW_LIMIT).trimEnd()}...`
                              : task.description;

                          return (
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                          {renderDescriptionWithLinks(descriptionPreview)}
                        </p>
                          );
                        })()}
                        {task.description.length > DESCRIPTION_PREVIEW_LIMIT ? (
                          <button
                            type="button"
                            onClick={() => toggleDescriptionExpanded(task.id)}
                            className="mt-1 text-xs font-semibold text-[#306844] hover:text-[#255236] dark:text-emerald-300 dark:hover:text-emerald-200"
                          >
                            {expandedDescriptionTaskIds.has(task.id) ? "Show less" : "Show more"}
                          </button>
                        ) : null}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      <div>
                        <span className="font-medium">Deadline:</span>{" "}
                        {new Date(task.deadline).toLocaleDateString()} at{" "}
                        {new Date(task.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div><span className="font-medium">Estimated:</span> {task.estimated_hours} hrs</div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {task.completed
                          ? <span className="text-green-600">Completed</span>
                          : <span className="text-orange-600">Pending</span>}
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap items-center">
                      {/* Checkbox for task completion */}
                      <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium py-1.5 px-3 -ml-3 rounded-lg transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTaskCompletion(task.id, task.completed)}
                          disabled={togglingTaskId === task.id}
                          className="w-5 h-5 cursor-pointer accent-emerald-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={task.completed ? "Mark as pending" : "Mark as completed"}
                        />
                        <span>
                          {togglingTaskId === task.id ? "Updating..." : task.completed ? "Completed" : "Mark complete"}
                        </span>
                      </label>
                      
                      <button
                        onClick={() => handleEstimateTaskTime(task)}
                        disabled={estimatingTaskId === task.id}
                        className="text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium py-1.5 px-3 rounded-lg transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {estimatingTaskId === task.id ? "Estimating..." : "Get AI Estimated Time"}
                      </button>
                      <button onClick={() => handleEdit(task)}
                        className="text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium py-1.5 px-3 rounded-lg transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(task.id)}
                        className="text-slate-500 dark:text-slate-400 hover:text-red-600 font-medium py-1.5 px-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}

              {!loading && filteredTasks.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/65 px-3 py-2.5 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/55">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-slate-200/90 disabled:hover:bg-white/90 disabled:hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 dark:disabled:hover:border-slate-600 dark:disabled:hover:bg-slate-800 dark:disabled:hover:text-slate-200"
                  >
                    <span aria-hidden="true">←</span>
                    Previous
                  </button>
                  <span className="rounded-xl border border-white/70 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-200">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-slate-200/90 disabled:hover:bg-white/90 disabled:hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 dark:disabled:hover:border-slate-600 dark:disabled:hover:bg-slate-800 dark:disabled:hover:text-slate-200"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <AppDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        destructive={dialog.destructive}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ isOpen: false, title: "", message: "" })}
      />
      <Footer />
    </div>
  );
}
