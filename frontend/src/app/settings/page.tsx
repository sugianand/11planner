"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type Theme = "light" | "dark" | "auto";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(4);

  useEffect(() => {
    // Load saved preferences
    const savedNotifications = localStorage.getItem("notifications") !== "false";
    const savedEmailUpdates = localStorage.getItem("emailUpdates") !== "false";
    const savedWeeklyReport = localStorage.getItem("weeklyReport") !== "false";
    const savedDailyLimit = parseInt(localStorage.getItem("dailyLimit") || "4");

    setNotifications(savedNotifications);
    setEmailUpdates(savedEmailUpdates);
    setWeeklyReport(savedWeeklyReport);
    setDailyLimit(savedDailyLimit);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleNotificationChange = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem("notifications", String(value));
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

  const handleSaveSettings = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Customize your 11Planner experience</p>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Appearance</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
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
                  <span className="ml-3 text-slate-900 dark:text-slate-100">Light</span>
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
                  <span className="ml-3 text-slate-900 dark:text-slate-100">Dark</span>
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
                  <span className="ml-3 text-slate-900 dark:text-slate-100">Auto</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Current theme: <span className="font-semibold text-slate-900 dark:text-white">{theme}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Productivity Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Productivity</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Daily Study Limit (hours)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={dailyLimit}
                  onChange={(e) => handleDailyLimitChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 w-12 text-right">
                  {dailyLimit}h
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Maximum hours of study recommended per day
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Receive alerts about upcoming deadlines
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  notifications ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Email Updates</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get email reminders for important tasks
                  </p>
                </div>
                <button
                  onClick={() => handleEmailUpdatesChange(!emailUpdates)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    emailUpdates ? "bg-blue-600" : "bg-slate-300"
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Receive a summary of your weekly progress
                  </p>
                </div>
                <button
                  onClick={() => handleWeeklyReportChange(!weeklyReport)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    weeklyReport ? "bg-blue-600" : "bg-slate-300"
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

        {/* Account Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account</h2>

          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition">
              <p className="font-medium text-slate-900 dark:text-white">Change Password</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Update your login password</p>
            </button>

            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition">
              <p className="font-medium text-slate-900 dark:text-white">Privacy & Security</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Manage your privacy settings</p>
            </button>

            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition">
              <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account</p>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition flex-1"
          >
            Save Settings
          </button>
          <button className="bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition flex-1">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
