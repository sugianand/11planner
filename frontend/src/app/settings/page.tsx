"use client";

// Disable static prerendering for this page (requires browser APIs and hooks)
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification } from "@/contexts/NotificationContext";
import Footer from "@/components/Footer";
import AppDialog from "@/components/AppDialog";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Theme = "light" | "dark" | "auto";
type ColorTheme = "emerald" | "ocean" | "rose" | "slate" | "amber" | "violet";
type SettingsPanel = "appearance" | "notifications" | "privacy" | "account" | "data";

type UserSummary = {
  id?: string;
  email?: string;
  firstname?: string | null;
  lastname?: string | null;
};

type UserSettingsRow = {
  user_id: string;
  theme_mode: Theme;
  color_theme: ColorTheme;
  notifications_enabled: boolean;
  reminder_lead_hours: number;
  sound_enabled: boolean;
  email_updates_enabled: boolean;
  weekly_report_enabled: boolean;
  privacy_include_personal_info: boolean;
  privacy_analytics_enabled: boolean;
  privacy_personalization_enabled: boolean;
  privacy_insights_history_enabled: boolean;
};

const colorThemeSwatches: Record<ColorTheme, string> = {
  emerald: "linear-gradient(135deg, #10b981, #059669)",
  ocean: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  rose: "linear-gradient(135deg, #f43f5e, #e11d48)",
  slate: "linear-gradient(135deg, #64748b, #475569)",
  amber: "linear-gradient(135deg, #f59e0b, #d97706)",
  violet: "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

// Reads a boolean preference from localStorage with a fallback for first-time visitors.
const readStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  return value === null ? fallback : value !== "false";
};

// Mirrors cloud-backed preference values into localStorage for compatibility with existing UI logic.
const applyLocalSettingsMirror = (settings: Partial<UserSettingsRow>) => {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof settings.sound_enabled === "boolean") {
    localStorage.setItem("soundEnabled", String(settings.sound_enabled));
  }
  if (typeof settings.email_updates_enabled === "boolean") {
    localStorage.setItem("emailUpdates", String(settings.email_updates_enabled));
  }
  if (typeof settings.weekly_report_enabled === "boolean") {
    localStorage.setItem("weeklyReport", String(settings.weekly_report_enabled));
  }
  if (typeof settings.privacy_include_personal_info === "boolean") {
    localStorage.setItem("privacyIncludePersonalInfo", String(settings.privacy_include_personal_info));
  }
  if (typeof settings.privacy_analytics_enabled === "boolean") {
    localStorage.setItem("privacyAnalyticsEnabled", String(settings.privacy_analytics_enabled));
  }
  if (typeof settings.privacy_personalization_enabled === "boolean") {
    localStorage.setItem("privacyPersonalizationEnabled", String(settings.privacy_personalization_enabled));
  }
  if (typeof settings.privacy_insights_history_enabled === "boolean") {
    localStorage.setItem("privacyInsightsHistoryEnabled", String(settings.privacy_insights_history_enabled));
  }
};

// Hosts the full settings dashboard, including appearance, notifications, and account controls.
function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { theme, setTheme, colorTheme, setColorTheme, colorThemes, effectiveTheme } = useTheme();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderLeadHours,
    setReminderLeadHours,
    permission,
    requestPermission,
  } = useNotification();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [privacyIncludePersonalInfo, setPrivacyIncludePersonalInfo] = useState(true);
  const [privacyAnalyticsEnabled, setPrivacyAnalyticsEnabled] = useState(false);
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(true);
  const [privacyInsightsHistoryEnabled, setPrivacyInsightsHistoryEnabled] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isClearingAccountData, setIsClearingAccountData] = useState(false);
  const [isDeletingInsightsHistory, setIsDeletingInsightsHistory] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel>("appearance");
  const [settingsSearch, setSettingsSearch] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [loadedServerNotificationPreferences, setLoadedServerNotificationPreferences] = useState(false);
  const [loadedSupabaseSettings, setLoadedSupabaseSettings] = useState(false);
  const hydratedSupabaseUserIdRef = useRef<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const previousPanelRef = useRef<SettingsPanel>("appearance");
  const [isMounted, setIsMounted] = useState(false);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Loads current auth user + profile name details for settings header/account actions.
  const syncUserSummary = useCallback(async (allowClearOnMissingUser: boolean) => {
    const { data, error } = await supabase.auth.getUser();
    const authUser = data?.user ?? null;

    if (error || !authUser) {
      if (allowClearOnMissingUser) {
        setUser(null);
      }
      return;
    }

    const nextUser: UserSummary = {
      id: authUser.id,
      email: authUser.email ?? undefined,
    };

    const { data: profile } = await supabase
      .from("profiles")
      .select("firstname, lastname")
      .eq("id", authUser.id)
      .maybeSingle();

    setUser({
      ...nextUser,
      firstname: profile?.firstname ?? null,
      lastname: profile?.lastname ?? null,
    });
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const includePersonalInfoValue = localStorage.getItem("privacyIncludePersonalInfo");
    const legacyProfileVisibleValue = localStorage.getItem("privacyProfileVisible");
    const insightsHistoryValue = localStorage.getItem("privacyInsightsHistoryEnabled");

    setSoundEnabled(readStoredBoolean("soundEnabled", true));
    setEmailUpdates(readStoredBoolean("emailUpdates", true));
    setWeeklyReport(readStoredBoolean("weeklyReport", true));
    setPrivacyIncludePersonalInfo(
      includePersonalInfoValue === null
        ? legacyProfileVisibleValue === null
          ? true
          : legacyProfileVisibleValue !== "false"
        : includePersonalInfoValue !== "false"
    );
    setPrivacyAnalyticsEnabled(readStoredBoolean("privacyAnalyticsEnabled", false));
    setPrivacyPersonalizationEnabled(readStoredBoolean("privacyPersonalizationEnabled", true));
    setPrivacyInsightsHistoryEnabled(insightsHistoryValue === null ? true : insightsHistoryValue !== "false");
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Guards user sync against state updates after unmount.
    const safeSync = async (allowClearOnMissingUser: boolean) => {
      try {
        await syncUserSummary(allowClearOnMissingUser);
      } catch {
        if (allowClearOnMissingUser && isMounted) {
          setUser(null);
        }
      }
    };

    void safeSync(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }

      if (session?.user?.id || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void safeSync(false);
      }
    });

    // Refreshes user summary when the page becomes active again.
    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void safeSync(false);
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [syncUserSummary]);

  useEffect(() => {
    if (!user?.id) {
      setLoadedServerNotificationPreferences(false);
      setLoadedSupabaseSettings(false);
      hydratedSupabaseUserIdRef.current = null;
      return;
    }

    let isActive = true;

    // Loads saved server-side notification email preferences for cross-device consistency.
    const loadServerPreferences = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/email/preferences/${user.id}`);
        if (!response.ok) {
          setLoadedServerNotificationPreferences(true);
          return;
        }

        const data = (await response.json()) as {
          email_updates_enabled?: boolean;
          weekly_report_enabled?: boolean;
        };

        if (!isActive) {
          return;
        }

        if (typeof data.email_updates_enabled === "boolean") {
          setEmailUpdates(data.email_updates_enabled);
          localStorage.setItem("emailUpdates", String(data.email_updates_enabled));
        }
        if (typeof data.weekly_report_enabled === "boolean") {
          setWeeklyReport(data.weekly_report_enabled);
          localStorage.setItem("weeklyReport", String(data.weekly_report_enabled));
        }
      } catch {
        // Keep local settings if the backend preference endpoint is unavailable.
      } finally {
        if (isActive) {
          setLoadedServerNotificationPreferences(true);
        }
      }
    };

    void loadServerPreferences();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      return;
    }

    if (hydratedSupabaseUserIdRef.current === userId) {
      if (!loadedSupabaseSettings) {
        setLoadedSupabaseSettings(true);
      }
      return;
    }

    let isActive = true;

    // Loads cloud-synced settings so preferences follow the user across devices.
    const loadSupabaseSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select(
            "user_id, theme_mode, color_theme, notifications_enabled, reminder_lead_hours, sound_enabled, email_updates_enabled, weekly_report_enabled, privacy_include_personal_info, privacy_analytics_enabled, privacy_personalization_enabled, privacy_insights_history_enabled"
          )
          .eq("user_id", userId)
          .maybeSingle<UserSettingsRow>();

        if (!isActive || error || !data) {
          return;
        }

        if (data.theme_mode && ["light", "dark", "auto"].includes(data.theme_mode)) {
          setTheme(data.theme_mode);
        }
        if (data.color_theme && ["emerald", "ocean", "rose", "slate", "amber", "violet"].includes(data.color_theme)) {
          setColorTheme(data.color_theme);
        }
        if (typeof data.notifications_enabled === "boolean") {
          setNotificationsEnabled(data.notifications_enabled);
          localStorage.setItem("notifications", String(data.notifications_enabled));
        }
        if (typeof data.reminder_lead_hours === "number" && Number.isFinite(data.reminder_lead_hours)) {
          setReminderLeadHours(data.reminder_lead_hours);
          localStorage.setItem("reminderLeadHours", String(data.reminder_lead_hours));
        }
        if (typeof data.sound_enabled === "boolean") {
          setSoundEnabled(data.sound_enabled);
        }
        if (typeof data.email_updates_enabled === "boolean") {
          setEmailUpdates(data.email_updates_enabled);
        }
        if (typeof data.weekly_report_enabled === "boolean") {
          setWeeklyReport(data.weekly_report_enabled);
        }
        if (typeof data.privacy_include_personal_info === "boolean") {
          setPrivacyIncludePersonalInfo(data.privacy_include_personal_info);
        }
        if (typeof data.privacy_analytics_enabled === "boolean") {
          setPrivacyAnalyticsEnabled(data.privacy_analytics_enabled);
        }
        if (typeof data.privacy_personalization_enabled === "boolean") {
          setPrivacyPersonalizationEnabled(data.privacy_personalization_enabled);
        }
        if (typeof data.privacy_insights_history_enabled === "boolean") {
          setPrivacyInsightsHistoryEnabled(data.privacy_insights_history_enabled);
        }

        applyLocalSettingsMirror(data);
      } finally {
        if (isActive) {
          hydratedSupabaseUserIdRef.current = userId;
          setLoadedSupabaseSettings(true);
        }
      }
    };

    void loadSupabaseSettings();

    return () => {
      isActive = false;
    };
  }, [
    user?.id,
    loadedSupabaseSettings,
    setTheme,
    setColorTheme,
    setNotificationsEnabled,
    setReminderLeadHours,
  ]);

  useEffect(() => {
    if (!user?.id || !user.email || !loadedServerNotificationPreferences) {
      return;
    }

    // Persists email update + weekly report settings for backend-driven notifications.
    const syncServerPreferences = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/email/preferences/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: user.email,
            user_name: `${(user.firstname || "").trim()} ${(user.lastname || "").trim()}`.trim() || null,
            email_updates_enabled: emailUpdates,
            weekly_report_enabled: weeklyReport,
          }),
        });
      } catch {
        // Keep local behavior working even when preference sync cannot reach backend.
      }
    };

    void syncServerPreferences();
  }, [
    user?.id,
    user?.email,
    user?.firstname,
    user?.lastname,
    emailUpdates,
    weeklyReport,
    loadedServerNotificationPreferences,
  ]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId || !loadedSupabaseSettings) {
      return;
    }

    // Persists full settings state so user preferences remain consistent across devices.
    const syncCloudSettings = async () => {
      const payload: UserSettingsRow = {
        user_id: userId,
        theme_mode: theme as Theme,
        color_theme: colorTheme as ColorTheme,
        notifications_enabled: notificationsEnabled,
        reminder_lead_hours: reminderLeadHours,
        sound_enabled: soundEnabled,
        email_updates_enabled: emailUpdates,
        weekly_report_enabled: weeklyReport,
        privacy_include_personal_info: privacyIncludePersonalInfo,
        privacy_analytics_enabled: privacyAnalyticsEnabled,
        privacy_personalization_enabled: privacyPersonalizationEnabled,
        privacy_insights_history_enabled: privacyInsightsHistoryEnabled,
      };

      try {
        const { error } = await supabase.from("user_settings").upsert(payload, { onConflict: "user_id" });
        if (!error) {
          applyLocalSettingsMirror(payload);
        }
      } catch {
        // Keep local behavior even if Supabase sync is unavailable.
      }
    };

    const timer = window.setTimeout(() => {
      void syncCloudSettings();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    user?.id,
    loadedSupabaseSettings,
    theme,
    colorTheme,
    notificationsEnabled,
    reminderLeadHours,
    soundEnabled,
    emailUpdates,
    weeklyReport,
    privacyIncludePersonalInfo,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyInsightsHistoryEnabled,
  ]);

  useEffect(() => {
    const panelParam = searchParams.get("panel");
    const normalizedPanel = panelParam === "personalize" ? "appearance" : panelParam;
    const validPanels: SettingsPanel[] = ["appearance", "notifications", "privacy", "account", "data"];
    if (normalizedPanel && validPanels.includes(normalizedPanel as SettingsPanel)) {
      setActivePanel(normalizedPanel as SettingsPanel);
    }
  }, [searchParams]);

  useEffect(() => {
    if (previousPanelRef.current === activePanel) {
      return;
    }

    previousPanelRef.current = activePanel;

    if (!actionMessage) {
      return;
    }

    // Clear error banners when switching tabs so stale failures do not linger out of context.
    if (actionMessage.type === "error") {
      setActionMessage(null);
      return;
    }

    if (activePanel === "data") {
      return;
    }

    const dismissOnLeaveData = new Set([
      "Learning insights history deleted. New insights start now.",
      "Schedule PDF downloaded.",
      "Schedule opened in a new tab. Use your browser print dialog to save as PDF.",
      "Please allow pop-ups to export schedule as PDF.",
      "Print-ready schedule export opened with explicit time rows.",
    ]);

    if (actionMessage?.text && (dismissOnLeaveData.has(actionMessage.text) || actionMessage.text.startsWith("Failed to export schedule:"))) {
      setActionMessage(null);
    }
  }, [activePanel, actionMessage]);

  const [savedSettings, setSavedSettings] = useState({
    theme: theme as Theme,
    colorTheme: colorTheme as ColorTheme,
    notifications: notificationsEnabled,
    reminderLeadHours,
    soundEnabled,
    emailUpdates,
    weeklyReport,
    privacyIncludePersonalInfo,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyInsightsHistoryEnabled,
  });

  // Updates the light/dark theme mode.
  const handleThemeChange = (newTheme: Theme) => setTheme(newTheme);
  // Updates the accent color theme.
  const handleColorThemeChange = (newColorTheme: ColorTheme) => setColorTheme(newColorTheme);

  // Stores whether notification sounds should play.
  const handleSoundChange = (value: boolean) => {
    setSoundEnabled(value);
    localStorage.setItem("soundEnabled", String(value));
  };

  // Stores the email reminder preference.
  const handleEmailUpdatesChange = (value: boolean) => {
    setEmailUpdates(value);
    localStorage.setItem("emailUpdates", String(value));
  };

  // Stores the weekly report preference.
  const handleWeeklyReportChange = (value: boolean) => {
    setWeeklyReport(value);
    localStorage.setItem("weeklyReport", String(value));
  };

  // Weekly reports require learning insights history to remain enabled.
  useEffect(() => {
    if (!privacyInsightsHistoryEnabled && weeklyReport) {
      setWeeklyReport(false);
      localStorage.setItem("weeklyReport", "false");
    }
  }, [privacyInsightsHistoryEnabled, weeklyReport]);

  // Explains how browser notification permissions work when the permission is already granted.
  const handleBrowserPermissionClick = async () => {
    setActionMessage(null);

    if (permission === "granted") {
      setDialog({
        isOpen: true,
        title: "Browser notifications are already enabled",
        message:
          "To change browser notification permissions, open your browser's site settings for 11Planner.",
      });
      return;
    }

    const result = await requestPermission();
    if (result === "granted") {
      setActionMessage({ type: "success", text: "Browser notifications are now enabled." });
    } else if (result === "denied") {
      setActionMessage({ type: "error", text: "Browser notifications were blocked by your browser." });
    } else {
      const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;
      const host = typeof window !== "undefined" ? window.location.hostname : "";
      const secureContextHint = !isSecure && host !== "localhost" && host !== "127.0.0.1"
        ? "Open 11Planner on HTTPS (or localhost) and try again."
        : "Check Chrome site permissions, then reload this page.";

      setDialog({
        isOpen: true,
        title: "Browser notifications unavailable",
        message: `This browser session cannot request notifications right now. ${secureContextHint}`,
      });
    }
  };

  // Stores whether exports/print views include personal identity details.
  const handlePrivacyIncludePersonalInfoChange = (value: boolean) => {
    setPrivacyIncludePersonalInfo(value);
    localStorage.setItem("privacyIncludePersonalInfo", String(value));
  };

  // Stores the analytics opt-in preference.
  const handlePrivacyAnalyticsChange = (value: boolean) => {
    setPrivacyAnalyticsEnabled(value);
    localStorage.setItem("privacyAnalyticsEnabled", String(value));
    if (!value) {
      localStorage.removeItem("anonymousAnalyticsEvents");
    }
  };

  // Stores whether personalized insights are enabled.
  const handlePrivacyPersonalizationChange = (value: boolean) => {
    setPrivacyPersonalizationEnabled(value);
    localStorage.setItem("privacyPersonalizationEnabled", String(value));
  };

  // Stores whether learning insights history is retained for trend analytics.
  const handlePrivacyInsightsHistoryChange = (value: boolean) => {
    setPrivacyInsightsHistoryEnabled(value);
    localStorage.setItem("privacyInsightsHistoryEnabled", String(value));
  };

  // Adds lightweight anonymous product analytics events when analytics sharing is enabled.
  const trackAnonymousEvent = useCallback((event: string) => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("privacyAnalyticsEnabled") === "false") return;

    try {
      const raw = localStorage.getItem("anonymousAnalyticsEvents");
      const parsed = raw ? JSON.parse(raw) : [];
      const events: Array<{ event: string; ts: string }> = Array.isArray(parsed) ? parsed : [];
      events.push({ event, ts: new Date().toISOString() });
      localStorage.setItem("anonymousAnalyticsEvents", JSON.stringify(events.slice(-100)));
    } catch {
      // Ignore storage issues so settings interactions stay resilient.
    }
  }, []);

  // Sends a password reset email to the signed-in account.
  const handleChangePassword = async () => {
    setActionMessage(null);
    setIsSendingPasswordReset(true);
    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setActionMessage({ type: "error", text: `Could not get user. ${userError.message}` });
        return;
      }

      if (!authUser?.email) {
        setActionMessage({ type: "error", text: "Could not retrieve your email address. Please log out and log back in." });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setActionMessage({ type: "error", text: error.message });
        return;
      }

      setActionMessage({ type: "success", text: "Password reset email sent. Check your inbox for the reset link." });
    } catch {
      setActionMessage({ type: "error", text: "Failed to send reset email. Please try again." });
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  // Downloads a dedicated PDF from Settings without opening a new tab.
  const handleExportScheduleAsPdf = async () => {
    setActionMessage(null);
    setIsExportingPdf(true);
    trackAnonymousEvent("settings_export_schedule_pdf");

    if (!user?.id) {
      setActionMessage({ type: "error", text: "Please sign in to export your schedule." });
      setIsExportingPdf(false);
      return;
    }

    try {
      const { data: rawBlocks, error: blocksError } = await supabase
        .from("schedule_blocks")
        .select("id, source_task_id, starts_at, ends_at, created_at, user_id")
        .eq("user_id", user.id)
        .order("starts_at", { ascending: true });

      if (blocksError) {
        throw blocksError;
      }

      const blocks = (rawBlocks || []) as Array<{
        id: string;
        source_task_id: string | null;
        starts_at: string;
        ends_at: string;
      }>;

      const uniqueTaskIds = [...new Set(blocks.map((block) => block.source_task_id).filter(Boolean))] as string[];
      const taskTitleById = new Map<string, string>();
      const taskCourseById = new Map<string, string | null>();
      const courseNameById = new Map<string, string>();

      if (uniqueTaskIds.length > 0) {
        const { data: taskRows, error: tasksError } = await supabase
          .from("tasks")
          .select("id, task_title, course_id")
          .in("id", uniqueTaskIds);

        if (tasksError) {
          throw tasksError;
        }

        (taskRows || []).forEach((task) => {
          taskTitleById.set(task.id as string, (task.task_title as string) || "Study Block");
          taskCourseById.set(task.id as string, (task.course_id as string | null) || null);
        });

        const uniqueCourseIds = [...new Set((taskRows || []).map((task) => task.course_id).filter(Boolean))] as string[];

        if (uniqueCourseIds.length > 0) {
          const { data: courseRows, error: coursesError } = await supabase
            .from("courses")
            .select("id, course_name")
            .in("id", uniqueCourseIds);

          if (coursesError) {
            throw coursesError;
          }

          (courseRows || []).forEach((course) => {
            courseNameById.set(course.id as string, (course.course_name as string) || "");
          });
        }
      }

      const groupedByDate = new Map<string, Array<{ timeRange: string; title: string; course: string; duration: string }>>();

      blocks.forEach((block) => {
        const start = new Date(block.starts_at);
        const end = new Date(block.ends_at);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return;
        }

        const dateKey = start.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const timeRange = `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        const rawDuration = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
        const durationText = `${rawDuration} min`;
        const taskId = block.source_task_id || "";
        const taskTitle = taskTitleById.get(taskId) || "Study Block";
        const courseId = taskCourseById.get(taskId) || null;
        const courseName = courseId ? courseNameById.get(courseId) || "" : "";

        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, []);
        }
        groupedByDate.get(dateKey)?.push({
          timeRange,
          title: taskTitle,
          course: courseName,
          duration: durationText,
        });
      });

      const generatedAt = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let cursorY = 44;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("11Planner Schedule Export", 40, cursorY);
      cursorY += 20;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Generated ${generatedAt}`, 40, cursorY);
      cursorY += 16;

      if (privacyIncludePersonalInfo) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(profileDisplayName, 40, cursorY);
        cursorY += 12;
        if (user.email) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(user.email, 40, cursorY);
          cursorY += 14;
        }
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text("Anonymous export mode enabled", 40, cursorY);
        cursorY += 14;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(40, cursorY, pageWidth - 40, cursorY);
      cursorY += 16;

      if (groupedByDate.size === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text("No schedule blocks found to export yet.", 40, cursorY);
      } else {
        [...groupedByDate.entries()].forEach(([dateLabel, rows], index) => {
          if (cursorY > pageHeight - 120) {
            doc.addPage();
            cursorY = 44;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(15, 23, 42);
          doc.text(dateLabel, 40, cursorY);
          cursorY += 8;

          autoTable(doc, {
            startY: cursorY + 6,
            margin: { left: 40, right: 40 },
            tableWidth: pageWidth - 80,
            head: [["Time", "Task", "Course", "Duration"]],
            body: rows.map((row) => [row.timeRange, row.title, row.course || "-", row.duration]),
            theme: "grid",
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: 6,
              textColor: [15, 23, 42],
              lineColor: [203, 213, 225],
              lineWidth: 0.5,
              overflow: "linebreak",
            },
            columnStyles: {
              0: { cellWidth: 120 },
              1: { cellWidth: 190 },
              2: { cellWidth: 145 },
              3: { cellWidth: 60, halign: "left" },
            },
            headStyles: {
              fillColor: [248, 250, 252],
              textColor: [15, 23, 42],
              lineColor: [203, 213, 225],
              lineWidth: 0.5,
              fontStyle: "bold",
            },
            bodyStyles: {
              fillColor: [255, 255, 255],
            },
          });

          const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
          cursorY = (lastTable?.finalY ?? cursorY + 24) + 14;

          if (index < groupedByDate.size - 1 && cursorY > pageHeight - 90) {
            doc.addPage();
            cursorY = 44;
          }
        });
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`11planner-schedule-${fileDate}.pdf`);
      setActionMessage({ type: "success", text: "Schedule PDF downloaded." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export schedule.";
      setActionMessage({ type: "error", text: `Failed to export schedule: ${message}` });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Resets insights history timeline so trend/streak analytics begin from now.
  const handleDeleteInsightsHistory = () => {
    setActionMessage(null);
    setDialog({
      isOpen: true,
      title: "Delete learning insights history?",
      message: "This resets trend and streak analytics so insights begin from now.",
      confirmText: "Delete History",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDialog({ isOpen: false, title: "", message: "" });
        try {
          setIsDeletingInsightsHistory(true);
          localStorage.setItem("learningInsightsHistoryStartDate", new Date().toISOString());
          localStorage.removeItem("taskCompletionTimestamps");
          trackAnonymousEvent("settings_delete_learning_insights_history");
          setActionMessage({ type: "success", text: "Learning insights history deleted. New insights start now." });
        } catch {
          setActionMessage({ type: "error", text: "Failed to delete learning insights history." });
        } finally {
          setIsDeletingInsightsHistory(false);
        }
      },
    });
  };

  // Clears planner data and resets saved preferences for the current account.
  const handleClearAccountData = () => {
    setActionMessage(null);
    setDialog({
      isOpen: true,
      title: "Clear account data?",
      message:
        "This will remove your courses, assignments, tasks, schedule blocks, and saved planner preferences.",
      confirmText: "Clear Data",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDialog({ isOpen: false, title: "", message: "" });
      if (!user?.id) {
        setActionMessage({ type: "error", text: "Please sign in to clear account data." });
        return;
      }

      try {
        setIsClearingAccountData(true);
        const keysToClear = [
          "emailUpdates",
          "weeklyReport",
          "dailyLimit",
          "privacyIncludePersonalInfo",
          "privacyProfileVisible",
          "privacyAnalyticsEnabled",
          "privacyPersonalizationEnabled",
          "privacyInsightsHistoryEnabled",
          "privacyShareProgress",
          "learningInsightsHistoryStartDate",
          "taskCompletionTimestamps",
          "anonymousAnalyticsEvents",
          "soundEnabled",
          "notifications",
          "reminderLeadHours",
          "notificationAlertState",
          "colorTheme",
          "theme",
        ];
        keysToClear.forEach((key) => localStorage.removeItem(key));

        const clearScheduleBlocks = await supabase
          .from("schedule_blocks")
          .delete()
          .eq("user_id", user.id);
        if (clearScheduleBlocks.error) throw clearScheduleBlocks.error;

        const clearTasks = await supabase
          .from("tasks")
          .delete()
          .eq("user_id", user.id);
        if (clearTasks.error) throw clearTasks.error;

        const clearAssignments = await supabase
          .from("assignments")
          .delete()
          .eq("user_id", user.id);
        if (clearAssignments.error) throw clearAssignments.error;

        const clearCourses = await supabase
          .from("courses")
          .delete()
          .eq("user_id", user.id);
        if (clearCourses.error) throw clearCourses.error;

        const clearProfilePreferences = await supabase
          .from("profiles")
          .update({
            worktime: null,
            workdays: null,
            workstyle: null,
            assignmentplan: null,
            additional_info: null,
            daily_study_limit: null,
          })
          .eq("id", user.id);
        if (clearProfilePreferences.error) throw clearProfilePreferences.error;

        const clearCloudSettings = await supabase
          .from("user_settings")
          .delete()
          .eq("user_id", user.id);
        if (clearCloudSettings.error) throw clearCloudSettings.error;

        handleThemeChange("light");
        handleColorThemeChange("emerald");
        setNotificationsEnabled(true);
        setReminderLeadHours(24);
        handleSoundChange(true);
        handleEmailUpdatesChange(true);
        handleWeeklyReportChange(true);
        handlePrivacyIncludePersonalInfoChange(true);
        handlePrivacyAnalyticsChange(false);
        handlePrivacyPersonalizationChange(true);
        handlePrivacyInsightsHistoryChange(true);

        setActionMessage({ type: "success", text: "Account data cleared." });
      } catch (err) {
        setActionMessage({
          type: "error",
          text: err instanceof Error ? `Failed to clear account data: ${err.message}` : "Failed to clear account data.",
        });
      } finally {
        setIsClearingAccountData(false);
      }
      },
    });
  };

  // Permanently deletes the current account after confirmation.
  const handleDeleteAccount = async () => {
    setActionMessage(null);
    if (!user?.id) {
      setActionMessage({ type: "error", text: "Please sign in to delete your account." });
      return;
    }

    setDialog({
      isOpen: true,
      title: "Delete account permanently?",
      message: "This will remove your tasks, schedule, courses, and profile data.",
      confirmText: "Delete Account",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDialog({ isOpen: false, title: "", message: "" });

        try {
          setIsDeletingAccount(true);
          const response = await fetch(`${API_BASE_URL}/api/account/${user.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Failed to delete account");
          }

          await supabase
            .from("user_settings")
            .delete()
            .eq("user_id", user.id);

          await supabase.auth.signOut();
          localStorage.removeItem("emailUpdates");
          localStorage.removeItem("weeklyReport");
          localStorage.removeItem("dailyLimit");
          localStorage.removeItem("privacyIncludePersonalInfo");
          localStorage.removeItem("privacyProfileVisible");
          localStorage.removeItem("privacyAnalyticsEnabled");
          localStorage.removeItem("privacyPersonalizationEnabled");
          localStorage.removeItem("privacyInsightsHistoryEnabled");
          localStorage.removeItem("privacyShareProgress");
          localStorage.removeItem("learningInsightsHistoryStartDate");
          localStorage.removeItem("taskCompletionTimestamps");
          localStorage.removeItem("anonymousAnalyticsEvents");
          localStorage.removeItem("soundEnabled");

          setActionMessage({ type: "success", text: "Account deleted successfully." });
          window.location.href = "/auth";
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not delete account.";
          setActionMessage({ type: "error", text: message });
        } finally {
          setIsDeletingAccount(false);
        }
      },
    });
  };

  const hasChanges = useMemo(() => {
    return (
      theme !== savedSettings.theme ||
      colorTheme !== savedSettings.colorTheme ||
      notificationsEnabled !== savedSettings.notifications ||
      reminderLeadHours !== savedSettings.reminderLeadHours ||
      soundEnabled !== savedSettings.soundEnabled ||
      emailUpdates !== savedSettings.emailUpdates ||
      weeklyReport !== savedSettings.weeklyReport ||
      privacyIncludePersonalInfo !== savedSettings.privacyIncludePersonalInfo ||
      privacyAnalyticsEnabled !== savedSettings.privacyAnalyticsEnabled ||
      privacyPersonalizationEnabled !== savedSettings.privacyPersonalizationEnabled ||
      privacyInsightsHistoryEnabled !== savedSettings.privacyInsightsHistoryEnabled
    );
  }, [
    theme,
    colorTheme,
    notificationsEnabled,
    reminderLeadHours,
    soundEnabled,
    emailUpdates,
    weeklyReport,
    privacyIncludePersonalInfo,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyInsightsHistoryEnabled,
    savedSettings,
  ]);

  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      setSavedSettings({
        theme: theme as Theme,
        colorTheme: colorTheme as ColorTheme,
        notifications: notificationsEnabled,
        reminderLeadHours,
        soundEnabled,
        emailUpdates,
        weeklyReport,
        privacyIncludePersonalInfo,
        privacyAnalyticsEnabled,
        privacyPersonalizationEnabled,
        privacyInsightsHistoryEnabled,
      });
      setLastSavedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [
    hasChanges,
    theme,
    colorTheme,
    notificationsEnabled,
    reminderLeadHours,
    soundEnabled,
    emailUpdates,
    weeklyReport,
    privacyIncludePersonalInfo,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyInsightsHistoryEnabled,
  ]);

  const accentSoftStyle = {
    backgroundColor: "var(--theme-accent-soft)",
    color: "var(--theme-accent-strong)",
    borderColor: "var(--theme-accent)",
  } as const;

  const accentStrongStyle = {
    backgroundColor: "var(--theme-accent-strong)",
    borderColor: "var(--theme-accent-strong)",
    color: "#ffffff",
  } as const;

  const browserPermissionButtonClass =
    permission === "granted"
      ? "px-4 py-2 rounded-lg text-xs font-semibold transition bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
      : "px-4 py-2 rounded-lg text-xs font-semibold transition bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600";

  // Restores the defaults for whichever settings section is currently open.
  const handleResetDefaults = () => {
    switch (activePanel) {
      case "appearance":
        handleThemeChange("light");
        handleColorThemeChange("emerald");
        break;
      case "notifications":
        setNotificationsEnabled(true);
        setReminderLeadHours(24);
        handleSoundChange(true);
        handleEmailUpdatesChange(true);
        handleWeeklyReportChange(true);
        break;
      case "privacy":
        handlePrivacyIncludePersonalInfoChange(true);
        handlePrivacyAnalyticsChange(false);
        handlePrivacyPersonalizationChange(true);
        handlePrivacyInsightsHistoryChange(true);
        break;
      default:
        break;
    }
  };

  const navItems: Array<{ id: SettingsPanel; label: string; icon: string; keywords: string[] }> = useMemo(
    () => [
      {
        id: "appearance",
        label: "Appearance",
        icon: "palette",
        keywords: ["theme", "color", "accent", "appearance", "dark", "light"],
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "notifications",
        keywords: ["push", "sound", "email", "weekly", "reports", "alerts", "reminders"],
      },
      {
        id: "privacy",
        label: "Privacy",
        icon: "lock",
        keywords: ["privacy", "analytics", "history", "export", "personalization", "personal info"],
      },
      {
        id: "account",
        label: "Account",
        icon: "person",
        keywords: ["account", "security", "password", "profile", "login"],
      },
      {
        id: "data",
        label: "Data",
        icon: "database",
        keywords: ["export", "delete", "clear", "backup", "data"],
      },
    ],
    []
  );

  const filteredNavItems = useMemo(() => {
    const query = settingsSearch.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => {
      const haystack = [item.label.toLowerCase(), ...item.keywords].join(" ");
      return haystack.includes(query);
    });
  }, [settingsSearch, navItems]);

  useEffect(() => {
    if (filteredNavItems.length === 0) return;
    if (!filteredNavItems.some((item) => item.id === activePanel)) {
      setActivePanel(filteredNavItems[0].id);
    }
  }, [filteredNavItems, activePanel]);

  const sectionCardClass =
    "rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 backdrop-blur-md p-5 md:p-6";

  const profileDisplayName = useMemo(() => {
    const first = (user?.firstname || "").trim();
    const last = (user?.lastname || "").trim();
    const full = `${first} ${last}`.trim();
    return full || user?.email || "User";
  }, [user]);

  const profileInitial = useMemo(() => {
    const first = user?.firstname?.trim()?.[0];
    const last = user?.lastname?.trim()?.[0];
    const fromName = `${first || ""}${last || ""}`.trim();
    if (fromName) return fromName.toUpperCase();
    return (user?.email?.charAt(0).toUpperCase() || "U");
  }, [user]);

  if (!isMounted) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_30px_70px_-35px_rgba(15,23,42,0.6)] overflow-hidden">
            <div className="px-5 md:px-8 py-5 border-b border-slate-200/70 dark:border-slate-700/70">
              <div className="h-8 w-40 rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
            </div>
            <div className="p-6">
              <div className="h-48 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_30px_70px_-35px_rgba(15,23,42,0.6)] overflow-hidden">
          <div
            className="px-5 md:px-8 py-5 border-b border-slate-200/70 dark:border-slate-700/70"
            style={{
              backgroundImage:
                effectiveTheme === "dark"
                  ? "linear-gradient(to right, color-mix(in srgb, var(--theme-accent-soft) 25%, rgba(15,23,42,0.84)), rgba(15,23,42,0.76), rgba(15,23,42,0.66))"
                  : "linear-gradient(to right, color-mix(in srgb, var(--theme-accent-soft) 58%, white), rgba(255,255,255,0.72), color-mix(in srgb, var(--theme-accent-soft) 40%, transparent))",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-700 dark:text-slate-100">settings</span>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
              </div>

              <Link
                href="/profile"
                className="inline-flex items-center gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/75 dark:bg-slate-800/60 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <div className="w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold" style={accentSoftStyle}>
                  {profileInitial}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{profileDisplayName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">View Profile</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[600px]">
            <aside className="border-r border-slate-200/70 dark:border-slate-700/70 bg-white/55 dark:bg-slate-900/45 p-4 md:p-5">
              <div className="mb-4 rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-white/75 dark:bg-slate-800/65 px-3 py-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-slate-500 dark:text-slate-300">search</span>
                <input
                  type="text"
                  value={settingsSearch}
                  onChange={(e) => setSettingsSearch(e.target.value)}
                  placeholder="Search settings"
                  className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none"
                />
              </div>
              <nav className="space-y-1.5">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePanel(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition ${
                      activePanel === item.id
                        ? "border"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                    }`}
                    style={activePanel === item.id ? accentSoftStyle : undefined}
                  >
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                {filteredNavItems.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-3 py-3 text-xs text-slate-500 dark:text-slate-300">
                    No matching settings found.
                  </div>
                )}
              </nav>
            </aside>

            <main className="p-4 md:p-6 space-y-5 bg-gradient-to-b from-white/45 to-white/25 dark:from-slate-900/45 dark:to-slate-900/25">
              {actionMessage && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                    actionMessage.type === "success"
                      ? ""
                      : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/25 dark:text-rose-200"
                  }`}
                  style={
                    actionMessage.type === "success"
                      ? {
                          borderColor: "var(--theme-accent)",
                          backgroundColor: "var(--theme-accent-soft)",
                          color: "var(--theme-accent-strong)",
                        }
                      : undefined
                  }
                >
                  {actionMessage.text}
                </div>
              )}

              {activePanel === "appearance" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Appearance</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Customize the look and feel of your planner.</p>

                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2">Theme Mode</p>
                    <div className="flex gap-2.5">
                      {(["light", "dark"] as Theme[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleThemeChange(mode)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition border ${
                            theme === mode
                              ? "text-white"
                              : "bg-white/75 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          style={theme === mode ? accentStrongStyle : undefined}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2">Accent Theme</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {colorThemes.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleColorThemeChange(option as ColorTheme)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-semibold capitalize transition ${
                            colorTheme === option
                              ? ""
                              : "border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          style={colorTheme === option ? accentSoftStyle : undefined}
                        >
                          <span className="h-3.5 w-3.5 rounded-full border border-white/50" style={{ background: colorThemeSwatches[option as ColorTheme] }} />
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {activePanel === "privacy" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Privacy</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Control personalization, insights history, analytics sharing, and export identity details.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Personalized Planner Recommendations</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Use your study activity to tailor focus recommendations.</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyPersonalizationChange(!privacyPersonalizationEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${privacyPersonalizationEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={privacyPersonalizationEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacyPersonalizationEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Learning Insights History</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Keep progress history for trends and streak analytics.</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyInsightsHistoryChange(!privacyInsightsHistoryEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${privacyInsightsHistoryEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={privacyInsightsHistoryEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacyInsightsHistoryEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Anonymous Product Analytics</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Share anonymous usage metrics to help improve 11Planner.</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyAnalyticsChange(!privacyAnalyticsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${privacyAnalyticsEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={privacyAnalyticsEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacyAnalyticsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Include Personal Info in Exports</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Show your name/email in print-ready schedule exports.</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyIncludePersonalInfoChange(!privacyIncludePersonalInfo)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${privacyIncludePersonalInfo ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={privacyIncludePersonalInfo ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacyIncludePersonalInfo ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {activePanel === "account" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Account</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Manage account access and sensitive account actions.</p>

                  <button
                    onClick={handleChangePassword}
                    disabled={isSendingPasswordReset}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{isSendingPasswordReset ? "Sending reset link..." : "Change Password"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Send a reset link to your email</p>
                  </button>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full text-left px-4 py-3 rounded-xl border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-red-700 dark:text-red-300">
                      {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
                    </p>
                    <p className="text-xs text-red-400 dark:text-red-300">Permanently remove your account and data</p>
                  </button>
                </section>
              )}

              {activePanel === "data" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Data</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Export or clear your planner data.</p>

                  <button
                    onClick={handleExportScheduleAsPdf}
                    disabled={isExportingPdf}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {isExportingPdf ? "Preparing PDF export..." : "Export Schedule as PDF"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Open your schedule in a print-ready view for PDF save.</p>
                  </button>

                  <button
                    onClick={handleDeleteInsightsHistory}
                    disabled={isDeletingInsightsHistory}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {isDeletingInsightsHistory ? "Deleting Insights History..." : "Delete Learning Insights History"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reset trend and streak analytics so new insights begin now.</p>
                  </button>

                  <button
                    onClick={handleClearAccountData}
                    disabled={isClearingAccountData}
                    className="w-full text-left px-4 py-3 rounded-xl border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-red-700 dark:text-red-300">
                      {isClearingAccountData ? "Clearing Account Data..." : "Clear Account Data"}
                    </p>
                    <p className="text-xs text-red-400 dark:text-red-300">Remove planner records and reset saved preferences.</p>
                  </button>
                </section>
              )}

              {activePanel === "notifications" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Notifications</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Control alert channels and reminder timing for your tasks and study blocks.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Receive alerts about upcoming deadlines.</p>
                      </div>
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notificationsEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={notificationsEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Notification Sound</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Play a sound with reminders.</p>
                      </div>
                      <button
                        onClick={() => handleSoundChange(!soundEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${soundEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={soundEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${soundEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Browser Permission</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {permission === "granted"
                            ? "Notifications enabled in your browser"
                            : permission === "denied"
                            ? "Blocked by your browser"
                            : permission === "unsupported"
                            ? "Not supported in this browser"
                            : "Not enabled yet"}
                        </p>
                      </div>
                      <button
                        onClick={handleBrowserPermissionClick}
                        disabled={permission === "denied" || permission === "unsupported"}
                        className={`${browserPermissionButtonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {permission === "granted" ? "Enabled" : "Enable"}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reminder lead time (hours)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="168"
                          value={reminderLeadHours}
                          onChange={(e) => setReminderLeadHours(Math.min(168, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                          className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={reminderLeadHours}
                          onChange={(e) => setReminderLeadHours(Math.min(168, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                          className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-right text-slate-900 dark:text-white"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">hours</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Email Updates</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Send email copies of new task alerts from Notifications.</p>
                      </div>
                      <button
                        onClick={() => handleEmailUpdatesChange(!emailUpdates)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${emailUpdates ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={emailUpdates ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailUpdates ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Weekly Report</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Enable a weekly summary email for your current task load.</p>
                      </div>
                      <button
                        onClick={() => handleWeeklyReportChange(!weeklyReport)}
                        disabled={!privacyInsightsHistoryEnabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${weeklyReport ? "" : "bg-slate-300 dark:bg-slate-600"} ${!privacyInsightsHistoryEnabled ? "opacity-60 cursor-not-allowed" : ""}`}
                        style={weeklyReport ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${weeklyReport ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {!privacyInsightsHistoryEnabled && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Weekly reports are unavailable while Learning Insights History is off. Turn it on in Privacy to enable this.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {(activePanel === "appearance" || activePanel === "notifications" || activePanel === "privacy") && (
                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-700 dark:text-slate-200">
                    {hasChanges ? "Saving..." : "All changes saved"}
                    {lastSavedAt && <span className="ml-2 text-slate-500 dark:text-slate-300">Last saved at {lastSavedAt}</span>}
                  </span>
                  <button onClick={handleResetDefaults} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold py-2 px-4 rounded-lg transition border border-slate-300 dark:border-slate-600">
                    Reset This Section
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />

      <AppDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        destructive={dialog.destructive}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ isOpen: false, title: "", message: "" })}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageContent />
    </Suspense>
  );
}
