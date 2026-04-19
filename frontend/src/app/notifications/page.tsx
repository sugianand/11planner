"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useNotification } from "@/contexts/NotificationContext";
import { usePlanner } from "@/contexts/PlannerContext";
import { Task, ScheduleBlock } from "@/types";

type BlockWithRange = {
  block: ScheduleBlock;
  start: Date;
  end: Date;
  relatedTask: Task | undefined;
};

// Formats a deadline into a concise overdue or due-soon label for the alert cards.
const formatDueLabel = (deadline: Date, nowMs: number): string => {
  const diffMs = deadline.getTime() - nowMs;
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);

  if (diffMs < 0) {
    if (absMinutes < 60) return `${absMinutes} minute${absMinutes === 1 ? "" : "s"} overdue`;
    const hours = Math.round(absMinutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} overdue`;
  }

  if (absMinutes < 60) return `Due in ${absMinutes} minute${absMinutes === 1 ? "" : "s"}`;
  const hours = Math.round(absMinutes / 60);
  return `Due in ${hours} hour${hours === 1 ? "" : "s"}`;
};

// Renders the alert center, task alerts, and study block alerts for the current reminder window.
export default function NotificationsPage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const {
    notificationsEnabled,
    reminderLeadHours,
  } = useNotification();
  const {
    userId,
    tasks,
    scheduleBlocks,
    loadTasks,
    loadScheduleBlocks,
    updateTask,
  } = usePlanner();

  useEffect(() => {
    void loadTasks();
    void loadScheduleBlocks();
  }, [userId, loadTasks, loadScheduleBlocks]);

  const now = new Date();
  const nowMs = now.getTime();
  const leadMs = reminderLeadHours * 60 * 60 * 1000;

  const overdueTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (task.completed) return false;
        const deadline = new Date(task.deadline);
        if (Number.isNaN(deadline.getTime())) return false;
        return deadline.getTime() < nowMs;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 8);
  }, [tasks, nowMs]);

  const dueSoonTasks = useMemo(() => {
    if (!notificationsEnabled) return [];

    return tasks
      .filter((task) => {
        if (task.completed) return false;
        const deadline = new Date(task.deadline);
        if (Number.isNaN(deadline.getTime())) return false;
        const diffMs = deadline.getTime() - nowMs;
        return diffMs >= 0 && diffMs <= leadMs;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 10);
  }, [tasks, nowMs, leadMs, notificationsEnabled]);

  const blockRanges = useMemo<BlockWithRange[]>(() => {
    return scheduleBlocks
      .flatMap((block) => {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return [];
        }
        return [{
          block,
          start,
          end,
          relatedTask: tasks.find((task) => task.id === block.task_id),
        }];
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [scheduleBlocks, tasks]);

  const currentBlocks = useMemo(() => {
    return blockRanges.filter((entry) => entry.start.getTime() <= nowMs && entry.end.getTime() >= nowMs);
  }, [blockRanges, nowMs]);

  const upcomingBlocks = useMemo(() => {
    const windowMs = Math.max(leadMs, 6 * 60 * 60 * 1000);
    return blockRanges
      .filter((entry) => {
        const startMs = entry.start.getTime();
        return startMs > nowMs && startMs <= nowMs + windowMs;
      })
      .slice(0, 10);
  }, [blockRanges, nowMs, leadMs]);

  const formattedNow = new Date(nowMs).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const urgencyScore = overdueTasks.length * 3 + dueSoonTasks.length * 2 + currentBlocks.length;
  const alertMood = urgencyScore >= 8 ? "High urgency" : urgencyScore >= 4 ? "Moderate" : "Calm";

  if (!isMounted) {
    return (
      <div className="relative min-h-screen overflow-hidden flex flex-col">
        <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-30" />

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-10 sm:p-6 sm:pb-12 lg:p-8 lg:pb-14">
          <section className="rounded-3xl border border-white/45 bg-white/50 p-5 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/45 sm:p-8">
            <div className="h-28 rounded-3xl border border-white/50 bg-white/70 dark:border-slate-700/55 dark:bg-slate-800/55 animate-pulse" />
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="h-80 rounded-3xl border border-white/50 bg-white/70 dark:border-slate-700/55 dark:bg-slate-800/55 animate-pulse" />
              <div className="h-80 rounded-3xl border border-white/50 bg-white/70 dark:border-slate-700/55 dark:bg-slate-800/55 animate-pulse" />
            </div>
          </section>
        </main>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-30" />

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-10 sm:p-6 sm:pb-12 lg:p-8 lg:pb-14">
        <section className="rounded-3xl border border-white/45 bg-white/50 p-5 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 dark:border-slate-700/55 dark:bg-slate-900/45 sm:p-8">
          <div className="card-reveal relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-8">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--theme-accent-soft)] blur-3xl opacity-55" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p
                  className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: "var(--theme-accent)",
                    backgroundColor: "var(--theme-accent-soft)",
                    color: "var(--theme-accent-strong)",
                  }}
                >
                  Alert Center
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Notifications</h1>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {formattedNow} · {alertMood}
                </p>
              </div>
              <Link
                href="/settings?panel=notifications"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: "var(--theme-accent-strong)" }}
              >
                <span className="material-symbols-outlined text-base">settings</span>
                Notification Settings
              </Link>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/65 dark:bg-slate-800/55">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Reminders</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{notificationsEnabled ? "On" : "Off"}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/65 dark:bg-slate-800/55">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Lead Window</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{reminderLeadHours}h</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/65 dark:bg-slate-800/55">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Task Alerts</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{overdueTasks.length + dueSoonTasks.length}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/65 dark:bg-slate-800/55">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Block Alerts</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{currentBlocks.length + upcomingBlocks.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="card-reveal rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-7" style={{ animationDelay: "90ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Task Alerts</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Overdue and due-soon tasks based on your lead-time setting.</p>
                </div>
                <span
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    borderColor: "var(--theme-accent)",
                    backgroundColor: "var(--theme-accent-soft)",
                    color: "var(--theme-accent-strong)",
                  }}
                >
                  {overdueTasks.length + dueSoonTasks.length} active
                </span>
              </div>

              {!notificationsEnabled ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200">
                  Push reminders are off in settings. Due-soon alerts will appear again when enabled.
                </div>
              ) : null}

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {overdueTasks.map((task) => {
                  const deadline = new Date(task.deadline);
                  return (
                    <div key={`overdue-${task.id}`} className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 transition hover:shadow-sm dark:border-rose-800/50 dark:bg-rose-900/20">
                      <p className="font-semibold text-rose-800 dark:text-rose-200">Task overdue</p>
                      <p className="text-sm text-slate-800 dark:text-slate-100">{task.title}</p>
                      <p className="text-xs text-rose-700 dark:text-rose-300">Due {deadline.toLocaleString()}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-rose-700 dark:text-rose-300">Forgot to mark this task as complete?</span>
                        <button
                          type="button"
                          onClick={() => void updateTask(task.id, { completed: true })}
                          className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: "var(--theme-accent-strong)" }}
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {dueSoonTasks.map((task) => {
                  const deadline = new Date(task.deadline);
                  return (
                    <div key={`soon-${task.id}`} className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 transition hover:shadow-sm dark:border-amber-800/50 dark:bg-amber-900/20">
                      <p className="font-semibold text-amber-800 dark:text-amber-200">Deadline soon</p>
                      <p className="text-sm text-slate-800 dark:text-slate-100">{task.title}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">{formatDueLabel(deadline, nowMs)} · {deadline.toLocaleString()}</p>
                    </div>
                  );
                })}

                {overdueTasks.length === 0 && dueSoonTasks.length === 0 ? (
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/35 px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                    No task alerts right now.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="card-reveal rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-7" style={{ animationDelay: "140ms" }}>
              <div className="mb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Study Block Alerts</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">Current and upcoming blocks from your generated schedule.</p>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {currentBlocks.map((entry) => (
                  <div
                    key={`current-${entry.block.id}`}
                    className="rounded-xl border p-3 transition hover:shadow-sm"
                    style={{
                      borderColor: "var(--theme-accent)",
                      backgroundColor: "var(--theme-accent-soft)",
                    }}
                  >
                    <p className="font-semibold" style={{ color: "var(--theme-accent-strong)" }}>In progress now</p>
                    <p className="text-sm text-slate-800 dark:text-slate-100">{entry.relatedTask?.title || "Study block"}</p>
                    <p className="text-xs" style={{ color: "var(--theme-accent-strong)" }}>
                      {entry.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {entry.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}

                {upcomingBlocks.map((entry) => (
                  <div key={`upcoming-${entry.block.id}`} className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 transition hover:shadow-sm dark:border-sky-800/50 dark:bg-sky-900/20">
                    <p className="font-semibold text-sky-800 dark:text-sky-200">Upcoming block</p>
                    <p className="text-sm text-slate-800 dark:text-slate-100">{entry.relatedTask?.title || "Study block"}</p>
                    <p className="text-xs text-sky-700 dark:text-sky-300">
                      {entry.start.toLocaleDateString()} · {entry.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}

                {currentBlocks.length === 0 && upcomingBlocks.length === 0 ? (
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/35 px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                    No current or upcoming study blocks in your alert window.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

        </section>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      <style jsx>{`
        .card-reveal {
          opacity: 0;
          transform: translateY(16px) scale(0.992);
          animation: notificationCardReveal 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes notificationCardReveal {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .card-reveal {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
