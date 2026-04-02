"use client";

import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Link from "next/link";


type ProfileData = {
  firstname: string;
  lastname: string;
};

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

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
  const [privacyProfileVisible] = useState(() =>
    typeof window === "undefined"
      ? true
      : localStorage.getItem("privacyProfileVisible") !== "false"
  );
  const [privacyPersonalizationEnabled] = useState(() =>
    typeof window === "undefined"
      ? true
      : localStorage.getItem("privacyPersonalizationEnabled") !== "false"
  );
  const [animatedCompletionRate, setAnimatedCompletionRate] = useState(0);
  const animatedCompletionRateRef = useRef(0);

  useEffect(() => {

    async function fetchProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.debug("No authenticated user, showing guest profile");
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
          console.debug("No profile data found:", profileError.message);
          return;
        }

        setProfile(profileData);
        setFirstNameInput(profileData.firstname || "");
        setLastNameInput(profileData.lastname || "");
      } catch (err) {
        console.debug("Profile fetch error (guest mode):", err);
      }
    }

    fetchProfile();
  }, []);

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

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const inProgressTasks = totalTasks - completedTasks;
  const hasTakenQuiz = Boolean(
    preferences?.worktime &&
    preferences?.workdays?.length &&
    preferences?.workstyle &&
    preferences?.assignmentplan
  );

  const fullName = privacyProfileVisible
    ? (profile ? `${profile.firstname} ${profile.lastname}` : "Guest User")
    : "Private Profile";
  const initials = privacyProfileVisible
    ? `${profile?.firstname?.[0] ?? "G"}${profile?.lastname?.[0] ?? "U"}`.toUpperCase()
    : "PP";

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

  const weeklyCompletionData = useMemo(() => {
    const countsByDay = new Map<string, number>();

    tasks.forEach((task) => {
      if (!task.completed) return;
      const date = new Date(task.deadline);
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
  }, [tasks]);

  const maxDailyCompletion = useMemo(
    () => Math.max(1, ...weeklyCompletionData.map((day) => day.count)),
    [weeklyCompletionData]
  );

  const { currentStreak, bestStreak } = useMemo(() => {
    const completedDateKeys = new Set<string>();

    tasks.forEach((task) => {
      if (!task.completed) return;
      const date = new Date(task.deadline);
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
  }, [tasks]);

  const quickActions = [
    { href: "/tasks", label: "Add Task" },
    { href: "/schedule", label: "Open Schedule" },
    { href: "/dashboard", label: "Focus Dashboard" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-30" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_20%_15%,var(--theme-accent-soft),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.18),transparent_40%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/25 via-transparent to-white/40 dark:from-slate-900/45 dark:via-slate-900/25 dark:to-slate-950/60" />

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-10 sm:p-6 sm:pb-12 lg:p-8 lg:pb-14">
        <section className="rounded-3xl border border-white/45 bg-white/50 p-5 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 dark:border-slate-700/55 dark:bg-slate-900/45 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
            <div
              className="card-reveal relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-white/80 via-white/60 to-emerald-50/70 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-28px_rgba(15,23,42,0.35)] motion-reduce:transition-none dark:border-slate-700/55 dark:from-slate-900/70 dark:via-slate-900/55 dark:to-emerald-950/20 sm:p-8"
              style={{ animationDelay: "70ms" }}
            >
              <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-gradient-to-b from-emerald-300/35 to-teal-300/5 blur-2xl dark:from-emerald-400/20 dark:to-transparent" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-[#306844] to-[#3d8658] text-4xl font-black tracking-wide text-white shadow-[0_14px_35px_-16px_rgba(17,24,39,0.7)]">
                  {initials}
                </div>
                <div className="space-y-1">
                  <p className="inline-flex w-fit items-center rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Focus Profile
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    {fullName}
                  </h1>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {privacyProfileVisible
                      ? (email || "Signed out currently - login to sync profile details")
                      : "Email hidden by privacy setting"}
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
                      className="inline-flex items-center rounded-xl bg-[#306844] px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-[#255236]"
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
                        className="w-full rounded-xl border border-slate-300/80 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-white"
                      />
                      <input
                        type="text"
                        value={lastNameInput}
                        onChange={(e) => setLastNameInput(e.target.value)}
                        placeholder="Last name"
                        className="w-full rounded-xl border border-slate-300/80 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-white"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="inline-flex items-center rounded-xl bg-[#306844] px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-[#255236] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{nameFeedback}</p>
                  ) : null}
                  {nameError ? (
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">{nameError}</p>
                  ) : null}
                </div>
              </div>

              <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:border-emerald-200/80 hover:shadow-md dark:border-slate-700/65 dark:bg-slate-800/55">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Tasks</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{totalTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:border-emerald-200/80 hover:shadow-md dark:border-slate-700/65 dark:bg-slate-800/55">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Completed</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{completedTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:border-emerald-200/80 hover:shadow-md dark:border-slate-700/65 dark:bg-slate-800/55">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Courses</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{courses.length}</p>
                </div>
              </div>
            </div>

            <div
              className="card-reveal rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md motion-reduce:transition-none dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-7"
              style={{ animationDelay: "150ms" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Current Momentum</p>
              <div className="mt-3 flex items-end gap-2">
                <h2 className="text-4xl font-black leading-none text-slate-900 dark:text-white">{animatedCompletionRate}%</h2>
                <span className="pb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{focusTier}</span>
              </div>

              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200/85 dark:bg-slate-700/60">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#306844] via-[#2f7f54] to-[#5ac693] transition-all duration-700 ease-out"
                  style={{ width: `${completionRate}%` }}
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

              <div className="mt-6 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  {hasTakenQuiz
                    ? "Your preference profile is saved. Retake any time to recalibrate your planner behavior."
                    : "Take your preference quiz to personalize your schedule generation and task rhythm."}
                </p>
                <Link
                  href="/profile/quiz"
                  className="mt-4 inline-flex items-center rounded-xl bg-[#306844] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#255236] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  {hasTakenQuiz ? "Retake Preference Quiz" : "Start Preference Quiz"}
                </Link>
              </div>
            </div>
          </div>

          <div
            className="card-reveal mt-5 rounded-2xl border border-white/55 bg-white/70 p-5 shadow-sm dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-6"
            style={{ animationDelay: "230ms" }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Weekly Snapshot</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  You have completed <span className="font-bold text-slate-900 dark:text-white">{completedTasks}</span> out of <span className="font-bold text-slate-900 dark:text-white">{totalTasks}</span> tasks. Keep pushing and finish strong before Prototype 3.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="inline-flex items-center rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 motion-reduce:transition-none dark:border-slate-600/70 dark:bg-slate-900/45 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">7-Day Completed Trend</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Based on completed task deadlines</p>
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
                              className="w-full rounded-t-lg bg-gradient-to-t from-[#306844] to-[#5ac693] transition-all duration-700 ease-out motion-reduce:transition-none"
                              style={{ height: barHeight }}
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
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/75 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Next Goal</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    Complete {Math.max(1, Math.ceil((60 * totalTasks) / 100) - completedTasks)} more task{Math.max(1, Math.ceil((60 * totalTasks) / 100) - completedTasks) === 1 ? "" : "s"} to reach 60% momentum.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
