"use client";

import { useState } from "react";
import { usePlanner } from "@/contexts/PlannerContext";

export default function SchedulePage() {
  const { userId, tasks, scheduleBlocks } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  const [generatedBlocks, setGeneratedBlocks] = useState<any[]>([]);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Schedule Generator
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            AI-powered schedule generation for optimal productivity
          </p>
        </div>

        {/* Action Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Generate Smart Schedule
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                {pendingTasks.length} pending task{pendingTasks.length !== 1 ? "s" : ""} to schedule
              </p>
            </div>
            <button
              onClick={generateSchedule}
              disabled={loading || pendingTasks.length === 0}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Schedule"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        )}

        {/* Schedule Stats */}
        {scheduleStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border-l-4 border-l-blue-500">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Blocks</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.total_blocks}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border-l-4 border-l-green-500">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.total_hours}h
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border-l-4 border-l-purple-500">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Days Span</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.days_span}d
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border-l-4 border-l-orange-500">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.avg_hours_per_day}h
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border-l-4 border-l-indigo-500">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Valid</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.valid ? "✓" : "✗"}
              </p>
            </div>
          </div>
        )}

        {/* Generated Schedule */}
        {generatedBlocks.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Generated Schedule Blocks
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
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
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
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

        {/* No Tasks Message */}
        {pendingTasks.length === 0 && !generatedBlocks.length && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
            <p className="text-blue-800 dark:text-blue-200 text-lg">
              No pending tasks. Create some tasks first to generate a schedule!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
