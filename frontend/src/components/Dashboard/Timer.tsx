"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

type TimerProps = {
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    customDurations: Record<TimerMode, number>;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onModeChange: (nextMode: TimerMode) => void;
    onSetCustomDurations: (next: Record<TimerMode, number>) => void;
    onSaveSettings: () => void;
};

export default function Timer({
    mode,
    timeLeft,
    isActive,
    customDurations,
    onToggleTimer,
    onResetTimer,
    onModeChange,
    onSetCustomDurations,
    onSaveSettings,
}: TimerProps) {
    const [showSettings, setShowSettings] = useState(false);

    const modes = {
        pomodoro: { label: "Focus", minutes: customDurations.pomodoro, color: "text-slate-900 dark:text-white" },
        shortBreak: { label: "Short Break", minutes: customDurations.shortBreak, color: "text-teal-600 dark:text-teal-400" },
        longBreak: { label: "Long Break", minutes: customDurations.longBreak, color: "text-blue-600 dark:text-blue-400" },
    };

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
        onSaveSettings();
        setShowSettings(false);
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
                    onClick={() => setShowSettings(true)}
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

            {/* Settings Modal */}
            {showSettings && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowSettings(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Timer Settings</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Focus Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={customDurations.pomodoro}
                                    onChange={(e) => onSetCustomDurations({ ...customDurations, pomodoro: parseInt(e.target.value, 10) || 25 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#306844] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Short Break Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={customDurations.shortBreak}
                                    onChange={(e) => onSetCustomDurations({ ...customDurations, shortBreak: parseInt(e.target.value, 10) || 5 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#306844] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Long Break Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={customDurations.longBreak}
                                    onChange={(e) => onSetCustomDurations({ ...customDurations, longBreak: parseInt(e.target.value, 10) || 15 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#306844] outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 px-6 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex-1 px-6 py-3 rounded-lg bg-[#306844] hover:bg-[#255236] text-white font-semibold transition shadow-md"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
