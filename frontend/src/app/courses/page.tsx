"use client";

import { useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { CourseCreate, Course } from "@/types";

export default function CoursesPage() {
  const {
    userId,
    courses,
    loadCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    loading,
    error,
  } = usePlanner();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CourseCreate>>({
    name: "",
    code: "",
    professor: "",
    description: "",
    user_id: userId,
  });

  useEffect(() => {
    loadCourses();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      alert("Please fill in required fields");
      return;
    }

    try {
      if (editingId) {
        await updateCourse(editingId, formData as Partial<Course>);
        setEditingId(null);
      } else {
        await createCourse(formData as CourseCreate);
      }
      setFormData({
        name: "",
        code: "",
        professor: "",
        description: "",
        user_id: userId,
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving course:", err);
    }
  };

  const handleEdit = (course: Course) => {
    setFormData({
      name: course.name,
      code: course.code,
      professor: course.professor,
      description: course.description,
      user_id: course.user_id,
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this course?")) {
      await deleteCourse(id);
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Courses</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Manage your courses and class information
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                name: "",
                code: "",
                professor: "",
                description: "",
                user_id: userId,
              });
            }}
            className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-green-900/10"
          >
            {showForm ? "Cancel" : "+ New Course"}
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
              {editingId ? "Edit Course" : "Create New Course"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Calculus II"
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g., MATH 241"
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Professor
                  </label>
                  <input
                    type="text"
                    value={formData.professor || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, professor: e.target.value })
                    }
                    placeholder="e.g., Dr. Smith"
                    className="w-full px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
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
                  placeholder="Course details and notes"
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
                  {loading ? "Saving..." : editingId ? "Update Course" : "Create Course"}
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

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600 dark:text-slate-300 text-lg">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/50 dark:border-slate-700/50">
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                No courses yet. Create one to get started!
              </p>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-700/40 shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {course.name}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                    {course.code}
                  </span>
                </div>
                {course.professor && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    <span className="font-medium">Professor:</span> {course.professor}
                  </p>
                )}
                {course.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="flex-1 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-medium py-2 rounded-xl transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex-1 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-medium py-2 rounded-xl transition"
                  >
                    Delete
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
