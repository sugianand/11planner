"use client";

import { useMemo, useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { ScheduleView } from "@/components/ScheduleView";
import { Event } from "@/types/schedule";


export default function SchedulePage() {
  const {
    userId,
    tasks,
    scheduleBlocks,
    loadTasks,
    loadScheduleBlocks,
    updateScheduleBlock,
  } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  const [generatedBlocks, setGeneratedBlocks] = useState<any[]>([]);


  useEffect(() => {
    loadTasks();
    loadScheduleBlocks();
  }, [loadTasks, loadScheduleBlocks]);

  const generateSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/schedule/generate/${userId}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to generate schedule");
      }

      const data = await response.json();
      setGeneratedBlocks(data.blocks || []);
      setScheduleStats(data.stats);
      await loadScheduleBlocks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

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
    } catch (err: any) {
      setError(err.message || "Failed to move block");
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>


      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-8 mb-6 border border-white/40 dark:border-slate-700/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                Schedule Generator
              </h1>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                AI-powered schedule generation for optimal productivity
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Generate Smart Schedule
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                {pendingTasks.length} pending task{pendingTasks.length !== 1 ? "s" : ""} to schedule
              </p>
            </div>
            <button
              onClick={generateSchedule}
              disabled={loading || pendingTasks.length === 0}
              className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg shadow-green-900/10 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? "Generating..." : "Generate Schedule"}
            </button>
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

        {generatedBlocks.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Generated Schedule Blocks
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200/70 dark:border-slate-700/70">
                    <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Task ID
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Start Time
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">
                      End Time
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {generatedBlocks.map((block, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200/70 dark:border-slate-700/70 hover:bg-white/60 dark:hover:bg-slate-800/60 transition"
                    >
                      <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                        {block.task_id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(block.start_time).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(block.end_time).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {(block.duration_minutes / 60).toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {scheduleEvents.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-3xl shadow-sm p-6 mt-6 border border-white/40 dark:border-slate-700/40">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Weekly Schedule
            </h3>
            <div className="h-[700px]">
              <ScheduleView events={scheduleEvents} onEventMove={handleEventMove} />
            </div>
          </div>
        )}

        {pendingTasks.length === 0 && !generatedBlocks.length && (
          <div className="bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/60 rounded-3xl p-8 text-center">
            <p className="text-emerald-800 dark:text-emerald-200 text-lg">
              No pending tasks. Create some tasks first to generate a schedule!
            </p>
          </div>
        )}


      </div>
    </div>
  );
}
