"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { CourseCreate, Course } from "@/types";
import Footer from "@/components/Footer";
import AppDialog from "@/components/AppDialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
// normalizes time string to HH:MM format for consistent display and comparison, supporting both 24-hour and 12-hour inputs with optional seconds
const toTimeInputValue = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
// Check for HH:MM or HH:MM:SS format (24-hour)
  const isoMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (isoMatch) {
    const hour = Math.min(23, Math.max(0, parseInt(isoMatch[1], 10)));
    const minute = Math.min(59, Math.max(0, parseInt(isoMatch[2], 10)));
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
// Check for HH:MM AM/PM format (12-hour)
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1], 10);
    const minute = parseInt(amPmMatch[2], 10);
    const meridiem = amPmMatch[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return "";
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return "";
};
// Course page component to create, edit, and delete courses with validation, syllabus upload and parsing, filtering/sorting, and error handling
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
// State for managing form visibility, editing mode, search/sort/filter options, syllabus upload, and dialogs for feedback and confirmation
  const [showForm, setShowForm] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "time_asc" | "time_desc">("name_asc");
  const [typeFilter, setTypeFilter] = useState<"all" | "online" | "in_person" | "lab">("all");
  const cardSyllabusInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const courseDaysDropdownRef = useRef<HTMLDivElement | null>(null);
  const lastShownErrorRef = useRef<string | null>(null);
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
  const [formData, setFormData] = useState<Partial<CourseCreate>>({
    name: "",
    code: "",
    professor: "",
    description: "",
    user_id: userId,
    courseDate: "",
    startTime: "",
    endTime: "",
    isOnline: false,
    hasLab: false,
    labDay: "",
    labStartTime: "",
    labEndTime: "",
    labIsOnline: false,
  });

  useEffect(() => {
    loadCourses();
  }, [userId, loadCourses]);
// Closes the course days dropdown when clicking outside of it, with event listeners for both mouse and touch interactions
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!showDaysDropdown) return;
      if (courseDaysDropdownRef.current?.contains(event.target as Node)) return;
      setShowDaysDropdown(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showDaysDropdown]);

  useEffect(() => {
    if (!error || error === lastShownErrorRef.current) {
      return;
    }

    lastShownErrorRef.current = error;
    const timeoutId = window.setTimeout(() => {
      setDialog({
        isOpen: true,
        title: "Could not save course",
        message: error,
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [error]);
// checks to see if user needs to go through preference quiz by checking if any of the key preference fields are missing from their profile, returning true if they should be sent to onboarding quiz
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      setDialog({
        isOpen: true,
        title: "Missing required fields",
        message: "Please fill in Course Name and Course Code before saving.",
      });
      return;
    }

    const isOnline = !!formData.isOnline;
    const isLabOnline = !!formData.labIsOnline;

    if (!isOnline) {
      if (!formData.courseDate || !formData.startTime || !formData.endTime) {
        setDialog({
          isOpen: true,
          title: "Missing course time",
          message: "Please add course days, start time, and end time before saving this in-person course.",
        });
        return;
      }
// Validate that start time is before end time for both course and lab sections, showing appropriate error messages if not
      if (formData.startTime >= formData.endTime) {
        setDialog({
          isOpen: true,
          title: "Invalid course time",
          message: "The start time must be earlier than the end time.",
        });
        return;
      }
    }
// If course has a lab section, validate that lab times are properly filled out and that lab start time is before lab end time, showing appropriate error messages if not
    if (formData.hasLab && !isLabOnline) {
      if (!formData.labDay || !formData.labStartTime || !formData.labEndTime) {
        setDialog({
          isOpen: true,
          title: "Missing lab time",
          message: "Please add lab day, start time, and end time before saving this lab section.",
        });
        return;
      }

      if (formData.labStartTime >= formData.labEndTime) {
        setDialog({
          isOpen: true,
          title: "Invalid lab time",
          message: "The lab start time must be earlier than the end time.",
        });
        return;
      }
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
        isOnline: false,
        hasLab: false,
        labDay: "",
        labStartTime: "",
        labEndTime: "",
        labIsOnline: false,
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving course:", err);
      const message = err instanceof Error ? err.message : "Unable to save this course right now. Please try again.";
      const isTimeIssue = /time/i.test(message);
      setDialog({
        isOpen: true,
        title: isTimeIssue ? "Time issue" : "Could not save course",
        message: isTimeIssue
          ? message.includes("start time") || message.includes("end time")
            ? message
            : "The course could not be saved because of a time issue. Please check the course and lab times."
          : message,
      });
    }
  };
  // sets form data to the user's profile info if missing, then checks if onboarding quiz should be shown based on presence of key preference fields, and returns appropriate route for user
  const handleEdit = (course: Course) => {
    setFormData({
      name: course.name,
      code: course.code,
      professor: course.professor,
      description: course.description,
      user_id: course.user_id,
      courseDate: course.courseDate,
      startTime: toTimeInputValue(course.startTime),
      endTime: toTimeInputValue(course.endTime),
      isOnline: course.isOnline || false,
      hasLab: course.hasLab || false,
      labDay: course.labDay || "",
      labStartTime: toTimeInputValue(course.labStartTime),
      labEndTime: toTimeInputValue(course.labEndTime),
      labIsOnline: course.labIsOnline || false,
    });
    setEditingId(course.id);
    setShowForm(true);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setDialog({
      isOpen: true,
      title: "Delete course?",
      message: "This course will be permanently removed.",
      confirmText: "Delete",
      cancelText: "Keep",
      destructive: true,
      onConfirm: async () => {
        await deleteCourse(id);
        setDialog({ isOpen: false, title: "", message: "" });
      },
    });
  };

  const selectedDays = (formData.courseDate || "")
    .split(" ")
    .filter(Boolean);

  const orderedSelectedDays = WEEK_DAYS.filter((day) => selectedDays.includes(day));
// Counts for display in header badges to show how many courses of each type the user has
  const onlineCourses = courses.filter((course) => course.isOnline).length;
  const inPersonCourses = courses.filter((course) => !course.isOnline).length;
  const labCourses = courses.filter((course) => course.hasLab).length;
// Formats time strings for display in the course cards, showing "Time not set" if the time is missing or invalid, and converting to a more user-friendly format
  const formatTimeDisplay = (value?: string | null): string => {
    const normalized = toTimeInputValue(value);
    if (!normalized) return "Time not set";
    const [hourRaw, minuteRaw] = normalized.split(":");
    const hour = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "Time not set";

    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
// Helper function to get start time in minutes for sorting, returning a large number if time is missing or invalid 
  const getCourseStartMinutes = (course: Course): number => {
    const normalized = toTimeInputValue(course.startTime);
    if (!normalized) return Number.MAX_SAFE_INTEGER;
    const [hourRaw, minuteRaw] = normalized.split(":");
    const hour = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.MAX_SAFE_INTEGER;
    return hour * 60 + minute;
  };

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
// filters courses based on search query matching the course name, code, professor, description, or day.
    const filtered = courses.filter((course) => {
      const name = (course.name || "").toLowerCase();
      const code = (course.code || "").toLowerCase();
      const professor = (course.professor || "").toLowerCase();
      const description = (course.description || "").toLowerCase();
      const day = (course.courseDate || "").toLowerCase();
// checks if the course matches the selected type filter (online, in-person, lab, or all)
      const matchesSearch =
        q.length === 0 ||
        name.includes(q) ||
        code.includes(q) ||
        professor.includes(q) ||
        description.includes(q) ||
        day.includes(q);

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "online" && !!course.isOnline) ||
        (typeFilter === "in_person" && !course.isOnline) ||
        (typeFilter === "lab" && !!course.hasLab);

      return matchesSearch && matchesType;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortBy === "time_asc") {
        const diff = getCourseStartMinutes(a) - getCourseStartMinutes(b);
        return diff !== 0 ? diff : (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "time_desc") {
        const diff = getCourseStartMinutes(b) - getCourseStartMinutes(a);
        return diff !== 0 ? diff : (a.name || "").localeCompare(b.name || "");
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [courses, searchQuery, typeFilter, sortBy]);
// toggles the selection of a day in the course days dropdown, updating the form data with the selected days in a consistent order
  const toggleDay = (day: string, checked: boolean) => {
    const nextDays = checked
      ? [...new Set([...selectedDays, day])]
      : selectedDays.filter((d) => d !== day);

    setFormData({
      ...formData,
      courseDate: WEEK_DAYS.filter((weekDay) => nextDays.includes(weekDay)).join(" "),
    });
  };

  const uploadAndParseSyllabus = async (file: File, type: "course" | "lab") => {
    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/syllabus/parse`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json().catch(() => ({ success: false, error: "Invalid server response" }));

      if (!response.ok) {
        setDialog({
          isOpen: true,
          title: `${type === "lab" ? "Lab syllabus" : "Syllabus"} upload failed`,
          message: data.error || `Server error (${response.status}). Please try again.`,
        });
        return;
      }

      if (data.success && data.parsed) {
        if (type === "lab") {
          setFormData((prev) => ({
            ...prev,
            hasLab: true,
            labDay: data.parsed.labDay || data.parsed.courseDate || prev.labDay,
            labStartTime:
              toTimeInputValue(data.parsed.labStartTime || data.parsed.startTime) ||
              prev.labStartTime,
            labEndTime:
              toTimeInputValue(data.parsed.labEndTime || data.parsed.endTime) ||
              prev.labEndTime,
            labIsOnline:
              typeof data.parsed.labIsOnline === "boolean"
                ? data.parsed.labIsOnline
                : typeof data.parsed.isOnline === "boolean"
                ? data.parsed.isOnline
                : prev.labIsOnline,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            name: data.parsed.name || prev.name,
            code: data.parsed.code || prev.code,
            professor: data.parsed.professor || prev.professor,
            description: data.parsed.description || prev.description,
            courseDate: data.parsed.courseDate || prev.courseDate,
            startTime: toTimeInputValue(data.parsed.startTime) || prev.startTime,
            endTime: toTimeInputValue(data.parsed.endTime) || prev.endTime,
            isOnline: data.parsed.isOnline || prev.isOnline,
            hasLab: data.parsed.hasLab || prev.hasLab,
            labDay: data.parsed.labDay || prev.labDay,
            labStartTime: toTimeInputValue(data.parsed.labStartTime) || prev.labStartTime,
            labEndTime: toTimeInputValue(data.parsed.labEndTime) || prev.labEndTime,
            labIsOnline: data.parsed.labIsOnline || prev.labIsOnline,
          }));
        }
      } else {
        setDialog({
          isOpen: true,
          title: `${type === "lab" ? "Lab syllabus" : "Syllabus"} parsing failed`,
          message: data.error || "Could not parse this syllabus. Please fill in details manually.",
        });
      }
    } catch (err) {
      console.error("Error uploading syllabus:", err);
      setDialog({
        isOpen: true,
        title: "Upload error",
        message: "Could not reach the backend. Make sure the backend server is running and try again.",
      });
    }
  };

  const handleUploadSyllabus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadAndParseSyllabus(file, "course");
    inputEl.value = "";
  };
// handles syllabus upload for specific course when user clicks the upload button on a course card, with the file input ref for that course
  const handleUploadLabSyllabus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadAndParseSyllabus(file, "lab");
    inputEl.value = "";
  };

  const handleUploadSyllabusForCourse = async (course: Course, file: File) => {
    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/syllabus/parse`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json().catch(() => ({ success: false, error: "Invalid server response" }));

      if (!response.ok || !data.success || !data.parsed) {
        setDialog({
          isOpen: true,
          title: "Syllabus upload failed",
          message: data.error || "Could not parse this syllabus for the selected course.",
        });
        return;
      }
// updates course with parsed syllabus data, keeping existing values for any fields that are missing from the parsed result, and showing a dialog with the outcome
      const parsed = data.parsed;
      await updateCourse(course.id, {
        name: parsed.name || course.name,
        code: parsed.code || course.code,
        professor: parsed.professor || course.professor,
        description: parsed.description || course.description,
        courseDate: parsed.courseDate || course.courseDate,
        startTime: toTimeInputValue(parsed.startTime) || toTimeInputValue(course.startTime),
        endTime: toTimeInputValue(parsed.endTime) || toTimeInputValue(course.endTime),
        isOnline: typeof parsed.isOnline === "boolean" ? parsed.isOnline : course.isOnline,
        hasLab: typeof parsed.hasLab === "boolean" ? parsed.hasLab : course.hasLab,
        labDay: parsed.labDay || course.labDay,
        labStartTime: toTimeInputValue(parsed.labStartTime) || toTimeInputValue(course.labStartTime),
        labEndTime: toTimeInputValue(parsed.labEndTime) || toTimeInputValue(course.labEndTime),
        labIsOnline: typeof parsed.labIsOnline === "boolean" ? parsed.labIsOnline : course.labIsOnline,
      });

      setDialog({
        isOpen: true,
        title: "Course updated",
        message: `Syllabus parsed and applied to ${course.name}.`,
      });
    } catch {
      setDialog({
        isOpen: true,
        title: "Upload error",
        message: "Could not reach the backend. Make sure the backend server is running and try again.",
      });
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex-1">
        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          {/* Header */}
          <div className="mb-8 rounded-2xl border border-white/50 dark:border-slate-700/50 theme-header-gradient p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Courses</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">Manage your classes, meeting times, and lab schedules in one place.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Total: {courses.length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Online: {onlineCourses}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    In-Person: {inPersonCourses}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Labs: {labCourses}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
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
                        isOnline: false,
                        hasLab: false,
                        labDay: "",
                        labStartTime: "",
                        labEndTime: "",
                        labIsOnline: false,
                      });
                    }}
                    className="text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg flex items-center gap-2"
                    style={{
                      backgroundColor: "var(--theme-accent-strong)",
                      boxShadow: "0 10px 30px -18px var(--theme-accent-strong)",
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    New Course
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl shadow-md p-6 mb-8 border border-slate-200/80 dark:border-slate-700/50">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                {editingId ? "Edit Course" : "Create New Course"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Upload Syllabus Section */}
                <div className="border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                    Upload a syllabus PDF to auto-fill information (optional)
                  </label>
                  <label className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition bg-slate-50/70 dark:bg-slate-900/30">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 mb-2">
                        cloud_upload
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Upload Syllabus PDF
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleUploadSyllabus}
                      className="hidden"
                    />
                  </label>
                </div>

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
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
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
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
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
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                    />
                  </div>

                  {!formData.isOnline && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Course Days *
                      </label>
                      <div className="relative" ref={courseDaysDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowDaysDropdown((prev) => !prev)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                        >
                          {orderedSelectedDays.length > 0
                            ? orderedSelectedDays.join(", ")
                            : "Select course days"}
                        </button>

                        {showDaysDropdown && (
                          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-3 space-y-2">
                            {WEEK_DAYS.map((day) => (
                              <label key={day} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDays.includes(day)}
                                  onChange={(e) => toggleDay(day, e.target.checked)}
                                  className="form-checkbox h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{day}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!formData.isOnline && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          value={formData.startTime || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, startTime: e.target.value })
                          }
                          step={60}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          End Time *
                        </label>
                        <input
                          type="time"
                          value={formData.endTime || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, endTime: e.target.value })
                          }
                          step={60}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={formData.isOnline || false}
                    onChange={(e) => {
                      const isOnline = e.target.checked;
                      setFormData({
                        ...formData,
                        isOnline,
                        courseDate: isOnline ? "" : formData.courseDate,
                        startTime: isOnline ? "" : formData.startTime,
                        endTime: isOnline ? "" : formData.endTime,
                      });
                    }}
                    className="w-4 h-4 text-[#306844] rounded focus:ring-2 focus:ring-[#306844] cursor-pointer"
                  />
                  <label htmlFor="isOnline" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    This is an online/asynchronous class
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasLab"
                    checked={formData.hasLab || false}
                    onChange={(e) =>
                      setFormData({ ...formData, hasLab: e.target.checked })
                    }
                    className="w-4 h-4 text-[#306844] rounded focus:ring-2 focus:ring-[#306844] cursor-pointer"
                  />
                  <label htmlFor="hasLab" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    This course has a lab component
                  </label>
                </div>

                {formData.hasLab && (
                  <div className="border border-slate-200/80 dark:border-slate-700/40 rounded-xl p-4 space-y-4 bg-white/60 dark:bg-slate-900/30">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lab Information</h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                        Upload lab syllabus PDF (optional)
                      </label>
                      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition bg-slate-50/70 dark:bg-slate-900/30">
                        <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200">
                          <span className="material-symbols-outlined text-base">upload_file</span>
                          <span className="text-sm font-medium">Upload Lab Syllabus PDF</span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleUploadLabSyllabus}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {!formData.labIsOnline && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          Lab Day *
                        </label>
                        <select
                          value={formData.labDay || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, labDay: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                        >
                          <option value="">Select lab day</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                        </select>
                      </div>
                    )}

                    {!formData.labIsOnline && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Lab Start Time *
                          </label>
                          <input
                            type="time"
                            value={formData.labStartTime || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, labStartTime: e.target.value })
                            }
                            step={60}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Lab End Time *
                          </label>
                          <input
                            type="time"
                            value={formData.labEndTime || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, labEndTime: e.target.value })
                            }
                            step={60}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="labIsOnline"
                        checked={formData.labIsOnline || false}
                        onChange={(e) => {
                          const labIsOnline = e.target.checked;
                          setFormData({
                            ...formData,
                            labIsOnline,
                            labDay: labIsOnline ? "" : formData.labDay,
                            labStartTime: labIsOnline ? "" : formData.labStartTime,
                            labEndTime: labIsOnline ? "" : formData.labEndTime,
                          });
                        }}
                        className="w-4 h-4 text-[#306844] rounded focus:ring-2 focus:ring-[#306844] cursor-pointer"
                      />
                      <label htmlFor="labIsOnline" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                        Lab is online/asynchronous
                      </label>
                    </div>
                  </div>
                )}
// Textarea for course description, allowing users to add additional details or notes about the course, with styling consistent with the rest of the form
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
                  />
                </div>
// Buttons to submit the form or cancel and close the form, with the submit button showing a loading state when the form is being submitted
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--theme-accent-strong)",
                      boxShadow: "0 10px 30px -18px var(--theme-accent-strong)",
                    }}
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

          <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-4 md:p-5 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, professor, or day"
                className="md:col-span-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
              >
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="in_person">In-Person</option>
                <option value="lab">Has Lab</option>
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-slate-800"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="time_asc">Time (earliest)</option>
                <option value="time_desc">Time (latest)</option>
              </select>
            </div>
          </div>
// shows different states in the courses grid: a loading message, a message when there are no courses or no courses match the filters, and the list of course cards when there are courses to display, with each card showing key information about the course and its schedule, and styling that indicates if it's an online course or has a lab component
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading && courses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-600 text-lg">Loading courses...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full bg-white/75 dark:bg-slate-900/75 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-700/40">
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  {courses.length === 0
                    ? "No courses added yet. Create one to get started!"
                    : "No courses match your current search/filter."}
                </p>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const hasDay = !!course.courseDate?.trim();
                const hasStartTime = !!toTimeInputValue(course.startTime);
                const hasEndTime = !!toTimeInputValue(course.endTime);
                const hasScheduledTime = hasDay && hasStartTime && hasEndTime;
                const isSparseUnscheduledCard =
                  !course.isOnline &&
                  !hasScheduledTime &&
                  !course.professor &&
                  !course.description &&
                  !course.hasLab;

                return (
                <div
                  key={course.id}
                  className="h-[340px] bg-white/60 dark:bg-slate-800/55 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/50 dark:border-slate-700/45 hover:bg-white/80 dark:hover:bg-slate-800/75 transition group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#306844]"></div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="mb-1 line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">
                        {course.name}
                      </h3>
                      <p className="text-sm font-bold uppercase tracking-wider text-[#306844] dark:text-emerald-400">
                        {course.code}
                      </p>
                    </div>
                    {course.hasLab && <span className="inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">Lab</span>}
                  </div>
                  {course.professor && (
                    <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-sm opacity-60">person</span>
                      <p className="text-sm font-medium">{course.professor}</p>
                    </div>
                  )}
                  {course.isOnline ? (
                    <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-sm opacity-60">computer</span>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Online/Asynchronous</p>
                    </div>
                  ) : !hasScheduledTime ? (
                    isSparseUnscheduledCard ? (
                      <div className="mb-4 flex-1 rounded-xl border border-slate-200/80 bg-white/45 px-4 py-4 dark:border-slate-700/70 dark:bg-slate-900/25">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <span className="material-symbols-outlined text-sm opacity-70">schedule</span>
                          <p className="text-sm font-medium">Schedule not added yet</p>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Upload syllabus or tap Edit to add days and time.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                        <span className="material-symbols-outlined text-sm opacity-60">schedule</span>
                        <p className="text-sm font-medium">Schedule not added yet</p>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-sm opacity-60">schedule</span>
                      <p className="text-sm font-medium">
                        {course.courseDate} • {formatTimeDisplay(course.startTime)} - {formatTimeDisplay(course.endTime)}
                      </p>
                    </div>
                  )}
                  {course.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 pl-4 border-l-2 border-slate-200 dark:border-slate-600 ml-1">
                      {course.description}
                    </p>
                  )}
                  {course.hasLab && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Lab</p>
                      {course.labIsOnline ? (
                        <p className="text-xs text-emerald-800 dark:text-emerald-200">Online/Asynchronous</p>
                      ) : (
                        <p className="text-xs text-emerald-800 dark:text-emerald-200">
                          {course.labDay} • {formatTimeDisplay(course.labStartTime)} - {formatTimeDisplay(course.labEndTime)}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-auto pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => cardSyllabusInputRefs.current[course.id]?.click()}
                        className="w-full text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium py-1.5 px-3 rounded-lg transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        Upload Syllabus
                      </button>
                      <button
                        onClick={() => handleEdit(course)}
                        className="flex-1 text-slate-600 dark:text-slate-400 hover:text-[#002966] dark:hover:text-blue-300 font-medium py-1.5 px-3 rounded-lg transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="flex-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium py-1.5 px-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    ref={(el) => {
                      cardSyllabusInputRefs.current[course.id] = el;
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await handleUploadSyllabusForCourse(course, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              );
              })
            )}
          </div>
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
