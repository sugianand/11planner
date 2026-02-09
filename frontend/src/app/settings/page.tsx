"use client";

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification } from "@/contexts/NotificationContext";

type Theme = "light" | "dark" | "auto";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(4);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [savedSettings, setSavedSettings] = useState({
    theme: "light" as Theme,
    notifications: true,
    emailUpdates: true,
    weeklyReport: true,
    dailyLimit: 4,
    reminderLeadHours: 24,
  });
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

    const savedNotifications = localStorage.getItem("notifications") !== "false";
    const savedEmailUpdates = localStorage.getItem("emailUpdates") !== "false";
    const savedWeeklyReport = localStorage.getItem("weeklyReport") !== "false";
    const savedDailyLimit = parseInt(localStorage.getItem("dailyLimit") || "4");

    setNotificationsEnabled(savedNotifications);
    setEmailUpdates(savedEmailUpdates);
    setWeeklyReport(savedWeeklyReport);
    setDailyLimit(savedDailyLimit);

    setSavedSettings({
      theme: theme as Theme,
      notifications: savedNotifications,
      emailUpdates: savedEmailUpdates,
      weeklyReport: savedWeeklyReport,
      dailyLimit: savedDailyLimit,
      reminderLeadHours,
    });
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleNotificationChange = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  const handleEmailUpdatesChange = (value: boolean) => {
    setEmailUpdates(value);
    localStorage.setItem("emailUpdates", String(value));
  };

  const handleWeeklyReportChange = (value: boolean) => {
    setWeeklyReport(value);
    localStorage.setItem("weeklyReport", String(value));
  };

  const handleDailyLimitChange = (value: number) => {
    setDailyLimit(value);
    localStorage.setItem("dailyLimit", String(value));
  };

  const hasChanges = useMemo(() => {
    return (
      theme !== savedSettings.theme ||
      notificationsEnabled !== savedSettings.notifications ||
      emailUpdates !== savedSettings.emailUpdates ||
      weeklyReport !== savedSettings.weeklyReport ||
      dailyLimit !== savedSettings.dailyLimit ||
      reminderLeadHours !== savedSettings.reminderLeadHours
    );
  }, [
    theme,
    notificationsEnabled,
    emailUpdates,
    weeklyReport,
    dailyLimit,
    reminderLeadHours,
    savedSettings,
  ]);

  const isDailyLimitDirty = useMemo(() => {
    return dailyLimit !== savedSettings.dailyLimit;
  }, [dailyLimit, savedSettings.dailyLimit]);

  const isReminderDirty = useMemo(() => {
    return reminderLeadHours !== savedSettings.reminderLeadHours;
  }, [reminderLeadHours, savedSettings.reminderLeadHours]);

  useEffect(() => {
    if (!isMounted || !hasChanges) {
      return;
    }
    const timer = setTimeout(() => {
      setSavedSettings({
        theme: theme as Theme,
        notifications: notificationsEnabled,
        emailUpdates,
        weeklyReport,
        dailyLimit,
        reminderLeadHours,
      });
      setLastSavedAt(new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isMounted,
    hasChanges,
    theme,
    notificationsEnabled,
    emailUpdates,
    weeklyReport,
    dailyLimit,
    reminderLeadHours,
  ]);

  const permissionLabel = useMemo(() => {
    if (!isMounted) {
      return "Checking browser permission...";
    }
    if (permission === "granted") {
      return "Notifications enabled in your browser";
    }
    if (permission === "denied") {
      return "Blocked by your browser";
    }
    if (permission === "unsupported") {
      return "Not supported in this browser";
    }
    return "Not enabled yet";
  }, [isMounted, permission]);

  const permissionButtonLabel = useMemo(() => {
    if (!isMounted) {
      return "Checking...";
    }
    return permission === "granted" ? "Enabled" : "Enable";
  }, [isMounted, permission]);

  const handleResetDefaults = () => {
    handleThemeChange("light");
    setNotificationsEnabled(true);
    handleEmailUpdatesChange(true);
    handleWeeklyReportChange(true);
    handleDailyLimitChange(4);
    setReminderLeadHours(24);
  };

  const handleChangePassword = () => {
    window.alert("Password change will be available soon.");
  };

  const handlePrivacySecurity = () => {
    window.alert("Privacy & security settings will be available soon.");
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "This is a placeholder action. Account deletion is not enabled yet."
    );
    if (confirmed) {
      window.alert("Account deletion will be available soon.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 p-6 lg:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-emerald-200/40 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.2),transparent_55%)]" />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">Customize your 11Planner experience</p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 mb-6 border border-white/40 dark:border-slate-700/40">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Appearance</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                Theme
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === "light"}
                    onChange={(e) => handleThemeChange(e.target.value as Theme)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 text-slate-900 dark:text-white">Light</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === "dark"}
                    onChange={(e) => handleThemeChange(e.target.value as Theme)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 text-slate-900 dark:text-white">Dark</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="auto"
                    checked={theme === "auto"}
                    onChange={(e) => handleThemeChange(e.target.value as Theme)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 text-slate-900 dark:text-white">Auto</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/40 dark:border-slate-700/40">
              <p className="text-sm text-slate-600 dark:text-slate-200">
                Current theme: <span className="font-semibold text-slate-900 dark:text-white">{theme}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 mb-6 border border-white/40 dark:border-slate-700/40">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Productivity</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Daily Study Limit (hours)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={dailyLimit}
                  onChange={(e) => handleDailyLimitChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200/80 dark:bg-slate-700/70 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={dailyLimit}
                    onChange={(e) =>
                      handleDailyLimitChange(
                        Math.min(12, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-20 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/80 px-2 py-1 text-right text-slate-900 dark:text-white"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">hours</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Cap schedule generation at this number of hours per day
                </p>
                <span className={isDailyLimitDirty ? "text-amber-600" : "text-emerald-600"}>
                  {isDailyLimitDirty ? "Not saved" : "Saved"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 mb-6 border border-white/40 dark:border-slate-700/40">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Receive alerts about upcoming deadlines
                </p>
              </div>
                <button
                  onClick={() => handleNotificationChange(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    notificationsEnabled ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Browser Permission</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {permissionLabel}
                  </p>
                </div>
                <button
                  onClick={requestPermission}
                  disabled={!isMounted || permission === "denied" || permission === "unsupported"}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isMounted && permission === "granted"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white/70 text-slate-700 hover:bg-white border border-slate-200/80"
                  }`}
                >
                  {permissionButtonLabel}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Reminder lead time (hours)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="168"
                  value={reminderLeadHours}
                  onChange={(e) => setReminderLeadHours(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200/80 dark:bg-slate-700/70 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={reminderLeadHours}
                    onChange={(e) =>
                      setReminderLeadHours(
                        Math.min(168, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-20 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/80 px-2 py-1 text-right text-slate-900 dark:text-white"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">hours</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  How far in advance to remind you about deadlines
                </p>
                <span className={isReminderDirty ? "text-amber-600" : "text-emerald-600"}>
                  {isReminderDirty ? "Not saved" : "Saved"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Email Updates</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Get email reminders for important tasks
                  </p>
                </div>
                <button
                  onClick={() => handleEmailUpdatesChange(!emailUpdates)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    emailUpdates ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      emailUpdates ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Weekly Report</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Receive a summary of your weekly progress
                  </p>
                </div>
                <button
                  onClick={() => handleWeeklyReportChange(!weeklyReport)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    weeklyReport ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      weeklyReport ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 mb-6 border border-white/40 dark:border-slate-700/40">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account</h2>

          <div className="space-y-4">
            <button
              onClick={handleChangePassword}
              className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-white/40 dark:border-slate-700/40 transition"
            >
              <p className="font-medium text-slate-900 dark:text-white">Change Password</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Update your login password</p>
            </button>

            <button
              onClick={handlePrivacySecurity}
              className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-white/40 dark:border-slate-700/40 transition"
            >
              <p className="font-medium text-slate-900 dark:text-white">Privacy & Security</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Manage your privacy settings</p>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full text-left px-4 py-3 rounded-2xl hover:bg-rose-50/80 dark:hover:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/60 transition"
            >
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account</p>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
            <span>{hasChanges ? "Saving..." : "All changes saved"}</span>
            {lastSavedAt && <span>Last saved at {lastSavedAt}</span>}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Changes are saved automatically as you update settings.
          </p>
        </div>
        <div className="flex gap-3 mt-3">
          <button
            onClick={handleResetDefaults}
            className="bg-white/70 dark:bg-slate-800/70 hover:bg-white text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-xl transition flex-1 border border-slate-200/80 dark:border-slate-700/80"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
