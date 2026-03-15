"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

export type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

export const defaultTimerDurations = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
} as const;

interface TimerContextType {
  timerMode: TimerMode;
  timeLeft: number;
  isTimerActive: boolean;
  customTimerDurations: Record<TimerMode, number>;
  timerModes: Record<TimerMode, { label: string; minutes: number }>;
  toggleTimer: () => void;
  handleTimerModeChange: (mode: TimerMode) => void;
  resetTimer: () => void;
  applyTimerSettings: () => void;
  setCustomTimerDurations: React.Dispatch<React.SetStateAction<Record<TimerMode, number>>>;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [customTimerDurations, setCustomTimerDurations] = useState<Record<TimerMode, number>>({
    pomodoro: defaultTimerDurations.pomodoro,
    shortBreak: defaultTimerDurations.shortBreak,
    longBreak: defaultTimerDurations.longBreak,
  });
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(defaultTimerDurations.pomodoro * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerModes = useMemo(
    () => ({
      pomodoro: { label: "Focus", minutes: customTimerDurations.pomodoro },
      shortBreak: { label: "Short Break", minutes: customTimerDurations.shortBreak },
      longBreak: { label: "Long Break", minutes: customTimerDurations.longBreak },
    }),
    [customTimerDurations]
  );

  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isTimerActive) {
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimerInterval();
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval, isTimerActive]);

  const toggleTimer = useCallback(() => {
    if (isTimerActive) {
      clearTimerInterval();
      setIsTimerActive(false);
      return;
    }
    setIsTimerActive(true);
  }, [isTimerActive, clearTimerInterval]);

  const handleTimerModeChange = useCallback(
    (mode: TimerMode) => {
      clearTimerInterval();
      setTimerMode(mode);
      setIsTimerActive(false);
      setTimeLeft(timerModes[mode].minutes * 60);
    },
    [clearTimerInterval, timerModes]
  );

  const resetTimer = useCallback(() => {
    clearTimerInterval();
    setIsTimerActive(false);
    setTimeLeft(timerModes[timerMode].minutes * 60);
  }, [clearTimerInterval, timerModes, timerMode]);

  const applyTimerSettings = useCallback(() => {
    clearTimerInterval();
    setIsTimerActive(false);
    setTimeLeft(customTimerDurations[timerMode] * 60);
  }, [clearTimerInterval, customTimerDurations, timerMode]);

  return (
    <TimerContext.Provider
      value={{
        timerMode,
        timeLeft,
        isTimerActive,
        customTimerDurations,
        timerModes,
        toggleTimer,
        handleTimerModeChange,
        resetTimer,
        applyTimerSettings,
        setCustomTimerDurations,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within a TimerProvider");
  return context;
}
