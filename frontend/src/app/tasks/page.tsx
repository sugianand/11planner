"use client";

import { useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { Task, TaskCreate } from "@/types";

export default function TasksPage() {
  const {
    userId,
    tasks,
    courses,
    loadTasks,
    loadCourses,
    createTask,
    updateTask,
    deleteTask,
    loading,
    error,
  } = usePlanner();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TaskCreate>>({
    title: "",
    course_id: "",
    deadline: "",
    estimated_hours: 2,
    priority: 2,
    description: "",
    user_id: userId,
  });

  useEffect(() => {
    loadCourses();
    loadTasks();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.deadline || !formData.course_id) {
      alert("Please fill in required fields");
      return;
    }

    try {
      if (editingId) {
        await updateTask(editingId, formData as Partial<Task>);
        setEditingId(null);
      } else {
        await createTask(formData as TaskCreate);
      }
      setFormData({
        title: "",
        course_id: "",
        deadline: "",
        estimated_hours: 2,
        priority: 2,
        description: "",
        user_id: userId,
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      course_id: task.course_id,
      deadline: task.deadline,
      estimated_hours: task.estimated_hours,
      priority: task.priority,
      description: task.description,
      user_id: task.user_id,
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) {
      await deleteTask(id);
    }
  };

  const getCourseName = (courseId: string | undefined) => {
    if (!courseId) return "No Course";
    const course = courses.find((c) => c.id === courseId);
    return course?.name || "Unknown Course";
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return "bg-red-100 text-red-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels: { [key: number]: string } = {
      5: "Critical",
      4: "High",
      3: "Medium",
      2: "Low",
      1: "Very Low",
    };
    return labels[priority] || "Unknown";
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 p-6 lg:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-emerald-200/40 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.2),transparent_55%)]" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tasks</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Manage your assignments and deadlines
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                title: "",
                course_id: "",
                deadline: "",
                estimated_hours: 2,
                priority: 2,
                description: "",
                user_id: userId,
              });
            }}
            className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-green-900/10"
          >
            {showForm ? "Cancel" : "+ New Task"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-200 px-4 py-3 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-white/50 dark:border-slate-700/50 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              {editingId ? "Edit Task" : "Create New Task"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Finish calculus homework"
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Course *
                  </label>
                  <select
                    value={formData.course_id || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, course_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimated_hours || 2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_hours: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority || 2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1">Very Low</option>
                    <option value="2">Low</option>
                    <option value="3">Medium</option>
                    <option value="4">High</option>
                    <option value="5">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Additional details about the task"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10 disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingId ? "Update Task" : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="bg-white/70 dark:bg-slate-800/70 hover:bg-white text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-6 rounded-xl transition border border-slate-200/80 dark:border-slate-700/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {loading && tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-300 text-lg">Loading tasks...</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/50 dark:border-slate-700/50">
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                No tasks yet. Create one to get started!
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-700/40 shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {getCourseName(task.course_id)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">{task.description}</p>

                <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300 mb-4">
                  <div>
                    <span className="font-medium">Deadline:</span>{" "}
                    {new Date(task.deadline).toLocaleDateString()} at{" "}
                    {new Date(task.deadline).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Estimated:</span>{" "}
                    {task.estimated_hours} hours
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {task.completed ? (
                      <span className="text-emerald-600">Completed</span>
                    ) : (
                      <span className="text-amber-600">In Progress</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(task)}
                    className="bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-medium py-2 px-4 rounded-xl transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-medium py-2 px-4 rounded-xl transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      updateTask(task.id, { completed: !task.completed })
                    }
                    className="bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-medium py-2 px-4 rounded-xl transition"
                  >
                    {task.completed ? "Undo" : "Complete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
