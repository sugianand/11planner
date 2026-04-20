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
  activeTimerMode: TimerMode | null;
  activeTimeLeft: number | null;
  customTimerDurations: Record<TimerMode, number>;
  timerModes: Record<TimerMode, { label: string; minutes: number }>;
  toggleTimer: () => void;
  handleTimerModeChange: (mode: TimerMode) => void;
  resetTimer: () => void;
  applyTimerSettings: (nextDurations?: Record<TimerMode, number>) => void;
  setCustomTimerDurations: React.Dispatch<React.SetStateAction<Record<TimerMode, number>>>;
}

const TimerContext = createContext<TimerContextType | null>(null);

// Provides timer state and actions for focus and break modes.
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [customTimerDurations, setCustomTimerDurations] = useState<Record<TimerMode, number>>({
    pomodoro: defaultTimerDurations.pomodoro,
    shortBreak: defaultTimerDurations.shortBreak,
    longBreak: defaultTimerDurations.longBreak,
  });
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [remainingSeconds, setRemainingSeconds] = useState<Record<TimerMode, number>>({
    pomodoro: defaultTimerDurations.pomodoro * 60,
    shortBreak: defaultTimerDurations.shortBreak * 60,
    longBreak: defaultTimerDurations.longBreak * 60,
  });
  const [activeTimerMode, setActiveTimerMode] = useState<TimerMode | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerModes = useMemo(
    () => ({
      pomodoro: { label: "Focus", minutes: customTimerDurations.pomodoro },
      shortBreak: { label: "Short Break", minutes: customTimerDurations.shortBreak },
      longBreak: { label: "Long Break", minutes: customTimerDurations.longBreak },
    }),
    [customTimerDurations]
  );

  // Stops and clears any currently running timer interval.
  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!activeTimerMode) {
      return;
    }

    const runningMode = activeTimerMode;

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const currentValue = prev[runningMode];

        if (currentValue <= 1) {
          clearTimerInterval();
          setActiveTimerMode(null);
          return {
            ...prev,
            [runningMode]: 0,
          };
        }

        return {
          ...prev,
          [runningMode]: currentValue - 1,
        };
      });
    }, 1000);

    return () => {
      clearTimerInterval();
    };
  }, [activeTimerMode, clearTimerInterval]);

  const timeLeft = remainingSeconds[timerMode];
  const isTimerActive = activeTimerMode === timerMode;
  const activeTimeLeft = activeTimerMode ? remainingSeconds[activeTimerMode] : null;

  // Starts or pauses the currently selected timer mode.
  const toggleTimer = useCallback(() => {
    if (activeTimerMode === timerMode) {
      clearTimerInterval();
      setActiveTimerMode(null);
      return;
    }

    setRemainingSeconds((prev) => {
      if (prev[timerMode] > 0) {
        return prev;
      }

      return {
        ...prev,
        [timerMode]: timerModes[timerMode].minutes * 60,
      };
    });

    setActiveTimerMode(timerMode);
  }, [activeTimerMode, clearTimerInterval, timerMode, timerModes]);

  // Switches which timer mode is shown in the UI.
  const handleTimerModeChange = useCallback((mode: TimerMode) => {
    setTimerMode(mode);
  }, []);

  // Resets the selected timer mode back to its configured duration.
  const resetTimer = useCallback(() => {
    setRemainingSeconds((prev) => ({
      ...prev,
      [timerMode]: timerModes[timerMode].minutes * 60,
    }));

    if (activeTimerMode === timerMode) {
      clearTimerInterval();
      setActiveTimerMode(null);
    }
  }, [activeTimerMode, clearTimerInterval, timerModes, timerMode]);

  // Applies updated durations and refreshes all timer countdown values.
  const applyTimerSettings = useCallback((nextDurations?: Record<TimerMode, number>) => {
    const durationsToApply = nextDurations ?? customTimerDurations;

    clearTimerInterval();
    setActiveTimerMode(null);
    setRemainingSeconds({
      pomodoro: durationsToApply.pomodoro * 60,
      shortBreak: durationsToApply.shortBreak * 60,
      longBreak: durationsToApply.longBreak * 60,
    });
  }, [clearTimerInterval, customTimerDurations]);

  return (
    <TimerContext.Provider
      value={{
        timerMode,
        timeLeft,
        isTimerActive,
        activeTimerMode,
        activeTimeLeft,
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

// Returns the timer context and enforces provider usage.
export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within a TimerProvider");
  return context;
}
