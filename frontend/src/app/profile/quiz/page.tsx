"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Quiz from "../quiz";
import Footer from "@/components/Footer";

export default function QuizPage() {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";
  const [showQuiz, setShowQuiz] = useState(!isOnboarding);

  if (!showQuiz) {
    return (
      <div className="relative min-h-screen overflow-hidden flex flex-col">
        <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-30" />
        <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.24),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.18),transparent_40%)]" />

        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center p-6">
          <div className="w-full rounded-3xl border border-white/45 bg-white/65 p-8 shadow-[0_30px_120px_-48px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/55">
            <div className="rounded-2xl border border-white/50 bg-white/75 p-8 text-center dark:border-slate-700/50 dark:bg-slate-800/55">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Welcome
              </h1>
              <p className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-200">
                in order to best help with schedule generation, please answer the following questions
              </p>
              <button
                type="button"
                onClick={() => setShowQuiz(true)}
                className="mt-8 rounded-xl bg-[#306844] px-6 py-3 font-semibold text-white transition hover:bg-[#255236]"
              >
                Start Preference Quiz
              </button>
            </div>
          </div>
        </main>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }

  return <Quiz />;
}
