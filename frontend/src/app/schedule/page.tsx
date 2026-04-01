"use client";

import { useMemo, useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { ScheduleView } from "@/components/ScheduleView";
import { Event } from "@/types/schedule";
import Footer from "@/components/Footer";

type ScheduleStats = {
  total_blocks: number;
  total_hours: number;
  days_span: number;
  avg_hours_per_day: number;
  valid: boolean;
};


export default function SchedulePage() {
  const {
    userId,
    tasks,
    preferences,
    scheduleBlocks,
    loadTasks,
    loadScheduleBlocks,
    updateScheduleBlock,
  } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStats | null>(null);
  const [showGeneratedPopup, setShowGeneratedPopup] = useState(false);


  useEffect(() => {
    loadTasks();
    loadScheduleBlocks();
  }, [loadTasks, loadScheduleBlocks]);

  useEffect(() => {
    if (!showGeneratedPopup) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setShowGeneratedPopup(false);
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [showGeneratedPopup]);

  const generateSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/schedule/generate/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            study_limit_hours: preferences?.dailyLimit,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate schedule");
      }

      const data = await response.json();
      setScheduleStats(data.stats);
      setShowGeneratedPopup(true);
      await loadScheduleBlocks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const overdueTasks = pendingTasks.filter((task) => new Date(task.deadline).getTime() < Date.now());
  const scheduledTaskCount = new Set(scheduleBlocks.map((block) => block.task_id)).size;

  const scheduleEvents = useMemo(() => {
    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    return scheduleBlocks.map<Event>((block) => {
      const task = taskMap.get(block.task_id);
      const priority = task?.priority ?? 2;
      const color = priority >= 4 ? "red" : priority === 3 ? "yellow" : "blue";
      return {
        id: block.id,
        title: task?.title || block.task_id,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
        color,
      };
    });
  }, [scheduleBlocks, tasks]);

  const handleEventMove = async (eventId: string, newStart: Date) => {
    const block = scheduleBlocks.find((item) => item.id === eventId);
    if (!block) {
      return;
    }
    const durationMs = Math.max(
      new Date(block.end_time).getTime() - new Date(block.start_time).getTime(),
      0
    );
    const updatedStart = new Date(newStart);
    const updatedEnd = new Date(updatedStart.getTime() + durationMs);
    const updatedDate = new Date(updatedStart);
    updatedDate.setHours(0, 0, 0, 0);

    try {
      await updateScheduleBlock(block.id, {
        task_id: block.task_id,
        date: updatedDate.toISOString(),
        start_time: updatedStart.toISOString(),
        end_time: updatedEnd.toISOString(),
        duration_minutes: block.duration_minutes,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to move block");
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>


      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl shadow-sm p-6 md:p-8 mb-6 border border-white/40 dark:border-slate-700/40">
          <div className="rounded-2xl border border-white/50 dark:border-slate-700/50 bg-gradient-to-r from-white/80 via-white/70 to-emerald-50/70 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-emerald-900/20 p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  Schedule Generator
                </h1>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  Generate and manage smart study blocks from your task workload.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Pending: {pendingTasks.length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Completed: {completedTasks.length}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Scheduled Tasks: {scheduledTaskCount}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Overdue: {overdueTasks.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2">
                <button
                  onClick={generateSchedule}
                  disabled={loading || pendingTasks.length === 0}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  {loading ? "Generating..." : "Generate Schedule"}
                </button>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {pendingTasks.length} pending task{pendingTasks.length !== 1 ? "s" : ""} ready for planning
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/60 rounded-2xl p-4 mb-6">
            <p className="text-rose-800 dark:text-rose-200">Error: {error}</p>
          </div>
        )}

        {scheduleStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Blocks</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.total_blocks}
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.total_hours}h
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Days Span</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.days_span}d
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.avg_hours_per_day}h
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Valid</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.valid ? "✓" : "✗"}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-6 mt-6 border border-white/40 dark:border-slate-700/40">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Weekly Schedule
          </h3>
          <div className="h-[700px]">
            <ScheduleView events={scheduleEvents} onEventMove={handleEventMove} />
          </div>
        </div>

      </div>
      {showGeneratedPopup ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-50 rounded-xl border border-emerald-200/70 bg-emerald-50/95 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg backdrop-blur-sm dark:border-emerald-700/70 dark:bg-emerald-900/80 dark:text-emerald-100"
        >
          Schedule generated!
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
