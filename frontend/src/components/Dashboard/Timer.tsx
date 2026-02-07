"use client";

import { useState, useEffect, useRef } from "react";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

export default function Timer() {
    const [mode, setMode] = useState<TimerMode>("pomodoro");
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);

    // Use a ref for the interval so we can clear it easily
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Audio refs (optional, placeholders for now)
    // const startSound = useRef<HTMLAudioElement | null>(null);

    const modes = {
        pomodoro: { label: "Focus", minutes: 25, color: "text-slate-900 dark:text-white" },
        shortBreak: { label: "Short Break", minutes: 5, color: "text-teal-600 dark:text-teal-400" },
        longBreak: { label: "Long Break", minutes: 15, color: "text-blue-600 dark:text-blue-400" },
    };

    useEffect(() => {
        // Reset timer when mode changes
        setTimeLeft(modes[mode].minutes * 60);
        setIsActive(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, [mode]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Play sound here if implemented
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(modes[mode].minutes * 60);
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

    return (
        <div className="flex flex-col items-center justify-center p-8 relative">
            {/* Timer Circle */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                {/* SVG Progress Ring */}
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
                        r="136" // Radius slightly smaller than 144 to fit stroke
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
                        // Start Full (0 offset), End Empty (Max offset)
                        // Progress goes 0 -> 100.
                        // We want Offset 0 -> Max.
                        // So Offset = Max * (progress / 100)
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
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    aria-label="Reset Timer"
                >
                    <span className="material-symbols-outlined text-xl">restart_alt</span>
                </button>

                <button
                    onClick={toggleTimer}
                    className="w-20 h-20 rounded-full flex items-center justify-center bg-[#306844] hover:bg-[#255236] text-white shadow-xl transition transform hover:scale-105 active:scale-95"
                    aria-label={isActive ? "Pause Timer" : "Start Timer"}
                >
                    <span className="material-symbols-outlined text-4xl fill-current">
                        {isActive ? "pause" : "play_arrow"}
                    </span>
                </button>

                <button
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
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
                        onClick={() => setMode(m)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${mode === m
                            ? "bg-[#306844] text-white shadow-md"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
                            }`}
                    >
                        {modes[m].label}
                    </button>
                ))}
            </div>
        </div>
    );
}
