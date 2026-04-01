"use client";

import { useMemo, useState, useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { ScheduleView } from "@/components/ScheduleView";
import { Event } from "@/types/schedule";
import Footer from "@/components/Footer";


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
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    loadTasks();
    loadScheduleBlocks();
  }, [loadTasks, loadScheduleBlocks]);

  const generateSchedule = async () => {
    setLoading(true);
    setError(null);

    // Validate userId is loaded
    if (!userId || userId === "") {
      setError("User not loaded. Please refresh the page.");
      setLoading(false);
      return;
    }

    try {
      console.log(`Generating schedule for user: ${userId}`);
      
      const response = await fetch(
        `http://localhost:8000/api/schedule/generate/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Schedule generation error:", errorData);
        throw new Error(
          errorData.detail || 
          errorData.message || 
          "Failed to generate schedule"
        );
      }

      const data = await response.json();
      console.log("Schedule generated successfully:", data);
      
      setGeneratedBlocks(data.blocks || []);
      setScheduleStats(data.stats);
      await loadScheduleBlocks();
    } catch (err: any) {
      console.error("Error generating schedule:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  const handleBlockClick = (block: any) => {
    setSelectedBlock(block);
    setShowModal(true);
  };

  const getTaskDetails = (taskId: string) => {
    return tasks.find((t) => t.id === taskId);
  };

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


      <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex-1">
        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-sm border border-white/40 dark:border-slate-700/40 mb-6">
          <div className="rounded-2xl border border-white/50 dark:border-slate-700/50 theme-header-gradient p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.9fr] gap-6 md:gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  Schedule Generator
                </h1>
                <p className="text-slate-600 dark:text-slate-300 font-medium text-base md:text-lg">
                  AI-powered schedule generation for optimal productivity
                </p>
              </div>

              <div className="rounded-2xl border border-white/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/45 p-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Generate Smart Schedule
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {pendingTasks.length} pending task{pendingTasks.length !== 1 ? "s" : ""} to schedule
                </p>
                {pendingTasks.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 font-medium">
                    Create tasks first to generate a schedule.
                  </p>
                )}
                <button
                  onClick={generateSchedule}
                  disabled={loading || pendingTasks.length === 0}
                  className="w-full bg-[#306844] hover:bg-[#255236] text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg shadow-green-900/10 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  title={pendingTasks.length === 0 ? "Create at least one task to generate a schedule" : ""}
                >
                  {loading ? "Generating..." : "Generate Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/60 rounded-2xl p-4 mb-6">
            <p className="text-rose-800 dark:text-rose-200">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}



        {scheduleStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-2xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40 border-l-4 border-l-theme">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Blocks</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.total_blocks}
              </p>
            </div>

            <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-2xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40 border-l-4 border-l-theme">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.total_hours}h
              </p>
            </div>

            <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-2xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40 border-l-4 border-l-theme">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Days Span</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.days_span}d
              </p>
            </div>

            <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-2xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40 border-l-4 border-l-theme">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.avg_hours_per_day}h
              </p>
            </div>

            <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-2xl shadow-sm p-4 border border-white/40 dark:border-slate-700/40 border-l-4 border-l-theme">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Valid</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {scheduleStats.valid ? "✓" : "✗"}
              </p>
            </div>
          </div>
        )}

        {generatedBlocks.length > 0 && (
          <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40">
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
                      onClick={() => handleBlockClick(block)}
                      className="border-b border-slate-200/70 dark:border-slate-700/70 hover:bg-white/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
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

        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl shadow-sm p-6 mt-6 border border-white/40 dark:border-slate-700/40">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Weekly Schedule
          </h3>
          <div className="h-[700px]">
            <ScheduleView events={scheduleEvents} onEventMove={handleEventMove} />
          </div>
        </div>

      </div>

      {/* Task Details Modal */}
      {showModal && selectedBlock && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white/95 dark:bg-slate-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/40 dark:border-slate-700/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Task Details */}
            {(() => {
              const task = getTaskDetails(selectedBlock.task_id);
              const startDate = new Date(selectedBlock.start_time);
              const endDate = new Date(selectedBlock.end_time);
              const duration = selectedBlock.duration_minutes / 60;

              return (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {task?.title || "Untitled Task"}
                  </h2>
                  
                  {task?.course_id && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Course ID: {task.course_id}
                    </p>
                  )}

                  <div className="space-y-4 mt-6">
                    {/* Start Time */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Start Time
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white mt-1">
                        {startDate.toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* End Time */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        End Time
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white mt-1">
                        {endDate.toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                        Duration
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white mt-1">
                        {duration.toFixed(1)} hours ({selectedBlock.duration_minutes} minutes)
                      </p>
                    </div>

                    {/* Priority Badge */}
                    {task?.priority && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Priority
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              task.priority >= 4
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : task.priority === 3
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {task.priority >= 4 ? "High" : task.priority === 3 ? "Medium" : "Low"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full mt-6 bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
