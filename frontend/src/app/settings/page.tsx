"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification } from "@/contexts/NotificationContext";
import Footer from "@/components/Footer";
import AppDialog from "@/components/AppDialog";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Theme = "light" | "dark" | "auto";
type ColorTheme = "emerald" | "ocean" | "rose" | "slate" | "amber" | "violet";
type SettingsPanel = "personalize" | "notifications" | "account";

type UserSummary = {
  id?: string;
  email?: string;
  firstname?: string | null;
  lastname?: string | null;
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
  const [privacyProfileVisible, setPrivacyProfileVisible] = useState(true);
  const [privacyAnalyticsEnabled, setPrivacyAnalyticsEnabled] = useState(false);
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(true);
  const [privacyShareProgress, setPrivacyShareProgress] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isClearingAccountData, setIsClearingAccountData] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel>("personalize");
  const [settingsSearch, setSettingsSearch] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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

    setSoundEnabled(readStoredBoolean("soundEnabled", true));
    setEmailUpdates(readStoredBoolean("emailUpdates", true));
    setWeeklyReport(readStoredBoolean("weeklyReport", true));
    setPrivacyProfileVisible(readStoredBoolean("privacyProfileVisible", true));
    setPrivacyAnalyticsEnabled(readStoredBoolean("privacyAnalyticsEnabled", false));
    setPrivacyPersonalizationEnabled(readStoredBoolean("privacyPersonalizationEnabled", true));
    setPrivacyShareProgress(readStoredBoolean("privacyShareProgress", false));
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
    const panelParam = searchParams.get("panel");
    const validPanels: SettingsPanel[] = ["personalize", "notifications", "account"];
    if (panelParam && validPanels.includes(panelParam as SettingsPanel)) {
      setActivePanel(panelParam as SettingsPanel);
    }
  }, [searchParams]);

  const [savedSettings, setSavedSettings] = useState({
    theme: theme as Theme,
    colorTheme: colorTheme as ColorTheme,
    notifications: notificationsEnabled,
    reminderLeadHours,
    soundEnabled,
    emailUpdates,
    weeklyReport,
    privacyProfileVisible,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyShareProgress,
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

  // Stores whether the profile is visible in shared views.
  const handlePrivacyProfileVisibleChange = (value: boolean) => {
    setPrivacyProfileVisible(value);
    localStorage.setItem("privacyProfileVisible", String(value));
  };

  // Stores the analytics opt-in preference.
  const handlePrivacyAnalyticsChange = (value: boolean) => {
    setPrivacyAnalyticsEnabled(value);
    localStorage.setItem("privacyAnalyticsEnabled", String(value));
  };

  // Stores whether personalized insights are enabled.
  const handlePrivacyPersonalizationChange = (value: boolean) => {
    setPrivacyPersonalizationEnabled(value);
    localStorage.setItem("privacyPersonalizationEnabled", String(value));
  };

  // Stores whether planner progress can be shared with integrations.
  const handlePrivacyShareProgressChange = (value: boolean) => {
    setPrivacyShareProgress(value);
    localStorage.setItem("privacyShareProgress", String(value));
  };

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

  // Opens the schedule in a print-ready tab so the user can save it as PDF.
  const handleExportScheduleAsPdf = () => {
    setActionMessage(null);
    setIsExportingPdf(true);
    const scheduleWindow = window.open("/schedule", "_blank");
    if (!scheduleWindow) {
      setActionMessage({ type: "error", text: "Please allow pop-ups to export schedule as PDF." });
      setIsExportingPdf(false);
      return;
    }

    setTimeout(() => {
      scheduleWindow.focus();
      scheduleWindow.print();
      setActionMessage({ type: "success", text: "Schedule opened in a new tab. Use your browser print dialog to save as PDF." });
      setIsExportingPdf(false);
    }, 1200);
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
          "privacyProfileVisible",
          "privacyAnalyticsEnabled",
          "privacyPersonalizationEnabled",
          "privacyShareProgress",
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

        handleThemeChange("light");
        handleColorThemeChange("emerald");
        setNotificationsEnabled(true);
        setReminderLeadHours(24);
        handleSoundChange(true);
        handleEmailUpdatesChange(true);
        handleWeeklyReportChange(true);
        handlePrivacyProfileVisibleChange(true);
        handlePrivacyAnalyticsChange(false);
        handlePrivacyPersonalizationChange(true);
        handlePrivacyShareProgressChange(false);

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

          await supabase.auth.signOut();
          localStorage.removeItem("emailUpdates");
          localStorage.removeItem("weeklyReport");
          localStorage.removeItem("dailyLimit");
          localStorage.removeItem("privacyProfileVisible");
          localStorage.removeItem("privacyAnalyticsEnabled");
          localStorage.removeItem("privacyPersonalizationEnabled");
          localStorage.removeItem("privacyShareProgress");
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
      privacyProfileVisible !== savedSettings.privacyProfileVisible ||
      privacyAnalyticsEnabled !== savedSettings.privacyAnalyticsEnabled ||
      privacyPersonalizationEnabled !== savedSettings.privacyPersonalizationEnabled ||
      privacyShareProgress !== savedSettings.privacyShareProgress
    );
  }, [
    theme,
    colorTheme,
    notificationsEnabled,
    reminderLeadHours,
    soundEnabled,
    emailUpdates,
    weeklyReport,
    privacyProfileVisible,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyShareProgress,
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
        privacyProfileVisible,
        privacyAnalyticsEnabled,
        privacyPersonalizationEnabled,
        privacyShareProgress,
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
    privacyProfileVisible,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyShareProgress,
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

  // Restores the defaults for whichever settings section is currently open.
  const handleResetDefaults = () => {
    switch (activePanel) {
      case "personalize":
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
      case "account":
        handlePrivacyProfileVisibleChange(true);
        handlePrivacyAnalyticsChange(false);
        handlePrivacyPersonalizationChange(true);
        handlePrivacyShareProgressChange(false);
        break;
      default:
        break;
    }
  };

  const navItems: Array<{ id: SettingsPanel; label: string; icon: string; keywords: string[] }> = useMemo(
    () => [
      {
        id: "personalize",
        label: "Personalize",
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
        id: "account",
        label: "Account",
        icon: "person",
        keywords: ["account", "privacy", "security", "password", "export", "delete"],
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

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[700px]">
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

              {activePanel === "personalize" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Personalize</div>
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

              {activePanel === "account" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Account & Privacy</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Manage login and privacy controls.</p>

                  <button
                    onClick={handleChangePassword}
                    disabled={isSendingPasswordReset}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{isSendingPasswordReset ? "Sending reset link..." : "Change Password"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Send a reset link to your email</p>
                  </button>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 p-4 space-y-3">
                    <p className="font-medium text-slate-900 dark:text-white">Privacy & Security</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Public Profile Visibility</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Allow profile details in shared views.</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyProfileVisibleChange(!privacyProfileVisible)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${privacyProfileVisible ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={privacyProfileVisible ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacyProfileVisible ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Usage Analytics</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Share anonymous product metrics.</p>
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
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Personalized Insights</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Use planner activity for smart recommendations.</p>
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
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Share Progress with Integrations</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Allow connected tools to read progress status.</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyShareProgressChange(!privacyShareProgress)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${privacyShareProgress ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={privacyShareProgress ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacyShareProgress ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <button
                      onClick={handleExportScheduleAsPdf}
                      disabled={isExportingPdf}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100"><span className="material-symbols-outlined text-base">picture_as_pdf</span>{isExportingPdf ? "Preparing PDF export..." : "Export Schedule as PDF"}</span>
                      <span className="material-symbols-outlined text-base text-slate-400">chevron_right</span>
                    </button>
                    <button
                      onClick={handleClearAccountData}
                      disabled={isClearingAccountData}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200/70 dark:border-red-800/50 bg-red-50/70 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <span className="material-symbols-outlined text-base">delete</span>
                        {isClearingAccountData ? "Clearing Account Data..." : "Clear Account Data"}
                      </span>
                      <span className="material-symbols-outlined text-base text-red-300">chevron_right</span>
                    </button>
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full text-left mt-4 px-4 py-3 rounded-xl border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-red-700 dark:text-red-300">
                      {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
                    </p>
                    <p className="text-xs text-red-400 dark:text-red-300">Permanently remove your account and data</p>
                  </button>
                </section>
              )}

              {activePanel === "notifications" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Notifications</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Control alert channels and reminder timing for your tasks and study blocks.</p>

                  <div className="mb-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 p-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Delivery channels</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      Notifications feed on the Notifications page will reflect these settings.
                    </p>
                  </div>

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
                        onClick={requestPermission}
                        disabled={permission === "denied" || permission === "unsupported"}
                        className="px-4 py-2 rounded-lg text-xs font-semibold transition bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">Store preference for email reminders on important tasks.</p>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">Store preference for weekly study summaries.</p>
                      </div>
                      <button
                        onClick={() => handleWeeklyReportChange(!weeklyReport)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${weeklyReport ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={weeklyReport ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${weeklyReport ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {hasChanges ? "Saving..." : "All changes saved"}
                  {lastSavedAt && <span className="ml-2 text-slate-500 dark:text-slate-300">Last saved at {lastSavedAt}</span>}
                </span>
                <button onClick={handleResetDefaults} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold py-2 px-4 rounded-lg transition border border-slate-300 dark:border-slate-600">
                  Reset This Section
                </button>
              </div>
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
