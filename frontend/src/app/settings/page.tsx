"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification } from "@/contexts/NotificationContext";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Theme = "light" | "dark" | "auto";
type ColorTheme = "emerald" | "ocean" | "rose" | "slate" | "amber" | "violet";
type SettingsPanel = "schedule" | "personalize" | "reminders" | "account" | "support";

const colorThemeSwatches: Record<ColorTheme, string> = {
  emerald: "linear-gradient(135deg, #10b981, #059669)",
  ocean: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  rose: "linear-gradient(135deg, #f43f5e, #e11d48)",
  slate: "linear-gradient(135deg, #64748b, #475569)",
  amber: "linear-gradient(135deg, #f59e0b, #d97706)",
  violet: "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

const sliderStyles = `
  input[type="range"] {
    accent-color: var(--theme-accent);
  }
  input[type="range"]::-webkit-slider-thumb {
    accent-color: var(--theme-accent);
  }
  input[type="range"]::-moz-range-thumb {
    background-color: var(--theme-accent);
    border-color: var(--theme-accent);
  }
`;

const readStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  return value === null ? fallback : value !== "false";
};

const readStoredNumber = (key: string, fallback: number): number => {
  if (typeof window === "undefined") return fallback;
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
};

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { theme, setTheme, colorTheme, setColorTheme, colorThemes, effectiveTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => readStoredBoolean("soundEnabled", true));
  const [privacyProfileVisible, setPrivacyProfileVisible] = useState(() => readStoredBoolean("privacyProfileVisible", true));
  const [privacyAnalyticsEnabled, setPrivacyAnalyticsEnabled] = useState(() => readStoredBoolean("privacyAnalyticsEnabled", false));
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(() => readStoredBoolean("privacyPersonalizationEnabled", true));
  const [privacyShareProgress, setPrivacyShareProgress] = useState(() => readStoredBoolean("privacyShareProgress", false));
  const [emailUpdates, setEmailUpdates] = useState(() => readStoredBoolean("emailUpdates", true));
  const [weeklyReport, setWeeklyReport] = useState(() => readStoredBoolean("weeklyReport", true));
  const [dailyLimit, setDailyLimit] = useState(() => readStoredNumber("dailyLimit", 4));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isClearingAccountData, setIsClearingAccountData] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel>("personalize");
  const [settingsSearch, setSettingsSearch] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderLeadHours,
    setReminderLeadHours,
    permission,
    requestPermission,
  } = useNotification();

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getUser().then(async ({ data }) => {
      const authUser = data?.user ?? null;
      setUser(authUser ? { id: authUser.id, email: authUser.email ?? undefined } : null);

      if (!authUser?.id) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_study_limit")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile?.daily_study_limit !== undefined && profile?.daily_study_limit !== null) {
        const normalized = Math.min(12, Math.max(1, Number(profile.daily_study_limit) || 4));
        setDailyLimit(normalized);
        localStorage.setItem("dailyLimit", String(normalized));
      }
    });
  }, []);

  useEffect(() => {
    const panelParam = searchParams.get("panel");
    const validPanels: SettingsPanel[] = ["schedule", "personalize", "reminders", "account", "support"];
    if (panelParam && validPanels.includes(panelParam as SettingsPanel)) {
      setActivePanel(panelParam as SettingsPanel);
    }
  }, [searchParams]);

  const [savedSettings, setSavedSettings] = useState({
    theme: theme as Theme,
    colorTheme: colorTheme as ColorTheme,
    notifications: notificationsEnabled,
    privacyProfileVisible,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyShareProgress,
    emailUpdates,
    weeklyReport,
    reminderLeadHours,
  });

  const handleThemeChange = (newTheme: Theme) => setTheme(newTheme);
  const handleColorThemeChange = (newColorTheme: ColorTheme) => setColorTheme(newColorTheme);

  const handleNotificationChange = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  const handleDailyLimitChange = (value: number) => {
    const normalized = Math.min(12, Math.max(1, value));
    setDailyLimit(normalized);
    localStorage.setItem("dailyLimit", String(normalized));

    if (user?.id) {
      void supabase
        .from("profiles")
        .upsert({ id: user.id, daily_study_limit: normalized }, { onConflict: "id" });
    }
  };

  const handleEmailUpdatesChange = (value: boolean) => {
    setEmailUpdates(value);
    localStorage.setItem("emailUpdates", String(value));
  };

  const handleWeeklyReportChange = (value: boolean) => {
    setWeeklyReport(value);
    localStorage.setItem("weeklyReport", String(value));
  };

  const handlePrivacyProfileVisibleChange = (value: boolean) => {
    setPrivacyProfileVisible(value);
    localStorage.setItem("privacyProfileVisible", String(value));
  };

  const handlePrivacyAnalyticsChange = (value: boolean) => {
    setPrivacyAnalyticsEnabled(value);
    localStorage.setItem("privacyAnalyticsEnabled", String(value));
  };

  const handlePrivacyPersonalizationChange = (value: boolean) => {
    setPrivacyPersonalizationEnabled(value);
    localStorage.setItem("privacyPersonalizationEnabled", String(value));
  };

  const handlePrivacyShareProgressChange = (value: boolean) => {
    setPrivacyShareProgress(value);
    localStorage.setItem("privacyShareProgress", String(value));
  };

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

  const handleExportScheduleAsPdf = () => {
    setActionMessage(null);
    setIsExportingPdf(true);
    const scheduleWindow = window.open("/schedule", "_blank");
    if (!scheduleWindow) {
      setActionMessage({ type: "error", text: "Please allow pop-ups to export schedule as PDF." });
      setIsExportingPdf(false);
      return;
    }

    // Trigger browser print to save schedule page as PDF.
    setTimeout(() => {
      scheduleWindow.focus();
      scheduleWindow.print();
      setActionMessage({ type: "success", text: "Schedule opened in a new tab. Use your browser print dialog to save as PDF." });
      setIsExportingPdf(false);
    }, 1200);
  };

  const handleClearAccountData = () => {
    setActionMessage(null);
    void (async () => {
      const confirmed = window.confirm(
        "Clear your account data? This will remove your courses, assignments, tasks, schedule blocks, and saved planner preferences."
      );
      if (!confirmed) return;

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
          "notifiedDeadlines",
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
        handleDailyLimitChange(4);
        setNotificationsEnabled(true);
        setSoundEnabled(true);
        handleEmailUpdatesChange(true);
        handleWeeklyReportChange(true);
        setReminderLeadHours(24);
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
    })();
  };

  const handleDeleteAccount = async () => {
    setActionMessage(null);
    if (!user?.id) {
      setActionMessage({ type: "error", text: "Please sign in to delete your account." });
      return;
    }

    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your tasks, schedule, courses, and profile data."
    );
    if (!confirmed) return;

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
  };

  const hasChanges = useMemo(() => {
    return (
      theme !== savedSettings.theme ||
      colorTheme !== savedSettings.colorTheme ||
      notificationsEnabled !== savedSettings.notifications ||
      privacyProfileVisible !== savedSettings.privacyProfileVisible ||
      privacyAnalyticsEnabled !== savedSettings.privacyAnalyticsEnabled ||
      privacyPersonalizationEnabled !== savedSettings.privacyPersonalizationEnabled ||
      privacyShareProgress !== savedSettings.privacyShareProgress ||
      emailUpdates !== savedSettings.emailUpdates ||
      weeklyReport !== savedSettings.weeklyReport ||
      reminderLeadHours !== savedSettings.reminderLeadHours
    );
  }, [
    theme,
    colorTheme,
    notificationsEnabled,
    privacyProfileVisible,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyShareProgress,
    emailUpdates,
    weeklyReport,
    reminderLeadHours,
    savedSettings,
  ]);

  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      setSavedSettings({
        theme: theme as Theme,
        colorTheme: colorTheme as ColorTheme,
        notifications: notificationsEnabled,
        privacyProfileVisible,
        privacyAnalyticsEnabled,
        privacyPersonalizationEnabled,
        privacyShareProgress,
        emailUpdates,
        weeklyReport,
        reminderLeadHours,
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
    privacyProfileVisible,
    privacyAnalyticsEnabled,
    privacyPersonalizationEnabled,
    privacyShareProgress,
    emailUpdates,
    weeklyReport,
    reminderLeadHours,
  ]);

  const permissionLabel = useMemo(() => {
    if (permission === "granted") return "Notifications enabled in your browser";
    if (permission === "denied") return "Blocked by your browser";
    if (permission === "unsupported") return "Not supported in this browser";
    return "Not enabled yet";
  }, [permission]);

  const permissionButtonLabel = useMemo(
    () => (permission === "granted" ? "Enabled" : "Enable"),
    [permission]
  );

  const permissionButtonClass = useMemo(() => {
    return permission === "granted"
      ? "text-white"
      : "bg-slate-200 text-slate-700 hover:bg-slate-300";
  }, [permission]);

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

  const handleResetDefaults = () => {
    switch (activePanel) {
      case "personalize":
        handleThemeChange("light");
        handleColorThemeChange("emerald");
        break;
      case "schedule":
        handleDailyLimitChange(4);
        break;
      case "reminders":
        setNotificationsEnabled(true);
        setSoundEnabled(true);
        handleEmailUpdatesChange(true);
        handleWeeklyReportChange(true);
        setReminderLeadHours(24);
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
        id: "schedule",
        label: "Schedule Setup",
        icon: "event",
        keywords: ["schedule", "study", "limit", "hours", "daily"],
      },
      {
        id: "personalize",
        label: "Personalize",
        icon: "palette",
        keywords: ["theme", "color", "accent", "appearance", "dark", "light"],
      },
      {
        id: "reminders",
        label: "Reminders",
        icon: "notifications",
        keywords: ["reminder", "notification", "email", "weekly", "report", "alerts", "sound"],
      },
      {
        id: "account",
        label: "Account",
        icon: "person",
        keywords: ["account", "privacy", "security", "password", "export", "delete"],
      },
      {
        id: "support",
        label: "Support",
        icon: "support_agent",
        keywords: ["support", "help", "contact", "faq"],
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

  return (
    <div className="min-h-screen relative">
      <style>{sliderStyles}</style>
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
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-100">settings</span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
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

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 px-4 py-3">
                <div
                  className="w-11 h-11 rounded-full border flex items-center justify-center text-lg font-bold"
                  style={accentSoftStyle}
                >
                  {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{user?.email || "User"}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">Customize your 11Planner experience</div>
                </div>
              </div>

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

              {activePanel === "schedule" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Schedule Setup</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Tune planning density and pace.</p>

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Daily Study Limit</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={dailyLimit}
                      onChange={(e) => handleDailyLimitChange(parseInt(e.target.value, 10))}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700"
                    />
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={dailyLimit}
                      onChange={(e) => handleDailyLimitChange(parseInt(e.target.value, 10) || 1)}
                      className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-right text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">hours</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Cap schedule generation per day
                  </div>
                </section>
              )}

              {activePanel === "reminders" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Reminders</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Control reminder channels and timing.</p>

                  <div className="mb-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 p-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Delivery channels</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      Browser + email + weekly summary can be combined for better deadline coverage.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Receive alerts about upcoming deadlines</p>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(!notificationsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notificationsEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={notificationsEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Notification Sound</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Play a sound with reminders</p>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${soundEnabled ? "" : "bg-slate-300 dark:bg-slate-600"}`}
                        style={soundEnabled ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${soundEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Browser Permission</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{isMounted ? permissionLabel : "Loading..."}</p>
                      </div>
                      <button
                        onClick={requestPermission}
                        disabled={!isMounted || permission === "denied" || permission === "unsupported"}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${permissionButtonClass}`}
                        style={isMounted && permission === "granted" ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        {isMounted ? permissionButtonLabel : "Enable"}
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
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        How far in advance to remind about deadlines
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Email Updates</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Get email reminders for important tasks</p>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">Receive a summary of your weekly progress</p>
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

              {activePanel === "support" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Support</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Need help? Reach support resources quickly.</p>
                  <Link href="/support" className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100"><span className="material-symbols-outlined text-base">support_agent</span>Open Support Page</span>
                    <span className="material-symbols-outlined text-base text-slate-400">chevron_right</span>
                  </Link>
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
