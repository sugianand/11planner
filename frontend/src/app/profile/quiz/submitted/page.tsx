"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function QuizSubmittedPage() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-2xl mx-auto p-6">
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

      <Footer />
    </div>
  );
}
