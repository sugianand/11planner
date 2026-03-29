"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { usePlanner } from "@/contexts/PlannerContext";
import { useEffect } from "react";

const WORKTIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const WORKSTYLE_LABELS: Record<string, string> = {
  short: "Short Bursts",
  classic: "Classic Pomodoro",
  "deep-work": "Deep Work",
  "full-immersion": "Full Immersion",
};

const ASSIGNMENT_LABELS: Record<string, string> = {
  early: "Start Early",
  deadline: "Deadline Sprint",
  balanced: "Balanced",
};

export default function QuizSubmittedPage() {
  const { preferences, loadPreferences } = usePlanner();

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const workTimeLabel = preferences?.worktime ? WORKTIME_LABELS[preferences.worktime] || preferences.worktime : "Not set";
  const workStyleLabel = preferences?.workstyle ? WORKSTYLE_LABELS[preferences.workstyle] || preferences.workstyle : "Not set";
  const assignmentLabel = preferences?.assignmentplan
    ? ASSIGNMENT_LABELS[preferences.assignmentplan] || preferences.assignmentplan
    : "Not set";
  const workDaysLabel = preferences?.workdays?.length ? preferences.workdays.join(", ") : "Not set";

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <main className="w-full flex-1">
      <div className="max-w-2xl mx-auto p-6 pb-12">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-2xl p-8 border border-emerald-200/60 dark:border-emerald-800/50 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="w-7 h-7 text-emerald-700 dark:text-emerald-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Preferences Saved</h1>
            <p className="text-slate-700 dark:text-slate-300 mb-8">
              You have successfully completed the preference quiz.
            </p>

            <div className="mb-8 rounded-2xl border border-white/60 bg-white/70 p-4 text-left dark:border-slate-600/60 dark:bg-slate-800/45">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Your Saved Summary</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Work Time:</span> {workTimeLabel}</p>
                <p className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Work Days:</span> {workDaysLabel}</p>
                <p className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Break Style:</span> {workStyleLabel}</p>
                <p className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Assignment Plan:</span> {assignmentLabel}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/profile"
                className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-md hover:shadow-lg"
              >
                Go to Profile
              </Link>
              <Link
                href="/profile/quiz"
                className="border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-6 rounded-lg transition hover:bg-white/70 dark:hover:bg-slate-700/70"
              >
                Take Quiz Again
              </Link>
            </div>
          </div>
        </div>
      </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
