"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import Link from "next/link";
import Timer from "@/components/Dashboard/Timer";
import StatCard from "@/components/Dashboard/StatCard";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

type FocusDashboardPanelProps = {
  atmospherePanel?: ReactNode;
  uiHidden?: boolean;
  timerMode: TimerMode;
  timeLeft: number;
  isTimerActive: boolean;
  customTimerDurations: Record<TimerMode, number>;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onModeChange: (mode: TimerMode) => void;
  onSetCustomTimerDurations: (durations: Record<TimerMode, number>) => void;
  onSaveTimerSettings: () => void;
};

export default function FocusDashboardPanel({
  atmospherePanel,
  uiHidden = false,
  timerMode,
  timeLeft,
  isTimerActive,
  customTimerDurations,
  onToggleTimer,
  onResetTimer,
  onModeChange,
  onSetCustomTimerDurations,
  onSaveTimerSettings,
}: FocusDashboardPanelProps) {
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

  const [spotifyPlaylist, setSpotifyPlaylist] = useState("0vvXsWCC9xrXsKd4FyS8kM"); // Default to Lofi Girl
  const [musicProvider, setMusicProvider] = useState("spotify"); // 'spotify', 'apple', 'youtube'
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectAccount = () => {
    setIsConnecting(true);
    // Simulate OAuth connection process for the school demo
    setTimeout(() => {
      setConnectedProviders((prev) => ({ ...prev, [musicProvider]: true }));
      setIsConnecting(false);
    }, 1000);
  };

  const handleDisconnectAccount = () => {
    setConnectedProviders((prev) => ({ ...prev, [musicProvider]: false }));
  };

  useEffect(() => {
    loadCourses();
    loadTasks();
    loadAssignments();
    loadScheduleBlocks();
  }, [userId, loadCourses, loadTasks, loadAssignments, loadScheduleBlocks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const productivityScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const scheduledHours = tasks
    .filter((t) => scheduleBlocks.some((b) => b.task_id === t.id))
    .reduce((sum, t) => sum + t.estimated_hours, 0);

  const overdueTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now && !task.completed;
  });

  const isProviderConnected = Boolean(connectedProviders[musicProvider]);

  return (
    <div className={`flex flex-col gap-8 transition-opacity duration-500 ${uiHidden ? "pointer-events-none" : "pointer-events-auto"}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-sm border border-white/60 dark:border-slate-700/60 transition-all duration-500 ease-out ${uiHidden ? "-translate-x-20 opacity-0" : "translate-x-0 opacity-100"}`}>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Focus Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Let&apos;s get in the zone, {userId ? "Student" : "Guest"}.
          </p>
        </div>

        <div className={`flex gap-3 overflow-x-auto pb-2 max-w-full lg:max-w-2xl no-scrollbar transition-all duration-500 ease-out ${uiHidden ? "translate-x-20 opacity-0" : "translate-x-0 opacity-100"}`}>
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
        <div className={`lg:col-span-3 flex flex-col gap-4 transition-all duration-500 ease-out ${uiHidden ? "-translate-x-20 opacity-0" : "translate-x-0 opacity-100"}`}>
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
          
          {/* Music Player Panel */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-4 shadow-sm border border-white/40 dark:border-slate-700/40 mt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">headphones</span>
                Focus Music
              </h3>
              <div className="flex items-center gap-2">
                {musicProvider === 'spotify' && (
                  <select 
                    className="text-xs bg-transparent border-none text-slate-500 dark:text-slate-400 focus:ring-0 cursor-pointer outline-none font-medium p-0"
                    value={spotifyPlaylist}
                    onChange={(e) => setSpotifyPlaylist(e.target.value)}
                  >
                    <option value="0vvXsWCC9xrXsKd4FyS8kM">Lofi Beats</option>
                    <option value="37i9dQZF1DWZeKCadgRdKQ">Deep Focus</option>
                    <option value="37i9dQZF1DX8CwnimMFF76">Ambient</option>
                  </select>
                )}
                <select 
                  className="text-xs bg-slate-100 dark:bg-slate-700 rounded-md px-2 py-1 border-none text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none font-bold"
                  value={musicProvider}
                  onChange={(e) => setMusicProvider(e.target.value)}
                >
                  <option value="spotify">Spotify</option>
                  <option value="apple">Apple</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2 text-xs dark:bg-slate-700/60">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {isProviderConnected ? "Connected" : "Optional account connection"}
              </span>
              {isProviderConnected ? (
                <button
                  onClick={handleDisconnectAccount}
                  className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={handleConnectAccount}
                  disabled={isConnecting}
                  className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isConnecting ? "Connecting..." : `Connect ${musicProvider.charAt(0).toUpperCase() + musicProvider.slice(1)}`}
                </button>
              )}
            </div>

            <div className="w-full transition-all duration-300">
              {musicProvider === 'spotify' && (
                <iframe
                  style={{ borderRadius: '12px', border: 'none' }}
                  src={`https://open.spotify.com/embed/playlist/${spotifyPlaylist}?utm_source=generator&theme=0`}
                  width="100%"
                  height="352"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="shadow-sm"
                ></iframe>
              )}
              {musicProvider === 'apple' && (
                <div className="min-h-[352px] overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100 p-5 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800">
                  <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Apple Music</div>
                  <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Opens Apple Music to the same default vibe as Spotify: Lofi Beats.
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    <a
                      href="https://music.apple.com/us/search?term=lofi%20beats"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open Apple Music
                    </a>
                    <a
                      href="https://music.apple.com/us/search?term=lofi%20beats"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Open In Browser
                    </a>
                  </div>
                  <div className="rounded-xl border border-white/70 bg-white/70 p-4 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                    Tip: You can use this without connecting an account.
                  </div>
                </div>
              )}
              {musicProvider === 'youtube' && (
                <div className="min-h-[352px] overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-4 text-zinc-100 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">YouTube Music</p>
                      <p className="text-xs text-zinc-400">Lofi Beats Mix</p>
                    </div>
                    <span className="rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      YT Music
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-[88px_1fr] gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <div className="h-[88px] w-[88px] rounded-lg bg-gradient-to-br from-red-500 via-orange-400 to-amber-300" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Now Playing: Deep Focus Lofi</p>
                      <p className="truncate text-xs text-zinc-400">11Planner Mix · Chill Study Session</p>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full w-2/5 rounded-full bg-red-500" />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>1:24</span>
                        <span>3:30</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Up Next</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="truncate">Neon Rain</span>
                        <span className="text-zinc-500">3:12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">Loft Window</span>
                        <span className="text-zinc-500">2:58</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">Quiet Campus</span>
                        <span className="text-zinc-500">3:06</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://music.youtube.com/search?q=lofi+beats"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                    >
                      Open YouTube Music
                    </a>
                    <a
                      href="https://music.youtube.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800"
                    >
                      Open Home
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`lg:col-span-6 flex justify-center transition-all duration-500 ease-out ${uiHidden ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}>
          <div className="w-full max-w-xl transition-transform duration-500 ease-out">
            <Timer
              mode={timerMode}
              timeLeft={timeLeft}
              isActive={isTimerActive}
              customDurations={customTimerDurations}
              onToggleTimer={onToggleTimer}
              onResetTimer={onResetTimer}
              onModeChange={onModeChange}
              onSetCustomDurations={onSetCustomTimerDurations}
              onSaveSettings={onSaveTimerSettings}
            />
          </div>
        </div>

        <div className={`lg:col-span-3 flex flex-col gap-4 transition-all duration-500 ease-out ${uiHidden ? "translate-x-20 opacity-0" : "translate-x-0 opacity-100"}`}>
          <StatCard
            label="Productivity Score"
            value={`${productivityScore}%`}
            subtext={productivityScore === 100 ? "Perfect!" : "Keep going!"}
            icon="bolt"
            accentColor={productivityScore >= 80 ? "green" : productivityScore >= 50 ? "blue" : "red"}
          />
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

      {atmospherePanel ? (
        <div className={`w-full transition-all duration-500 ease-out ${uiHidden ? "translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}>
          {atmospherePanel}
        </div>
      ) : null}


    </div>
  );
}
