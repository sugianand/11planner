"use client";

import { useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { CourseCreate, Course } from "@/types";

export default function CoursesPage() {
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
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
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CourseCreate>>({
    name: "",
    code: "",
    professor: "",
    description: "",
    user_id: userId,
    courseDate: "",
    startTime: "",
    endTime: "",
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
        courseDate: "",
        startTime: "",
        endTime: "",
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
      courseDate: course.courseDate,
      startTime: course.startTime,
      endTime: course.endTime,
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this course?")) {
      await deleteCourse(id);
    }
  };

  const selectedDays = (formData.courseDate || "")
    .split(" ")
    .filter(Boolean);

  const toggleDay = (day: string, checked: boolean) => {
    const nextDays = checked
      ? [...new Set([...selectedDays, day])]
      : selectedDays.filter((d) => d !== day);

    setFormData({
      ...formData,
      courseDate: nextDays.join(" "),
    });
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Courses</h1>
              <p className="text-slate-600 mt-2">Manage your courses and class information</p>
            </div>
                {!showForm && (
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setFormData({
                        name: "",
                        code: "",
                        professor: "",
                        description: "",
                        user_id: userId,
                        courseDate: "",
                        startTime: "",
                        endTime: "",
                      });
                    }}
                    className="bg-[#306844] hover:bg-[#255236] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    New Course
                  </button>
                )}
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


                  

                    <div className="block text-sm font-medium text-slate-700 mb-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Course Days *
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowDaysDropdown((prev) => !prev)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                        >
                          {selectedDays.length > 0
                            ? selectedDays.join(", ")
                            : "Select course days"}
                        </button>

                        {showDaysDropdown && (
                          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg p-3 space-y-2">
                            {weekDays.map((day) => (
                              <label key={day} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDays.includes(day)}
                                  onChange={(e) => toggleDay(day, e.target.checked)}
                                  className="form-checkbox h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700">{day}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Time*
                    </label>
                    <input
                      type="text"
                      value={formData.startTime || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      placeholder="e.g. 9:00 AM"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      End Time*
                    </label>
                    <input
                      type="text"
                      value={formData.endTime || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      placeholder="e.g: 10:00 AM"
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
                    className="bg-[#306844] hover:bg-[#255236] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editingId ? "Update Course" : "Create Course"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-2.5 px-6 rounded-xl transition border border-slate-200 dark:border-slate-600"
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
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 hover:bg-white/70 dark:hover:bg-slate-800/70 transition group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#306844]"></div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {course.name}
                  </h3>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#306844] dark:text-green-400 mb-4">
                    {course.code}
                  </p>
                  {course.professor && (
                    <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-sm opacity-60">person</span>
                      <p className="text-sm font-medium">{course.professor}</p>
                    </div>
                  )}
                  {course.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 pl-6 border-l-2 border-slate-200 dark:border-slate-600 ml-1">
                      {course.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      onClick={() => handleEdit(course)}
                      className="flex-1 text-slate-500 hover:text-[#002966] dark:hover:text-blue-400 font-medium py-1.5 px-3 rounded-lg transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="flex-1 text-slate-500 hover:text-red-600 font-medium py-1.5 px-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20"
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
    </div>
  );
}
