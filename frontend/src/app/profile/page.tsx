"use client";

import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";


type ProfileData = {
  firstname: string;
  lastname: string;
};

// Formats a date into a stable YYYY-MM-DD key for streak/grouping logic.
function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Rebuilds a Date object from a YYYY-MM-DD key.
function getDateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

// Shifts a YYYY-MM-DD key forward/backward by a number of days.
function shiftDateKey(key: string, days: number): string {
  const date = getDateFromKey(key);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}


export default function ProfilePage() {
  const { tasks, courses, preferences, loadPreferences } = usePlanner();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(true);
  const [privacyInsightsHistoryEnabled, setPrivacyInsightsHistoryEnabled] = useState(true);
  const [privacyAnalyticsEnabled, setPrivacyAnalyticsEnabled] = useState(false);
  const [insightsHistoryStartDate, setInsightsHistoryStartDate] = useState<Date | null>(null);
  const [taskCompletionTimestamps, setTaskCompletionTimestamps] = useState<Record<string, string>>({});
  const [animatedCompletionRate, setAnimatedCompletionRate] = useState(0);
  const animatedCompletionRateRef = useRef(0);

  // Loads user identity and profile names, with optional guest fallback clearing.
  const syncProfile = useCallback(async (allowClearOnMissingUser: boolean) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (allowClearOnMissingUser) {
        setUserId(null);
        setEmail(null);
        setProfile(null);
      }
      return;
    }

    setUserId(user.id);
    setEmail(user.email ?? null);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("firstname, lastname")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return;
    }

    setProfile(profileData);
    setFirstNameInput(profileData.firstname || "");
    setLastNameInput(profileData.lastname || "");
  }, []);

  useEffect(() => {
    // Hydrates privacy flags from local storage after the client mounts.
    if (typeof window === "undefined") {
      return;
    }
    setPrivacyPersonalizationEnabled(localStorage.getItem("privacyPersonalizationEnabled") !== "false");
    setPrivacyInsightsHistoryEnabled(localStorage.getItem("privacyInsightsHistoryEnabled") !== "false");
    setPrivacyAnalyticsEnabled(localStorage.getItem("privacyAnalyticsEnabled") === "true");

    const cutoffRaw = localStorage.getItem("learningInsightsHistoryStartDate");
    if (!cutoffRaw) {
      setInsightsHistoryStartDate(null);
      return;
    }

    const cutoffDate = new Date(cutoffRaw);
    setInsightsHistoryStartDate(Number.isNaN(cutoffDate.getTime()) ? null : cutoffDate);

    try {
      const completionTimesRaw = localStorage.getItem("taskCompletionTimestamps");
      const parsed = completionTimesRaw ? JSON.parse(completionTimesRaw) : {};
      setTaskCompletionTimestamps(parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {});
    } catch {
      setTaskCompletionTimestamps({});
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Wraps profile sync to prevent stale updates after unmount.
    const safeSync = async (allowClearOnMissingUser: boolean) => {
      try {
        await syncProfile(allowClearOnMissingUser);
      } catch {
        if (allowClearOnMissingUser && isMounted) {
          setUserId(null);
          setEmail(null);
          setProfile(null);
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
        setUserId(null);
        setEmail(null);
        setProfile(null);
        return;
      }

      if (session?.user?.id || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void safeSync(false);
      }
    });

    // Re-syncs profile when the tab regains visibility or focus.
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
  }, [syncProfile]);

  // Saves edited first/last name into the user's profile row.
  const handleSaveName = async () => {
    if (!userId) {
      setNameError("Please sign in to edit your profile name.");
      setNameFeedback(null);
      return;
    }

    const first = firstNameInput.trim();
    const last = lastNameInput.trim();

    if (!first || !last) {
      setNameError("First and last name are required.");
      setNameFeedback(null);
      return;
    }

    try {
      setIsSavingName(true);
      setNameError(null);
      setNameFeedback(null);

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            firstname: first,
            lastname: last,
          },
          { onConflict: "id" }
        )
        .select("firstname, lastname")
        .single();

      if (error) throw error;

      setProfile({
        firstname: data.firstname || first,
        lastname: data.lastname || last,
      });
      setFirstNameInput(data.firstname || first);
      setLastNameInput(data.lastname || last);
      setIsEditingName(false);
      setNameFeedback("Name updated.");
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setIsSavingName(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Filters tasks to the insight window used for charts and streaks.
  const analyticsTasks = useMemo(() => {
    if (!privacyInsightsHistoryEnabled) {
      return [] as typeof tasks;
    }

    return tasks;
  }, [tasks, privacyInsightsHistoryEnabled]);

  // Keeps only completed tasks that belong to the current insights timeline.
  const completedInsightTasks = useMemo(() => {
    return analyticsTasks.filter((task) => {
      if (!task.completed) {
        return false;
      }

      if (!insightsHistoryStartDate) {
        return true;
      }

      const completedAtRaw = taskCompletionTimestamps[task.id];
      if (!completedAtRaw) {
        return false;
      }

      const completedAt = new Date(completedAtRaw);
      if (Number.isNaN(completedAt.getTime())) {
        return false;
      }

      return completedAt >= insightsHistoryStartDate;
    });
  }, [analyticsTasks, insightsHistoryStartDate, taskCompletionTimestamps]);

  const completedTasks = completedInsightTasks.length;
  const totalTasks = tasks.length;
  const analyticsTotalTasks = analyticsTasks.length;
  const completionRate = analyticsTotalTasks === 0 ? 0 : Math.round((completedTasks / analyticsTotalTasks) * 100);
  const inProgressTasks = Math.max(0, analyticsTotalTasks - completedTasks);
  const hasTakenQuiz = Boolean(
    preferences?.worktime &&
    preferences?.workdays?.length &&
    preferences?.workstyle &&
    preferences?.assignmentplan
  );

  const fullName = profile ? `${profile.firstname} ${profile.lastname}` : "Guest User";
  const initials = `${profile?.firstname?.[0] ?? "G"}${profile?.lastname?.[0] ?? "U"}`.toUpperCase();

  const focusTier = privacyPersonalizationEnabled
    ? completionRate >= 80
      ? "Locked In"
      : completionRate >= 50
      ? "In The Zone"
      : completionRate >= 20
      ? "Building Momentum"
      : "Getting Started"
    : "General Progress";

  useEffect(() => {
    animatedCompletionRateRef.current = animatedCompletionRate;
  }, [animatedCompletionRate]);

  useEffect(() => {
    let animationFrame = 0;
    const start = performance.now();
    const duration = 750;
    const startValue = animatedCompletionRateRef.current;
    const delta = completionRate - startValue;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const nextValue = Math.round(startValue + delta * progress);
      animatedCompletionRateRef.current = nextValue;
      setAnimatedCompletionRate(nextValue);
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [completionRate]);

  // Builds the seven-day completion chart from the filtered completion history.
  const weeklyCompletionData = useMemo(() => {
    const countsByDay = new Map<string, number>();

    completedInsightTasks.forEach((task) => {
      const completedAtRaw = taskCompletionTimestamps[task.id];
      if (!completedAtRaw) return;
      const date = new Date(completedAtRaw);
      if (Number.isNaN(date.getTime())) return;
      const key = getLocalDateKey(date);
      countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
    });

    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = getLocalDateKey(date);
      return {
        key,
        shortLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: countsByDay.get(key) || 0,
      };
    });

    return days;
  }, [completedInsightTasks, taskCompletionTimestamps]);

  const maxDailyCompletion = useMemo(
    () => Math.max(1, ...weeklyCompletionData.map((day) => day.count)),
    [weeklyCompletionData]
  );

  // Computes streak metrics from the same reset-aware completion set.
  const { currentStreak, bestStreak } = useMemo(() => {
    const completedDateKeys = new Set<string>();

    completedInsightTasks.forEach((task) => {
      const completedAtRaw = taskCompletionTimestamps[task.id];
      if (!completedAtRaw) return;
      const date = new Date(completedAtRaw);
      if (Number.isNaN(date.getTime())) return;
      completedDateKeys.add(getLocalDateKey(date));
    });

    const sortedKeys = [...completedDateKeys].sort();
    let runningBest = 0;
    let run = 0;
    let previousKey = "";

    sortedKeys.forEach((key) => {
      if (!previousKey) {
        run = 1;
      } else {
        const nextExpected = shiftDateKey(previousKey, 1);
        run = nextExpected === key ? run + 1 : 1;
      }
      runningBest = Math.max(runningBest, run);
      previousKey = key;
    });

    const todayKey = getLocalDateKey(new Date());
    let runningCurrent = 0;
    if (completedDateKeys.has(todayKey)) {
      let cursor = todayKey;
      while (completedDateKeys.has(cursor)) {
        runningCurrent += 1;
        cursor = shiftDateKey(cursor, -1);
      }
    }

    return {
      currentStreak: runningCurrent,
      bestStreak: runningBest,
    };
  }, [completedInsightTasks, taskCompletionTimestamps]);

  // Logs an anonymous profile-view event when analytics sharing is enabled.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!privacyAnalyticsEnabled) {
      return;
    }

    try {
      const raw = localStorage.getItem("anonymousAnalyticsEvents");
      const parsed = raw ? JSON.parse(raw) : [];
      const events: Array<{ event: string; ts: string }> = Array.isArray(parsed) ? parsed : [];
      events.push({ event: "profile_page_view", ts: new Date().toISOString() });
      localStorage.setItem("anonymousAnalyticsEvents", JSON.stringify(events.slice(-100)));
    } catch {
      // Keep profile usable even if analytics storage is unavailable.
    }
  }, [privacyAnalyticsEnabled]);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-30" />

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-10 sm:p-6 sm:pb-12 lg:p-8 lg:pb-14">
        <section className="rounded-3xl border border-white/45 bg-white/50 p-5 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 dark:border-slate-700/55 dark:bg-slate-900/45 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
            <div
              className="card-reveal relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md motion-reduce:transition-none dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-8"
              style={{ animationDelay: "70ms" }}
            >
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/70 text-4xl font-black tracking-wide text-white shadow-[0_14px_35px_-16px_rgba(17,24,39,0.7)]"
                  style={{ backgroundColor: "var(--theme-accent-strong)" }}
                >
                  {initials}
                </div>
                <div className="space-y-1">
                  <p
                    className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                      borderColor: "var(--theme-accent)",
                      backgroundColor: "var(--theme-accent-soft)",
                      color: "var(--theme-accent-strong)",
                    }}
                  >
                    Focus Profile
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    {fullName}
                  </h1>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {email || "Signed out currently - login to sync profile details"}
                  </p>
                </div>
              </div>

              <div className="relative mt-6">
                <div className="flex flex-wrap items-center gap-3">
                  {!isEditingName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFirstNameInput(profile?.firstname || "");
                        setLastNameInput(profile?.lastname || "");
                        setNameError(null);
                        setNameFeedback(null);
                        setIsEditingName(true);
                      }}
                      className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200"
                      style={{ backgroundColor: "var(--theme-accent-strong)" }}
                    >
                      Edit Name
                    </button>
                  ) : null}
                </div>
                {isEditingName ? (
                  <>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={firstNameInput}
                        onChange={(e) => setFirstNameInput(e.target.value)}
                        placeholder="First name"
                        className="w-full rounded-xl border border-slate-300/80 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-2 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-white"
                        style={{
                          borderColor: "color-mix(in srgb, var(--theme-accent) 35%, rgba(148,163,184,0.8))",
                        }}
                      />
                      <input
                        type="text"
                        value={lastNameInput}
                        onChange={(e) => setLastNameInput(e.target.value)}
                        placeholder="Last name"
                        className="w-full rounded-xl border border-slate-300/80 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-2 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-white"
                        style={{
                          borderColor: "color-mix(in srgb, var(--theme-accent) 35%, rgba(148,163,184,0.8))",
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: "var(--theme-accent-strong)" }}
                      >
                        {isSavingName ? "Saving..." : "Save Name"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false);
                          setNameError(null);
                          setNameFeedback(null);
                        }}
                        disabled={isSavingName}
                        className="inline-flex items-center rounded-xl border border-slate-300/80 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {nameFeedback ? (
                    <p className="text-sm font-semibold" style={{ color: "var(--theme-accent-strong)" }}>{nameFeedback}</p>
                  ) : null}
                  {nameError ? (
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">{nameError}</p>
                  ) : null}
                </div>
              </div>

              <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/65 dark:bg-slate-800/55" style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, rgba(255,255,255,0.6))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Tasks</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{totalTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/65 dark:bg-slate-800/55" style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, rgba(255,255,255,0.6))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Completed</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{completedTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/65 dark:bg-slate-800/55" style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, rgba(255,255,255,0.6))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Courses</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{courses.length}</p>
                </div>
              </div>
            </div>

            <div
              className="card-reveal rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md motion-reduce:transition-none dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-7"
              style={{ animationDelay: "150ms" }}
            >
              {privacyInsightsHistoryEnabled ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Current Momentum</p>
                  <div className="mt-3 flex items-end gap-2">
                    <h2 className="text-4xl font-black leading-none text-slate-900 dark:text-white">{animatedCompletionRate}%</h2>
                    <span className="pb-1 text-sm font-semibold" style={{ color: "var(--theme-accent-strong)" }}>{focusTier}</span>
                  </div>

                  <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200/85 dark:bg-slate-700/60">
                    <div
                      className="h-3 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${completionRate}%`,
                        backgroundColor: "var(--theme-accent-strong)",
                      }}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/35">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Done</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{completedTasks}</p>
                    </div>
                    <div className="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/35">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Remaining</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{inProgressTasks}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--theme-accent)",
                    backgroundColor: "var(--theme-accent-soft)",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--theme-accent-strong)" }}>
                    Learning insights history is turned off. Trend and streak analytics are hidden.
                  </p>
                </div>
              )}

              <div
                className="mt-6 rounded-2xl border p-4"
                style={{
                  borderColor: "var(--theme-accent)",
                  backgroundColor: "var(--theme-accent-soft)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--theme-accent-strong)" }}>
                  {hasTakenQuiz
                    ? "Your preference profile is saved. Retake any time to recalibrate your planner behavior."
                    : "Take your preference quiz to personalize your schedule generation and task rhythm."}
                </p>
                <Link
                  href="/profile/quiz"
                  className="mt-4 inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ backgroundColor: "var(--theme-accent-strong)" }}
                >
                  {hasTakenQuiz ? "Retake Preference Quiz" : "Start Preference Quiz"}
                </Link>
              </div>
            </div>
          </div>

          {privacyInsightsHistoryEnabled && (
            <div
              className="card-reveal mt-5 rounded-2xl border border-white/55 bg-white/70 p-5 shadow-sm dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-6"
              style={{ animationDelay: "230ms" }}
            >
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Weekly Snapshot</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    You have completed <span className="font-bold text-slate-900 dark:text-white">{completedTasks}</span> out of <span className="font-bold text-slate-900 dark:text-white">{analyticsTotalTasks}</span> tasks since your current insights timeline started.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">7-Day Completed Trend</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Based on completed task timestamps</p>
                  </div>
                  <div className="h-44 rounded-2xl border border-white/60 bg-white/75 p-4 dark:border-slate-700/60 dark:bg-slate-900/35">
                    <div className="flex h-full items-end justify-between gap-2">
                      {weeklyCompletionData.map((day) => {
                        const barHeight = `${Math.max(10, (day.count / maxDailyCompletion) * 100)}%`;
                        return (
                          <div key={day.key} className="flex h-full w-full flex-col items-center justify-end gap-2">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">{day.count}</span>
                            <div className="relative flex h-full w-full items-end">
                              <div
                                className="w-full rounded-t-lg transition-all duration-700 ease-out motion-reduce:transition-none"
                                style={{ height: barHeight, backgroundColor: "var(--theme-accent-strong)" }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{day.shortLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/60 bg-white/75 p-4 dark:border-slate-700/60 dark:bg-slate-900/35">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Current Streak</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{currentStreak} day{currentStreak === 1 ? "" : "s"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/75 p-4 dark:border-slate-700/60 dark:bg-slate-900/35">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Best Streak</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{bestStreak} day{bestStreak === 1 ? "" : "s"}</p>
                  </div>
                  <div
                    className="rounded-2xl border p-4"
                    style={{ borderColor: "var(--theme-accent)", backgroundColor: "var(--theme-accent-soft)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--theme-accent-strong)" }}>Next Goal</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--theme-accent-strong)" }}>
                      Complete {Math.max(1, Math.ceil((60 * analyticsTotalTasks) / 100) - completedTasks)} more task{Math.max(1, Math.ceil((60 * analyticsTotalTasks) / 100) - completedTasks) === 1 ? "" : "s"} to reach 60% momentum.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <div className="mt-auto">
        <Footer />
      </div>

      <style jsx>{`
        .card-reveal {
          opacity: 0;
          transform: translateY(16px) scale(0.992);
          animation: profileCardReveal 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes profileCardReveal {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .card-reveal {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
