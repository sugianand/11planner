"use client";

import { useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import Link from "next/link";
import Timer from "@/components/Dashboard/Timer";
import StatCard from "@/components/Dashboard/StatCard";

export default function FocusDashboardPanel() {
  const {
    userId,
    tasks,
    courses,
    scheduleBlocks,
    loadTasks,
    loadCourses,
    loadAssignments,
    loadScheduleBlocks,
  } = usePlanner();

  useEffect(() => {
    loadCourses();
    loadTasks();
    loadAssignments();
    loadScheduleBlocks();
  }, [userId, loadCourses, loadTasks, loadAssignments, loadScheduleBlocks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const scheduledHours = tasks
    .filter((t) => scheduleBlocks.some((b) => b.task_id === t.id))
    .reduce((sum, t) => sum + t.estimated_hours, 0);

  const overdueTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now && !task.completed;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-sm border border-white/60 dark:border-slate-700/60">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Focus Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Let&apos;s get in the zone, {userId ? "Student" : "Guest"}.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 max-w-full lg:max-w-2xl no-scrollbar">
          {courses.length === 0 ? (
            <Link
              href="/courses"
              className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-slate-800/70 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white transition"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="text-sm font-semibold">Add Courses</span>
            </Link>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="flex-shrink-0 px-4 py-2 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 dark:border-slate-700/60 min-w-[120px] flex flex-col"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                  {course.code}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {course.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            subtext={`${completedTasks} completed`}
            icon="task_alt"
            accentColor="blue"
          />
          <StatCard
            label="Total Hours"
            value={`${totalHours.toFixed(1)}h`}
            subtext={`${scheduledHours.toFixed(1)}h scheduled`}
            icon="schedule"
            accentColor="blue"
          />
        </div>

        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-xl">
            <Timer />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <StatCard
            label="Overdue"
            value={overdueTasks.length}
            subtext={overdueTasks.length > 0 ? "Needs attention" : "All good!"}
            icon="warning"
            accentColor={overdueTasks.length > 0 ? "red" : "green"}
          />

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/40 dark:border-slate-700/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/tasks"
                className="flex items-center gap-3 bg-[#306844] hover:bg-[#255236] text-white font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-green-900/10"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Task
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-3 px-4 rounded-xl transition border border-slate-200 dark:border-slate-600"
              >
                <span className="material-symbols-outlined text-sm">school</span>
                Add Course
              </Link>
              <Link
                href="/schedule"
                className="flex items-center gap-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-3 px-4 rounded-xl transition border border-slate-200 dark:border-slate-600"
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
