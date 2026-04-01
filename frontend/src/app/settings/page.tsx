"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification } from "@/contexts/NotificationContext";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

type Theme = "light" | "dark" | "auto";
type ColorTheme = "emerald" | "ocean" | "rose" | "slate" | "amber" | "violet" | "mint";

const colorThemeSwatches: Record<ColorTheme, string> = {
  emerald: "linear-gradient(135deg, #10b981, #059669)",
  ocean: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  rose: "linear-gradient(135deg, #f43f5e, #e11d48)",
  slate: "linear-gradient(135deg, #64748b, #475569)",
  amber: "linear-gradient(135deg, #f59e0b, #d97706)",
  violet: "linear-gradient(135deg, #a78bfa, #7c3aed)",
  mint: "linear-gradient(135deg, #5eead4, #14b8a6)",
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
  return Number.isNaN(value) ? fallback : value;
};

export default function SettingsPage() {
  const { theme, setTheme, colorTheme, setColorTheme, colorThemes } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(4);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    setEmailUpdates(readStoredBoolean("emailUpdates", true));
    setWeeklyReport(readStoredBoolean("weeklyReport", true));
    setDailyLimit(readStoredNumber("dailyLimit", 4));
  }, []);

  const [savedSettings, setSavedSettings] = useState({
    theme: theme as Theme,
    colorTheme: colorTheme as ColorTheme,
    notifications: notificationsEnabled,
    emailUpdates,
    weeklyReport,
    dailyLimit,
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

  const handleExport = () => alert("Exported data!");
  const handleImport = () => alert("Import dialog!");

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
      emailUpdates !== savedSettings.emailUpdates ||
      weeklyReport !== savedSettings.weeklyReport ||
      dailyLimit !== savedSettings.dailyLimit ||
      reminderLeadHours !== savedSettings.reminderLeadHours
    );
  }, [
    theme,
    colorTheme,
    notificationsEnabled,
    emailUpdates,
    weeklyReport,
    dailyLimit,
    reminderLeadHours,
    savedSettings,
  ]);

  const isDailyLimitDirty = useMemo(
    () => dailyLimit !== savedSettings.dailyLimit,
    [dailyLimit, savedSettings.dailyLimit]
  );

  const isReminderDirty = useMemo(
    () => reminderLeadHours !== savedSettings.reminderLeadHours,
    [reminderLeadHours, savedSettings.reminderLeadHours]
  );

  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      setSavedSettings({
        theme: theme as Theme,
        colorTheme: colorTheme as ColorTheme,
        notifications: notificationsEnabled,
        emailUpdates,
        weeklyReport,
        dailyLimit,
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
    emailUpdates,
    weeklyReport,
    dailyLimit,
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
    if (!isMounted) {
      return "bg-slate-200 text-slate-700";
    }
    return permission === "granted"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-200 text-slate-700 hover:bg-slate-300";
  }, [isMounted, permission]);

  const handleResetDefaults = () => {
    handleThemeChange("light");
    handleColorThemeChange("emerald");
    setNotificationsEnabled(true);
    handleEmailUpdatesChange(true);
    handleWeeklyReportChange(true);
    handleDailyLimitChange(4);
    setReminderLeadHours(24);
  };

  return (
    <div className="min-h-screen relative">
      <style>{sliderStyles}</style>
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="p-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-4 px-6 pt-7 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/80 dark:from-slate-800/80 to-transparent">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-emerald-600 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-700 shadow">
                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="font-semibold text-lg text-slate-900 dark:text-white">{user?.email || "User"}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Account Settings</div>
              </div>
            </div>

            <div className="px-6 pt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">Customize your 11Planner experience</p>
            </div>

            <section className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">
              <div className="font-semibold text-lg text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">palette</span>
                Appearance & Theme
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="theme" value="light" checked={theme === "light"} onChange={() => handleThemeChange("light")} className="w-4 h-4 accent-emerald-600" />
                  <span className="ml-2 text-slate-900 dark:text-white">Light</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="theme" value="dark" checked={theme === "dark"} onChange={() => handleThemeChange("dark")} className="w-4 h-4 accent-emerald-600" />
                  <span className="ml-2 text-slate-900 dark:text-white">Dark</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="theme" value="auto" checked={theme === "auto"} onChange={() => handleThemeChange("auto")} className="w-4 h-4 accent-emerald-600" />
                  <span className="ml-2 text-slate-900 dark:text-white">Auto</span>
                </label>
              </div>

              <div className="mt-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">Color Theme</p>
                <div className="flex flex-wrap gap-3">
                  {colorThemes.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleColorThemeChange(option as ColorTheme)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold capitalize transition ${
                        colorTheme === option
                          ? "border-slate-800 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow"
                          : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-white/60"
                        style={{ background: colorThemeSwatches[option as ColorTheme] }}
                      />
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <div className="font-semibold text-lg text-slate-900 dark:text-white">Productivity</div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Daily Study Limit (hours)</label>
              <div className="flex items-center gap-4">
                <input type="range" min="1" max="12" value={dailyLimit} onChange={(e) => handleDailyLimitChange(parseInt(e.target.value, 10))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <input type="number" min={1} max={12} value={dailyLimit} onChange={(e) => handleDailyLimitChange(parseInt(e.target.value, 10) || 1)} className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right text-slate-900 dark:text-white" />
                <span className="text-xs text-slate-500 dark:text-slate-400">hours</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-500 dark:text-slate-400">Cap schedule generation at this number of hours per day</p>
                <span className={isDailyLimitDirty ? "text-amber-600" : "text-emerald-600"}>{isDailyLimitDirty ? "Not saved" : "Saved"}</span>
              </div>
            </section>

            <section className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <div className="font-semibold text-lg text-slate-900 dark:text-white">Notifications</div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Receive alerts about upcoming deadlines</p>
                </div>
                <button onClick={() => handleNotificationChange(!notificationsEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notificationsEnabled ? "bg-emerald-600" : "bg-slate-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Notification Sound</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Play a sound when reminders arrive</p>
                </div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${soundEnabled ? "bg-emerald-600" : "bg-slate-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${soundEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Browser Permission</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{isMounted ? permissionLabel : "Loading..."}</p>
                </div>
                <button onClick={requestPermission} disabled={!isMounted || permission === "denied" || permission === "unsupported"} className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${permissionButtonClass}`}>
                  {isMounted ? permissionButtonLabel : "Enable"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Reminder lead time (hours)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="168" value={reminderLeadHours} onChange={(e) => setReminderLeadHours(Math.min(168, Math.max(1, parseInt(e.target.value, 10) || 1)))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  <input type="number" min={1} max={168} value={reminderLeadHours} onChange={(e) => setReminderLeadHours(Math.min(168, Math.max(1, parseInt(e.target.value, 10) || 1)))} className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right text-slate-900 dark:text-white" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">hours</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <p className="text-slate-500 dark:text-slate-400">How far in advance to remind you about deadlines</p>
                  <span className={isReminderDirty ? "text-amber-600" : "text-emerald-600"}>{isReminderDirty ? "Not saved" : "Saved"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Email Updates</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Get email reminders for important tasks</p>
                </div>
                <button onClick={() => handleEmailUpdatesChange(!emailUpdates)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${emailUpdates ? "bg-emerald-600" : "bg-slate-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailUpdates ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Weekly Report</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Receive a summary of your weekly progress</p>
                </div>
                <button onClick={() => handleWeeklyReportChange(!weeklyReport)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${weeklyReport ? "bg-emerald-600" : "bg-slate-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${weeklyReport ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </section>

            <section className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="font-semibold text-lg text-slate-900 dark:text-white">Account</div>
              <button onClick={handleChangePassword} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition">
                <p className="font-medium text-slate-900 dark:text-white">Change Password</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Update your login password</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition">
                <p className="font-medium text-slate-900 dark:text-white">Privacy & Security</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Manage your privacy settings</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition">
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-xs text-red-600">Permanently delete your account</p>
              </button>
            </section>

            <section className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">
              <div className="font-semibold text-lg text-slate-900 dark:text-white mb-3">Data</div>
              <div className="flex items-center gap-4">
                <button onClick={handleExport} className="font-medium text-emerald-700 dark:text-emerald-300 hover:underline">Export Data</button>
                <button onClick={handleImport} className="font-medium text-emerald-700 dark:text-emerald-300 hover:underline">Import Data</button>
              </div>
            </section>

            <section className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 text-sm">
              <Link href="/support" className="text-emerald-700 dark:text-emerald-300 hover:underline">Support</Link>
              <Link href="/about" className="text-emerald-700 dark:text-emerald-300 hover:underline">About</Link>
            </section>

            <div className="sticky bottom-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-700/40 px-6 py-3 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-700 dark:text-slate-200">
                {hasChanges ? "Saving..." : "All changes saved"}
                {lastSavedAt && <span className="ml-2">Last saved at {lastSavedAt}</span>}
              </span>
              <button onClick={handleResetDefaults} className="bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 px-5 rounded-lg transition">
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
