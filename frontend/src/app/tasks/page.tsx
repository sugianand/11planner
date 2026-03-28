"use client";

import { useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { Task, TaskCreate } from "@/types";
import Footer from "@/components/Footer";

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
  }, [userId, loadCourses, loadTasks]);

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
        await createTask({ ...formData, user_id: userId } as TaskCreate);
      }
      setFormData({ title: "", course_id: "", deadline: "", estimated_hours: 2, priority: 2, description: "", user_id: userId });
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
    if (confirm("Delete this task?")) await deleteTask(id);
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

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  const now = new Date();
  const pendingTasks = assignments.filter((assignment) => !assignment.completed).length;
  const completedTasks = assignments.filter((assignment) => assignment.completed).length;
  const overdueTasks = assignments.filter(
    (assignment) => !assignment.completed && new Date(assignment.deadline).getTime() < now.getTime()
  ).length;

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex-1">
        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          {/* Header */}
          <div className="mb-8 rounded-2xl border border-white/50 dark:border-slate-700/50 bg-gradient-to-r from-white/80 via-white/70 to-emerald-50/70 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-emerald-900/20 p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Tasks</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  Manage your tasks and deadlines to generate better study sessions.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Total: {assignments.length}
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
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowForm(true); setEditingId(null);
                    setFormData({ title: "", course_id: "", deadline: "", estimated_hours: 2, priority: 2, description: "", user_id: userId });
                  }}
                  disabled={courses.length === 0}
                  title={courses.length === 0 ? "Add a course first to create tasks" : "Create a new task"}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <a href="/courses" className="inline-flex items-center gap-2 bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-md">
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
                    placeholder="Additional details about the assignment" rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading}
                    className="bg-[#306844] hover:bg-[#255236] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50">
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

          {/* Tasks List */}
          {(courses.length > 0 || tasks.length > 0) && (
            <div className="space-y-4">
              {loading && tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-300 text-lg">Loading tasks...</p>
                </div>
              ) : sortedTasks.length === 0 ? (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700/40">
                  <p className="text-slate-600 dark:text-slate-300 text-lg">
                    No tasks yet. Create one or import from Canvas!
                  </p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <div key={task.id}
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 hover:bg-white/70 dark:hover:bg-slate-800/70 transition group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{getCourseName(task.course_id)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">{task.description}</p>
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

                    <div className="flex gap-3 flex-wrap">
                      <button onClick={() => handleEdit(task)}
                        className="text-slate-500 dark:text-slate-400 hover:text-[#002966] dark:hover:text-blue-400 font-medium py-1.5 px-3 rounded-lg transition hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(task.id)}
                        className="text-slate-500 dark:text-slate-400 hover:text-red-600 font-medium py-1.5 px-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20">
                        Delete
                      </button>
                      <button onClick={() => updateTask(task.id, { completed: !task.completed })}
                        className={`font-bold py-1.5 px-4 rounded-lg transition shadow-sm ${task.completed
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                          : "bg-[#306844] text-white hover:bg-[#255236]"}`}>
                        {task.completed ? "Undo" : "Complete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
