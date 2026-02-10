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

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>


      <div className="p-6">
        <div className="max-w-3xl mx-auto">

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-sm border border-white/40 dark:border-slate-700/40">
            <div className="mb-8 border-b border-slate-200 dark:border-slate-700/50 pb-6">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">Customize your 11Planner experience</p>
            </div>

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

              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-200">
                  Current theme: <span className="font-semibold text-slate-900 dark:text-white">{theme}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-sm border border-white/40 dark:border-slate-700/40">
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
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
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
                      className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right text-slate-900 dark:text-white"
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

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-sm border border-white/40 dark:border-slate-700/40">
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notificationsEnabled ? "bg-blue-600" : "bg-slate-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationsEnabled ? "translate-x-6" : "translate-x-1"
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
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isMounted && permission === "granted"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
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
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
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
                      className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right text-slate-900 dark:text-white"
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${emailUpdates ? "bg-blue-600" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailUpdates ? "translate-x-6" : "translate-x-1"
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${weeklyReport ? "bg-blue-600" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${weeklyReport ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-sm border border-white/40 dark:border-slate-700/40">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account</h2>

            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition">
                <p className="font-medium text-slate-900 dark:text-white">Change Password</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Update your login password</p>
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition">
                <p className="font-medium text-slate-900 dark:text-white">Privacy & Security</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Manage your privacy settings</p>
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition">
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-red-600">Permanently delete your account</p>
              </button>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-sm border border-white/40 dark:border-slate-700/40">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                <span>{hasChanges ? "Saving..." : "All changes saved"}</span>
                {lastSavedAt && <span>Last saved at {lastSavedAt}</span>}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Changes are saved automatically as you update settings.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleResetDefaults}
              className="bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-3 px-6 rounded-lg transition flex-1"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
