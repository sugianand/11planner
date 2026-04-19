"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePlanner } from "@/contexts/PlannerContext";

export type NotificationType = "info" | "warning" | "danger";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  taskId?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
  permission: NotificationPermission | "unsupported";
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  reminderLeadHours: number;
  setReminderLeadHours: (hours: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEYS = {
  enabled: "notifications",
  leadHours: "reminderLeadHours",
  notified: "notifiedDeadlines",
};

const DEFAULT_LEAD_HOURS = 24;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { tasks } = usePlanner();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const savedEnabled = localStorage.getItem(STORAGE_KEYS.enabled);
    return savedEnabled === null ? true : savedEnabled !== "false";
  });
  const [reminderLeadHours, setReminderLeadHoursState] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LEAD_HOURS;
    }
    const savedLeadHours = Number(localStorage.getItem(STORAGE_KEYS.leadHours));
    return Number.isNaN(savedLeadHours) ? DEFAULT_LEAD_HOURS : savedLeadHours;
  });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window === "undefined" || !("Notification" in window) ? "unsupported" : Notification.permission
  );
  const notifiedRef = useRef<Record<string, string>>(
    (() => {
      if (typeof window === "undefined") {
        return {};
      }
      const savedNotified = localStorage.getItem(STORAGE_KEYS.notified);
      if (!savedNotified) {
        return {};
      }
      try {
        return JSON.parse(savedNotified) || {};
      } catch {
        return {};
      }
    })()
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.enabled, String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.leadHours, String(reminderLeadHours));
  }, [reminderLeadHours]);

  const saveNotified = () => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.notified, JSON.stringify(notifiedRef.current));
  };

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const playSound = useCallback(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("soundEnabled") === "false") return;
    try {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      const play = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        osc.connect(gain);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
        osc.onended = () => ctx.close();
      };

      play(880, 0, 0.15);
      play(1100, 0.15, 0.2);
    } catch {}
  }, []);

  const pushNotification = useCallback((item: NotificationItem) => {
    setNotifications((prev) => [item, ...prev].slice(0, 5));
    if (permission === "granted") {
      new Notification(item.title, { body: item.message });
    }
    playSound();
    setTimeout(() => {
      dismissNotification(item.id);
    }, 10000);
  }, [permission, dismissNotification, playSound]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) {
      return;
    }

    const checkDeadlines = () => {
      const now = Date.now();
      const leadMs = reminderLeadHours * 60 * 60 * 1000;

      tasks.forEach((task) => {
        if (task.completed) {
          return;
        }
        const deadline = new Date(task.deadline);
        if (Number.isNaN(deadline.getTime())) {
          return;
        }

        const key = `${task.id}:${deadline.toISOString()}`;
        if (notifiedRef.current[key]) {
          return;
        }

        const diffMs = deadline.getTime() - now;
        if (diffMs <= 0) {
          const item: NotificationItem = {
            id: `overdue-${task.id}-${deadline.getTime()}`,
            title: "Task overdue",
            message: `${task.title} was due ${deadline.toLocaleString()}.`,
            type: "danger",
            createdAt: new Date().toISOString(),
            taskId: task.id,
          };
          pushNotification(item);
          notifiedRef.current[key] = "overdue";
          saveNotified();
          return;
        }

        if (diffMs <= leadMs) {
          const item: NotificationItem = {
            id: `soon-${task.id}-${deadline.getTime()}`,
            title: "Deadline soon",
            message: `${task.title} is due ${deadline.toLocaleString()}.`,
            type: "warning",
            createdAt: new Date().toISOString(),
            taskId: task.id,
          };
          pushNotification(item);
          notifiedRef.current[key] = "soon";
          saveNotified();
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, reminderLeadHours, tasks, permission, pushNotification]);

  const value = useMemo(
    () => ({
      notifications,
      dismissNotification,
      requestPermission,
      permission,
      notificationsEnabled,
      setNotificationsEnabled: setNotificationsEnabledState,
      reminderLeadHours,
      setReminderLeadHours: setReminderLeadHoursState,
    }),
    [
      notifications,
      dismissNotification,
      requestPermission,
      permission,
      notificationsEnabled,
      reminderLeadHours,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
