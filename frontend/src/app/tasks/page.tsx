"use client";

import { useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { Assignment, AssignmentCreate } from "@/types";
import Footer from "@/components/Footer";

export default function TasksPage() {
  const {
    userId,
    assignments,
    courses,
    loadAssignments,
    loadCourses,
    loadTasks,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    loading,
    error,
  } = usePlanner();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AssignmentCreate>>({
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
    loadAssignments();
    loadTasks();
  }, [userId, loadCourses, loadAssignments, loadTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline || !formData.course_id) {
      alert("Please fill in required fields");
      return;
    }
    try {
      if (editingId) {
        await updateAssignment(editingId, formData as Partial<Assignment>);
        setEditingId(null);
      } else {
        await createAssignment({ ...formData, user_id: userId } as AssignmentCreate);
      }
      setFormData({ title: "", course_id: "", deadline: "", estimated_hours: 2, priority: 2, description: "", user_id: userId });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving assignment:", err);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      title: assignment.title,
      course_id: assignment.course_id,
      deadline: assignment.deadline,
      estimated_hours: assignment.estimated_hours,
      priority: assignment.priority,
      description: assignment.description,
      user_id: assignment.user_id,
    });
    setEditingId(assignment.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this assignment?")) await deleteAssignment(id);
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

  const getSourceBadge = (source?: string) => {
    if (source === "canvas") return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
        Canvas Import
      </span>
    );
    return null;
  };

  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-6xl w-full mx-auto p-6 md:p-12 flex-1">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Assignments</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Manage your assignments — the schedule generator will break these into focus sessions
              </p>
            </div>
            <button
              onClick={() => {
                if (courses.length === 0) { alert("Please add a course first before creating assignments."); return; }
                setShowForm(true); setEditingId(null);
                setFormData({ title: "", course_id: "", deadline: "", estimated_hours: 2, priority: 2, description: "", user_id: userId });
              }}
              className="bg-[#306844] hover:bg-[#255236] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Assignment
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/60 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* No Courses Warning */}
          {courses.length === 0 && assignments.length === 0 && !showForm && (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700/40 mb-6">
              <p className="text-slate-600 dark:text-slate-300 text-lg font-semibold mb-2">No courses added yet.</p>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Please add a course first before creating assignments.</p>
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
                {editingId ? "Edit Assignment" : "Create New Assignment"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Assignment Title *</label>
                    <input type="text" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Finish calculus homework"
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
                    {loading ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-2.5 px-6 rounded-xl transition border border-slate-200 dark:border-slate-600">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assignments List */}
          {(courses.length > 0 || assignments.length > 0) && (
            <div className="space-y-4">
              {loading && assignments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-300 text-lg">Loading assignments...</p>
                </div>
              ) : sortedAssignments.length === 0 ? (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700/40">
                  <p className="text-slate-600 dark:text-slate-300 text-lg">
                    No assignments yet. Create one or import from Canvas!
                  </p>
                </div>
              ) : (
                sortedAssignments.map((assignment) => (
                  <div key={assignment.id}
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 hover:bg-white/70 dark:hover:bg-slate-800/70 transition group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{assignment.title}</h3>
                          {getSourceBadge(assignment.source)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{getCourseName(assignment.course_id)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(assignment.priority)}`}>
                        {getPriorityLabel(assignment.priority)}
                      </span>
                    </div>

                    {assignment.description && (
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">{assignment.description}</p>
                    )}

                    <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      <div>
                        <span className="font-medium">Deadline:</span>{" "}
                        {new Date(assignment.deadline).toLocaleDateString()} at{" "}
                        {new Date(assignment.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div><span className="font-medium">Estimated:</span> {assignment.estimated_hours} hrs</div>
                      {assignment.points && <div><span className="font-medium">Points:</span> {assignment.points}</div>}
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {assignment.completed
                          ? <span className="text-green-600">Completed</span>
                          : <span className="text-orange-600">Pending</span>}
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      {assignment.source !== "canvas" && (
                        <button onClick={() => handleEdit(assignment)}
                          className="text-slate-500 dark:text-slate-400 hover:text-[#002966] dark:hover:text-blue-400 font-medium py-1.5 px-3 rounded-lg transition hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          Edit
                        </button>
                      )}
                      <button onClick={() => handleDelete(assignment.id)}
                        className="text-slate-500 dark:text-slate-400 hover:text-red-600 font-medium py-1.5 px-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20">
                        Delete
                      </button>
                      <button onClick={() => updateAssignment(assignment.id, { completed: !assignment.completed })}
                        className={`font-bold py-1.5 px-4 rounded-lg transition shadow-sm ${assignment.completed
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                          : "bg-[#306844] text-white hover:bg-[#255236]"}`}>
                        {assignment.completed ? "Undo" : "Complete"}
                      </button>
                      {assignment.url && (
                        <a href={assignment.url} target="_blank" rel="noopener noreferrer"
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 font-medium py-1.5 px-3 rounded-lg transition hover:bg-purple-50 dark:hover:bg-purple-900/20">
                          View on Canvas ↗
                        </a>
                      )}
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
