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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Courses</h1>
            <p className="text-slate-600 mt-2">Manage your courses and class information</p>
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ New Course"}
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
              {editingId ? "Edit Course" : "Create New Course"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Calculus II"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g., MATH 241"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Professor
                  </label>
                  <input
                    type="text"
                    value={formData.professor || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, professor: e.target.value })
                    }
                    placeholder="e.g., Dr. Smith"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
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
                  placeholder="Course details and notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingId ? "Update Course" : "Create Course"}
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

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600 text-lg">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg p-8 text-center border border-slate-200">
              <p className="text-slate-600 text-lg">
                No courses yet. Create one to get started!
              </p>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md p-6 border-t-4 border-t-blue-500 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {course.name}
                </h3>
                <p className="text-sm font-medium text-blue-600 mb-3">
                  {course.code}
                </p>
                {course.professor && (
                  <p className="text-sm text-slate-700 mb-2">
                    <span className="font-medium">Professor:</span> {course.professor}
                  </p>
                )}
                {course.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 rounded-lg transition"
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
