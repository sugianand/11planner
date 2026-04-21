"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  notificationHistory: NotificationItem[];
  dismissNotification: (id: string) => void;
  createNotification: (payload: {
    title: string;
    message: string;
    type?: NotificationType;
    taskId?: string;
    showBrowser?: boolean;
    autoDismissMs?: number;
  }) => void;
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
  notified: "notificationAlertState",
};

const DEFAULT_LEAD_HOURS = 24;
type AlertState = "none" | "soon" | "overdue";

let toastAudio: HTMLAudioElement | null = null;
let toastAudioStopTimer: number | null = null;

// Resolves browser notification support and current permission in a consistent way.
const getNotificationPermissionState = (): NotificationPermission | "unsupported" => {
  if (typeof window === "undefined") {
    return "unsupported";
  }
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "unsupported";
  }
  return Notification.permission;
};

// Plays the short toast sound, falling back to a generated tone if the mp3 cannot be used.
const playToastSound = () => {
  if (typeof window === "undefined") {
    return;
  }
  if (localStorage.getItem("soundEnabled") === "false") {
    return;
  }

  try {
    if (!toastAudio) {
      toastAudio = new Audio("/sounds/sfx/notification-chime.wav");
      toastAudio.preload = "auto";
      toastAudio.volume = 0.9;
    }

    if (toastAudioStopTimer) {
      window.clearTimeout(toastAudioStopTimer);
      toastAudioStopTimer = null;
    }

    toastAudio.currentTime = 0;
    const playPromise = toastAudio.play();
    if (playPromise) {
      void playPromise.catch(() => {
        // Ignore playback failures (autoplay restrictions, muted output, etc.).
      });
    }

    // Use only a short portion so this behaves like a notification ping.
    toastAudioStopTimer = window.setTimeout(() => {
      if (!toastAudio) {
        return;
      }
      toastAudio.pause();
      toastAudio.currentTime = 0;
    }, 420);
  } catch {
    // Ignore audio setup failures and continue without sound.
  }
};

// Owns toast state, persistent notification history, and deadline-based reminder logic.
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { tasks } = usePlanner();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>([]);
  const activeNotificationIdsRef = useRef<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [reminderLeadHours, setReminderLeadHoursState] = useState(DEFAULT_LEAD_HOURS);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const notifiedRef = useRef<Record<string, AlertState>>({});

  // Keeps the current signed-in email and display name available for alert copies.
  useEffect(() => {
    let isActive = true;

    const syncRecipientProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user ?? null;

      if (!isActive) {
        return;
      }

      if (!authUser) {
        setRecipientEmail(null);
        setRecipientName(null);
        return;
      }

      setRecipientEmail(authUser.email ?? null);

      const metadataName =
        (authUser.user_metadata?.full_name as string | undefined)
        || (authUser.user_metadata?.name as string | undefined)
        || null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firstname, lastname")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      const first = (profile?.firstname || "").trim();
      const last = (profile?.lastname || "").trim();
      const profileName = `${first} ${last}`.trim();

      setRecipientName(profileName || metadataName || null);
    };

    void syncRecipientProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }

      if (!session?.user) {
        setRecipientEmail(null);
        setRecipientName(null);
        return;
      }

      setRecipientEmail(session.user.email ?? null);

      const metadataName =
        (session.user.user_metadata?.full_name as string | undefined)
        || (session.user.user_metadata?.name as string | undefined)
        || null;
      setRecipientName(metadataName);

      void syncRecipientProfile();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const savedEnabled = localStorage.getItem(STORAGE_KEYS.enabled);
      setNotificationsEnabledState(savedEnabled === null ? true : savedEnabled !== "false");

      const savedLeadHours = Number(localStorage.getItem(STORAGE_KEYS.leadHours));
      setReminderLeadHoursState(Number.isNaN(savedLeadHours) ? DEFAULT_LEAD_HOURS : savedLeadHours);

      setPermission(getNotificationPermissionState());

      const savedNotified = localStorage.getItem(STORAGE_KEYS.notified);
      if (!savedNotified) {
        notifiedRef.current = {};
        return;
      }

      try {
        const parsed = JSON.parse(savedNotified) || {};
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
          notifiedRef.current = {};
          return;
        }
        const cleaned: Record<string, AlertState> = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (value === "none" || value === "soon" || value === "overdue") {
            cleaned[key] = value;
          }
        });
        notifiedRef.current = cleaned;
      } catch {
        notifiedRef.current = {};
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

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

  // Persists the current alert state map so reminder transitions survive refreshes.
  const saveNotified = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.notified, JSON.stringify(notifiedRef.current));
  }, []);

  // Updates the reminder window without clearing prior alert state unless the task range changes naturally.
  const setReminderLeadHours = useCallback((hours: number) => {
    setReminderLeadHoursState(hours);
  }, []);

  // Removes a toast from the active on-screen stack.
  const dismissNotification = useCallback((id: string) => {
    activeNotificationIdsRef.current.delete(id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Adds a toast to the active stack, stores it in history, and optionally mirrors it to the browser notification API.
  const sendEmailCopy = useCallback(
    async (item: NotificationItem) => {
      if (typeof window === "undefined") {
        return;
      }
      if (item.taskId == null) {
        return;
      }
      if (item.title !== "Task overdue" && item.title !== "Deadline soon") {
        return;
      }
      if (localStorage.getItem("emailUpdates") === "false") {
        return;
      }
      if (!recipientEmail) {
        return;
      }

      try {
        const greetingName = recipientName?.trim() || "there";
        const isOverdueAlert = item.title === "Task overdue";
        const alertType = isOverdueAlert ? "overdue" : "soon";

        await fetch(`${API_BASE_URL}/api/email/task-alert/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient_email: recipientEmail,
            user_name: greetingName,
            alert_type: alertType,
            task_title: item.title,
            task_message: item.message,
          }),
        });
      } catch {
        // Email copies are best-effort so in-app notifications still work if SMTP is unavailable.
      }
    },
    [recipientEmail, recipientName]
  );

  const pushNotification = useCallback((item: NotificationItem, options?: { showBrowser?: boolean; autoDismissMs?: number }) => {
    const showBrowser = options?.showBrowser ?? true;
    const autoDismissMs = options?.autoDismissMs ?? 10000;
    const didInsert = !activeNotificationIdsRef.current.has(item.id);
    if (didInsert) {
      activeNotificationIdsRef.current.add(item.id);
    }
    setNotifications((prev) => {
      if (!didInsert) {
        return prev;
      }
      return [item, ...prev].slice(0, 5);
    });
    setNotificationHistory((prev) => {
      if (prev.some((existing) => existing.id === item.id)) {
        return prev;
      }
      return [item, ...prev].slice(0, 50);
    });
    if (showBrowser && permission === "granted") {
      new Notification(item.title, { body: item.message });
    }
    if (didInsert) {
      playToastSound();
      void sendEmailCopy(item);
    }
    setTimeout(() => {
      dismissNotification(item.id);
    }, autoDismissMs);
  }, [dismissNotification, permission, sendEmailCopy]);

  // Creates a manual in-app notification for UI actions and feedback messages.
  const createNotification = useCallback(
    ({
      title,
      message,
      type = "info",
      taskId,
      showBrowser = false,
      autoDismissMs = 10000,
    }: {
      title: string;
      message: string;
      type?: NotificationType;
      taskId?: string;
      showBrowser?: boolean;
      autoDismissMs?: number;
    }) => {
      const item: NotificationItem = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
        taskId,
      };
      pushNotification(item, { showBrowser, autoDismissMs });
    },
    [pushNotification]
  );

  // Requests browser notification permission when the user opts in.
  const requestPermission = useCallback(async () => {
    const current = getNotificationPermissionState();
    if (current === "unsupported") {
      setPermission("unsupported");
      return "unsupported";
    }

    let result: NotificationPermission;
    try {
      result = await Notification.requestPermission();
    } catch {
      // If the browser blocks permission prompts at runtime, keep the last known permission.
      result = Notification.permission;
    }

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
      const activeKeys = new Set<string>();
      let didChangeState = false;

      tasks.forEach((task) => {
        if (task.completed) {
          return;
        }
        const deadline = new Date(task.deadline);
        if (Number.isNaN(deadline.getTime())) {
          return;
        }

        const key = `${task.id}:${deadline.toISOString()}`;
        activeKeys.add(key);
        const previousState = notifiedRef.current[key] ?? "none";

        const diffMs = deadline.getTime() - now;
        const nextState: AlertState = diffMs <= 0 ? "overdue" : diffMs <= leadMs ? "soon" : "none";

        const makeNotificationId = (kind: "soon" | "overdue") =>
          `${kind}-${task.id}-${deadline.getTime()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        if (nextState === "overdue" && previousState !== "overdue") {
          const item: NotificationItem = {
            id: makeNotificationId("overdue"),
            title: "Task overdue",
            message: `${task.title} was due ${deadline.toLocaleString()}.`,
            type: "danger",
            createdAt: new Date().toISOString(),
            taskId: task.id,
          };
          pushNotification(item);
        } else if (nextState === "soon" && previousState !== "soon") {
          const item: NotificationItem = {
            id: makeNotificationId("soon"),
            title: "Deadline soon",
            message: `${task.title} is due ${deadline.toLocaleString()}.`,
            type: "warning",
            createdAt: new Date().toISOString(),
            taskId: task.id,
          };
          pushNotification(item);
        }

        if (previousState !== nextState) {
          notifiedRef.current[key] = nextState;
          didChangeState = true;
        }
      });

      Object.keys(notifiedRef.current).forEach((key) => {
        if (!activeKeys.has(key)) {
          delete notifiedRef.current[key];
          didChangeState = true;
        }
      });

      if (didChangeState) {
        saveNotified();
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, reminderLeadHours, tasks, permission, pushNotification, saveNotified]);

  const value = useMemo(
    () => ({
      notifications,
      notificationHistory,
      dismissNotification,
      createNotification,
      requestPermission,
      permission,
      notificationsEnabled,
      setNotificationsEnabled: setNotificationsEnabledState,
      reminderLeadHours,
      setReminderLeadHours,
    }),
    [
      notifications,
      notificationHistory,
      dismissNotification,
      createNotification,
      requestPermission,
      permission,
      notificationsEnabled,
      reminderLeadHours,
      setReminderLeadHours,
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
