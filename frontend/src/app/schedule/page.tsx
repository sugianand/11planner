"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePlanner } from "@/contexts/PlannerContext";
import { ScheduleView } from "@/components/ScheduleView";
import { Event } from "@/types/schedule";
import Footer from "@/components/Footer";
import AppDialog from "@/components/AppDialog";
import { supabase } from "@/lib/supabaseClient";

interface ScheduleStats {
  total_hours: number;
  avg_hours_per_day: number;
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [colorBy, setColorBy] = useState<"priority" | "course">("priority");
  const [exportIdentity, setExportIdentity] = useState<{ name: string; email: string } | null>(null);
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const isPrintMode = searchParams.get("printMode") === "1";
  const includePersonalInfoInExport = searchParams.get("includePersonalInfo") !== "0";

  // Reads the saved daily study limit from local storage for export and generation.
  const getStoredDailyLimit = () => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const stored = Number(window.localStorage.getItem("dailyLimit"));
    return Number.isFinite(stored) && stored > 0 ? stored : undefined;
  };

  useEffect(() => {
    loadTasks();
    loadScheduleBlocks();
  }, [loadTasks, loadScheduleBlocks]);

  useEffect(() => {
    if (!isPrintMode || !includePersonalInfoInExport) {
      setExportIdentity(null);
      return;
    }

    let isMounted = true;

    const loadExportIdentity = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user;
      if (!authUser || !isMounted) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("firstname, lastname")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      const first = profile?.firstname?.trim() || "";
      const last = profile?.lastname?.trim() || "";
      const fullName = `${first} ${last}`.trim() || "11Planner User";
      setExportIdentity({
        name: fullName,
        email: authUser.email || "",
      });
    };

    void loadExportIdentity();

    return () => {
      isMounted = false;
    };
  }, [isPrintMode, includePersonalInfoInExport]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setError(null);
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [error]);

  // Requests a fresh schedule from the backend and refreshes local block state.
  const generateSchedule = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/schedule/generate/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            study_limit_hours: preferences?.dailyLimit ?? getStoredDailyLimit(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate schedule");
      }

      const data = await response.json();
      setScheduleStats(data.stats);
      await loadScheduleBlocks();
      setSuccessMessage("Schedule generated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(scheduleBlocks.map((b) => b.task_id));
    return pendingTasks.filter((t) => !scheduledTaskIds.has(t.id));
  }, [pendingTasks, scheduleBlocks]);

  const displayStats = useMemo(() => {
    if (scheduleStats) {
      return scheduleStats;
    }
    if (scheduleBlocks.length === 0) {
      return null;
    }

    const totalHours = scheduleBlocks.reduce(
      (sum, block) => sum + (block.duration_minutes || 0) / 60,
      0
    );
    const uniqueDays = new Set(
      scheduleBlocks.map((block) => new Date(block.start_time).toDateString())
    ).size;

    return {
      total_hours: Math.round(totalHours * 10) / 10,
      avg_hours_per_day:
        uniqueDays > 0 ? Math.round((totalHours / uniqueDays) * 100) / 100 : 0,
    };
  }, [scheduleStats, scheduleBlocks]);

  const scheduleEvents = useMemo(() => {
    // Maps blocks to calendar events with a consistent color scheme.
    const getColorForBlock = (
      task: (typeof tasks)[0] | undefined,
      colorScheme: "priority" | "course"
    ) => {
      if (colorScheme === "priority") {
        const priority = task?.priority ?? 2;
        return priority >= 4 ? "red" : priority === 3 ? "yellow" : "blue";
      }
      if (!task?.course_id) {
        return "blue";
      }
      const courseId = task.course_id;
      const colors: Array<
        | "blue"
        | "red"
        | "yellow"
        | "green"
        | "purple"
        | "pink"
        | "orange"
        | "teal"
        | "indigo"
        | "cyan"
        | "lime"
        | "rose"
      > = [
        "blue",
        "red",
        "yellow",
        "green",
        "purple",
        "pink",
        "orange",
        "teal",
        "indigo",
        "cyan",
        "lime",
        "rose",
      ];
      const hash = courseId
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    return scheduleBlocks.map<Event>((block) => {
      const task = taskMap.get(block.task_id);
      const color = getColorForBlock(task, colorBy);
      return {
        id: block.id,
        title: task?.title || block.task_id,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
        color,
      };
    });
  }, [scheduleBlocks, tasks, colorBy]);

  // Persists a dragged block's new time while preventing overlap conflicts.
  const handleEventMove = async (eventId: string, newStart: Date) => {
    const block = scheduleBlocks.find((item) => item.id === eventId);
    if (!block) {
      return false;
    }
    const durationMs = Math.max(
      new Date(block.end_time).getTime() - new Date(block.start_time).getTime(),
      0
    );
    const updatedStart = new Date(newStart);
    const updatedEnd = new Date(updatedStart.getTime() + durationMs);

    const overlapsExisting = scheduleEvents.some((item) => {
      if (item.id === eventId) {
        return false;
      }
      const otherStart = new Date(item.start);
      const otherEnd = new Date(item.end);
      return updatedStart < otherEnd && otherStart < updatedEnd;
    });

    if (overlapsExisting) {
      setError("Cannot place blocks on top of each other.");
      return false;
    }

    const updatedDate = new Date(updatedStart);
    updatedDate.setHours(0, 0, 0, 0);

    try {
      setError(null);
      await updateScheduleBlock(block.id, {
        task_id: block.task_id,
        date: updatedDate.toISOString(),
        start_time: updatedStart.toISOString(),
        end_time: updatedEnd.toISOString(),
        duration_minutes: block.duration_minutes,
      });
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to move block");
      return false;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex-1">
        <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          <div className="mb-8 rounded-2xl border border-white/50 dark:border-slate-700/50 theme-header-gradient p-5 md:p-6">
            {isPrintMode && (
              <div className="mb-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/60 px-4 py-3">
                {includePersonalInfoInExport ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">Schedule Export Identity</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{exportIdentity?.name || "Loading name..."}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{exportIdentity?.email || ""}</p>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Anonymous export mode is enabled. Personal identity details are excluded from this printable view.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                  Schedule Generator
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  Generate and manage your study schedule in one place.
                </p>
              </div>

              <div className="flex flex-col gap-3 items-start md:items-end">
                <button
                  onClick={generateSchedule}
                  disabled={loading || (pendingTasks.length === 0 && scheduleBlocks.length === 0)}
                  className="text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--theme-accent-strong)",
                    boxShadow: "0 10px 30px -18px var(--theme-accent-strong)",
                  }}
                  title={pendingTasks.length === 0 && scheduleBlocks.length === 0 ? "Create at least one task to generate a schedule" : ""}
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  {loading ? "Generating..." : "Generate Schedule"}
                </button>
                {successMessage && (
                  <p className="text-sm font-medium" style={{ color: "var(--theme-accent-strong)" }}>
                    {successMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                  Pending: {unscheduledTasks.length}
                </span>
              </div>

              {displayStats && (
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Total Hours: {displayStats.total_hours}h
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200">
                    Average Hours: {displayStats.avg_hours_per_day}h
                  </span>
                </div>
              )}
            </div>

            {pendingTasks.length === 0 && scheduleBlocks.length === 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-4 font-medium">
                Create tasks first to generate a schedule.
              </p>
            )}
          </div>

          <div>
            <ScheduleView
              events={scheduleEvents}
              onEventMove={handleEventMove}
              colorBy={colorBy}
              onColorByChange={setColorBy}
              errorMessage={error}
              onDismissError={() => setError(null)}
              onShowDialog={(title, message) => setDialog({ isOpen: true, title, message })}
            />
          </div>
        </div>
      </div>
      <AppDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        onClose={() => setDialog({ isOpen: false, title: '', message: '' })}
      />
      <Footer />
    </div>
  );
}
