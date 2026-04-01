"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

type TimerProps = {
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    activeMode: TimerMode | null;
    activeTimeLeft: number | null;
    customDurations: Record<TimerMode, number>;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onModeChange: (nextMode: TimerMode) => void;
    onSetCustomDurations: (next: Record<TimerMode, number>) => void;
    onSaveSettings: (nextDurations?: Record<TimerMode, number>) => void;
};

export default function Timer({
    mode,
    timeLeft,
    isActive,
    activeMode,
    activeTimeLeft,
    customDurations,
    onToggleTimer,
    onResetTimer,
    onModeChange,
    onSetCustomDurations,
    onSaveSettings,
}: TimerProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [timerDraft, setTimerDraft] = useState<Record<TimerMode, string>>({
        pomodoro: customDurations.pomodoro.toString(),
        shortBreak: customDurations.shortBreak.toString(),
        longBreak: customDurations.longBreak.toString(),
    });

    const modes = {
        pomodoro: { label: "Focus", minutes: customDurations.pomodoro, color: "text-slate-900 dark:text-white" },
        shortBreak: { label: "Short Break", minutes: customDurations.shortBreak, color: "text-teal-600 dark:text-teal-400" },
        longBreak: { label: "Long Break", minutes: customDurations.longBreak, color: "text-blue-600 dark:text-blue-400" },
    };

    const hasBackgroundRunningTimer = activeMode !== null && activeMode !== mode;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const calculateProgress = () => {
        const totalSeconds = modes[mode].minutes * 60;
        return ((totalSeconds - timeLeft) / totalSeconds) * 100;
    };

    const handleSaveSettings = () => {
        const clampDraftMinutes = (rawValue: string, min: number, max: number) => {
            const parsed = Number.parseInt(rawValue.trim(), 10);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                return min;
            }
            return Math.min(max, Math.max(min, parsed));
        };

        const nextDurations = {
            pomodoro: clampDraftMinutes(timerDraft.pomodoro, 1, 60),
            shortBreak: clampDraftMinutes(timerDraft.shortBreak, 1, 30),
            longBreak: clampDraftMinutes(timerDraft.longBreak, 1, 60),
        };

        onSetCustomDurations(nextDurations);
        onSaveSettings(nextDurations);
        setShowSettings(false);
    };

    useEffect(() => {
        if (!showSettings) {
            return;
        }

        setTimerDraft({
            pomodoro: customDurations.pomodoro.toString(),
            shortBreak: customDurations.shortBreak.toString(),
            longBreak: customDurations.longBreak.toString(),
        });
    }, [showSettings, customDurations]);

    const handleDraftChange = (timerMode: TimerMode, rawValue: string) => {
        const digitsOnly = rawValue.replace(/\D/g, "");

        if (digitsOnly === "") {
            setTimerDraft((prev) => ({ ...prev, [timerMode]: "0" }));
            return;
        }

        setTimerDraft((prev) => ({ ...prev, [timerMode]: digitsOnly }));
    };

    const handleDraftBlur = (timerMode: TimerMode, min: number, max: number) => {
        setTimerDraft((prev) => {
            const parsed = Number.parseInt(prev[timerMode].trim(), 10);

            if (!Number.isFinite(parsed) || parsed <= 0) {
                return { ...prev, [timerMode]: min.toString() };
            }

            const clamped = Math.min(max, Math.max(min, parsed));
            return { ...prev, [timerMode]: clamped.toString() };
        });
    };

    const openSettings = () => {
        setTimerDraft({
            pomodoro: customDurations.pomodoro.toString(),
            shortBreak: customDurations.shortBreak.toString(),
            longBreak: customDurations.longBreak.toString(),
        });
        setShowSettings(true);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 relative">
            {/* Timer Circle */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                {/* SVG Progress Ring */}
                <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                    {/* Background Filled Circle */}
                    <circle
                        cx="144"
                        cy="144"
                        r="136"
                        fill="white"
                        fillOpacity="0.7"
                        className="dark:fill-slate-800 dark:fill-opacity-70"
                    />
                    {/* Track Ring */}
                    <circle
                        cx="144"
                        cy="144"
                        r="136"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-200 dark:text-slate-700 opacity-50"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx="144"
                        cy="144"
                        r="136"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 136}
                        strokeDashoffset={2 * Math.PI * 136 * (calculateProgress() / 100)}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ease-linear ${isActive ? "text-[#306844] dark:text-[#3d8658]" : "text-slate-400 dark:text-slate-500"
                            }`}
                    />
                </svg>

                {/* Time and Label */}
                <div className="text-center z-10">
                    <div className="uppercase tracking-[0.2em] text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                        {modes[mode].label} Session
                    </div>
                    <div
                        className={`text-7xl font-bold tracking-tighter tabular-nums ${modes[mode].color}`}
                    >
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mb-8">
                <button
                    onClick={onResetTimer}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label="Reset Timer"
                >
                    <span className="material-symbols-outlined text-xl">restart_alt</span>
                </button>

                <button
                    onClick={onToggleTimer}
                    className="w-20 h-20 rounded-full flex items-center justify-center bg-[#306844] hover:bg-[#255236] text-white shadow-xl transition transform hover:scale-105 active:scale-95"
                    aria-label={isActive ? "Pause Timer" : "Start Timer"}
                >
                    <span className="material-symbols-outlined text-4xl fill-current">
                        {isActive ? "pause" : "play_arrow"}
                    </span>
                </button>

                <button
                    onClick={openSettings}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label="Settings"
                >
                    <span className="material-symbols-outlined text-xl">settings</span>
                </button>
            </div>

            {/* Mode Selectors */}
            <div className="flex gap-2 p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full shadow-sm border border-white/20 dark:border-slate-700">
                {(Object.keys(modes) as TimerMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => onModeChange(m)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${mode === m
                            ? "bg-[#306844] text-white shadow-md"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
                            }`}
                    >
                        {modes[m].label}
                    </button>
                ))}
            </div>

            {hasBackgroundRunningTimer && activeMode && activeTimeLeft !== null ? (
                <div className="mt-4 rounded-full border border-emerald-200/70 bg-emerald-50/75 px-4 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-900/20 dark:text-emerald-300">
                    {modes[activeMode].label} running: {formatTime(activeTimeLeft)}
                </div>
            ) : null}

            {/* Settings Modal */}
            {showSettings && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-md px-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 dark:border-slate-700/70 bg-white/95 dark:bg-slate-900/95 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div
                            className="px-6 py-5 text-white"
                            style={{
                                backgroundImage: "linear-gradient(to right, var(--brand-from), var(--brand-via), var(--brand-to))",
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Focus Setup</p>
                                    <h2 className="mt-1 text-2xl font-bold leading-tight">Timer Settings</h2>
                                    <p className="mt-1 text-sm text-white/85">Set your session lengths for focus and breaks.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    className="h-9 w-9 rounded-full border border-white/40 bg-white/10 transition hover:bg-white/20"
                                    aria-label="Close timer settings"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-6 space-y-4">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Focus Duration</label>
                                    <span className="text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1">1-60 min</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={timerDraft.pomodoro}
                                        onChange={(e) => handleDraftChange("pomodoro", e.target.value)}
                                        onBlur={() => handleDraftBlur("pomodoro", 1, 60)}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 pr-14 py-3 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                                    />
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">min</span>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Short Break</label>
                                    <span className="text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1">1-30 min</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={timerDraft.shortBreak}
                                        onChange={(e) => handleDraftChange("shortBreak", e.target.value)}
                                        onBlur={() => handleDraftBlur("shortBreak", 1, 30)}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 pr-14 py-3 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                                    />
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">min</span>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Long Break</label>
                                    <span className="text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1">1-60 min</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={timerDraft.longBreak}
                                        onChange={(e) => handleDraftChange("longBreak", e.target.value)}
                                        onBlur={() => handleDraftBlur("longBreak", 1, 60)}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 pr-14 py-3 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                                    />
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">min</span>
                                </div>
                            </div>

                            <div className="mt-2 flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 shadow-md"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
