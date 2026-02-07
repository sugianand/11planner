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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600 mt-2">
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ New Task"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-slate-200">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {editingId ? "Edit Task" : "Create New Task"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Finish calculus homework"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course *
                  </label>
                  <select
                    value={formData.course_id || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, course_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Additional details about the task"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingId ? "Update Task" : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 px-6 rounded-lg transition"
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
              <p className="text-slate-600 text-lg">Loading tasks...</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-slate-200">
              <p className="text-slate-600 text-lg">
                No tasks yet. Create one to get started!
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
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

                <p className="text-slate-700 text-sm mb-4">{task.description}</p>

                <div className="flex flex-wrap gap-6 text-sm text-slate-600 mb-4">
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
                      <span className="text-green-600">Completed</span>
                    ) : (
                      <span className="text-orange-600">In Progress</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(task)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      updateTask(task.id, { completed: !task.completed })
                    }
                    className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition"
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
