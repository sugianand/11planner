"use client";

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification } from "@/contexts/NotificationContext";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

type Theme = "light" | "dark" | "auto";
type ColorTheme = "emerald" | "ocean" | "rose" | "slate" | "amber" | "violet";

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

export default function SettingsPage() {
  const { theme, setTheme, colorTheme, setColorTheme, colorThemes } = useTheme();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => readStoredBoolean("soundEnabled", true));
  const [privacyProfileVisible, setPrivacyProfileVisible] = useState(() => readStoredBoolean("privacyProfileVisible", true));
  const [privacyAnalyticsEnabled, setPrivacyAnalyticsEnabled] = useState(() => readStoredBoolean("privacyAnalyticsEnabled", false));
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(() => readStoredBoolean("privacyPersonalizationEnabled", true));
  const [privacyShareProgress, setPrivacyShareProgress] = useState(() => readStoredBoolean("privacyShareProgress", false));
  const [emailUpdates, setEmailUpdates] = useState(() => readStoredBoolean("emailUpdates", true));
  const [weeklyReport, setWeeklyReport] = useState(() => readStoredBoolean("weeklyReport", true));
  const [dailyLimit, setDailyLimit] = useState(4);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"appearance" | "productivity" | "notifications" | "account">("appearance");

  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderLeadHours,
    setReminderLeadHours,
    permission,
    requestPermission,
  } = useNotification();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

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
    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        alert(`Error: Could not get user. ${userError.message}`);
        return;
      }

      if (!authUser?.email) {
        alert("Could not retrieve your email address. Please log out and log back in.");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      alert("Password reset email sent! Check your inbox for the reset link.");
    } catch {
      alert("Failed to send reset email. Check the browser console for details.");
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
      case "appearance":
        handleThemeChange("light");
        handleColorThemeChange("emerald");
        break;
      case "productivity":
        handleDailyLimitChange(4);
        break;
      case "notifications":
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

  const navItems: Array<{ id: "appearance" | "productivity" | "notifications" | "account"; label: string; icon: string }> = [
    { id: "appearance", label: "Appearance", icon: "palette" },
    { id: "productivity", label: "Productivity", icon: "target" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
    { id: "account", label: "Account", icon: "person" },
  ];

  const sectionCardClass =
    "rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/55 backdrop-blur-md p-5 md:p-6";

  return (
    <div className="min-h-screen relative">
      <style>{sliderStyles}</style>
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_30px_70px_-35px_rgba(15,23,42,0.6)] overflow-hidden">
          <div
            className="px-5 md:px-8 py-5 border-b border-slate-200/70 dark:border-slate-700/70 dark:from-slate-800/80 dark:via-slate-900/75 dark:to-slate-800/80"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--theme-accent-soft), rgba(255,255,255,0.72), rgba(125,211,252,0.32))",
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
                <span className="text-sm text-slate-500 dark:text-slate-300">Search Settings</span>
              </div>
              <nav className="space-y-1.5">
                {navItems.map((item) => (
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
              </nav>
            </aside>

            <main className="p-4 md:p-6 space-y-5 bg-gradient-to-b from-white/45 to-white/25 dark:from-slate-900/45 dark:to-slate-900/25">
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

              {activePanel === "productivity" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Productivity</div>
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

              {activePanel === "notifications" && (
                <section className={sectionCardClass}>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">Notifications</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Control reminder channels and timing.</p>

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

                  <button onClick={handleChangePassword} className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition mb-4">
                    <p className="font-medium text-slate-900 dark:text-white">Change Password</p>
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

                  <button className="w-full text-left mt-4 px-4 py-3 rounded-xl border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                    <p className="font-medium text-red-700 dark:text-red-300">Delete Account</p>
                    <p className="text-xs text-red-400 dark:text-red-300">Permanently remove your account and data</p>
                  </button>
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
