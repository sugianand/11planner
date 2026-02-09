'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,#f8fafc,transparent_55%),radial-gradient(circle_at_20%_40%,#fef3c7,transparent_50%),radial-gradient(circle_at_80%_20%,#a7f3d0,transparent_45%)] dark:bg-[radial-gradient(circle_at_top,#0f172a,transparent_55%),radial-gradient(circle_at_30%_30%,#1e293b,transparent_50%),radial-gradient(circle_at_80%_20%,#0f766e,transparent_45%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:64px_64px] opacity-60" />
      <div className="fixed inset-0 -z-10 bg-white/35 dark:bg-black/35" />
      <div className="fixed inset-0 -z-10 grain-overlay opacity-60" />
      <div className="fixed -top-24 right-12 h-40 w-40 rounded-full border border-emerald-200/50 dark:border-emerald-700/30" />
      <div className="fixed top-32 left-10 h-28 w-28 rounded-full border border-amber-200/50 dark:border-amber-700/30" />
      <div className="fixed bottom-24 right-24 h-48 w-48 rounded-full border border-sky-200/50 dark:border-sky-700/30" />
      <main className="w-full max-w-[1200px] mx-auto px-6 mt-16 md:mt-24 mb-32 relative">
        <div className="glass-hero dark:bg-slate-800/40 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl dark:border dark:border-slate-700/50">
          {/* Floating Icons */}
          <div className="absolute top-10 left-10 floating-icon hidden lg:block">
            <div className="bg-white/80 dark:bg-slate-700/80 p-4 rounded-2xl shadow-lg backdrop-blur-md">
              <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-3xl">task_alt</span>
            </div>
          </div>
          <div className="absolute bottom-20 right-10 floating-icon-delayed hidden lg:block">
            <div className="bg-white/80 dark:bg-slate-700/80 p-4 rounded-2xl shadow-lg backdrop-blur-md">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-3xl">schedule</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-slate-700/40 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-widest border border-white/20 dark:border-slate-600/30">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Quietly Productive
            </div>

            <div className="relative flex items-center justify-center">
              <img
                src="/11caroon.png"
                alt="11Planner logo"
                className="h-24 w-24 md:h-28 md:w-28 object-cover rounded-full shadow-lg border border-white/30 dark:border-slate-600/30"
              />
              <div className="absolute -top-10 left-24 md:left-28 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <svg width="54" height="36" viewBox="0 0 54 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 30C38 8 18 6 4 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M10 22L4 18L8 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Click here to learn more</span>
              </div>
            </div>
            <h1 className="text-slate-900 dark:text-white text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight max-w-[800px]">
              Work at a slower, <br />
              <span className="text-slate-800 dark:text-slate-200 italic font-serif">smarter</span> pace.
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-xl font-medium leading-relaxed max-w-[620px]">
              11Planner is an intelligent academic dashboard that transforms overwhelming syllabi into actionable 30-minute focus blocks to eliminate procrastination.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Link href="/dashboard">
                <button className="bg-[#306844] dark:bg-[#3d8658] hover:opacity-90 text-white px-10 py-5 rounded-pill text-lg font-extrabold shadow-lg transition-all transform hover:scale-105">
                  Start now →
                </button>
              </Link>
              <Link href="/schedule">
                <button className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md px-10 py-5 rounded-pill text-lg font-bold text-slate-900 dark:text-white transition-all hover:bg-white/60 dark:hover:bg-slate-600/60 border border-white/30 dark:border-slate-600/30">
                  View Schedule
                </button>
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">Beat the 11:59 Rush</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Never submit at the last minute again. Smart scheduling ensures you complete assignments well before the 11:59pm deadline.
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">energy_savings_leaf</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">Energy Budgeting</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Plan tasks based on your energy levels. High focus for deep work, low focus for admin.
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">Visual Clarity</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Minimalist interface designed to reduce cognitive load and prevent digital overwhelm.
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-3xl py-16 px-6 border-t border-white/40 dark:border-slate-700/40">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Link href="/logo-story" className="inline-flex">
              <img
                src="/11caroon.png"
                alt="11Planner logo"
                className="h-10 w-10 object-cover rounded-xl border border-white/30 dark:border-slate-700/40"
              />
            </Link>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Link className="hover:text-black dark:hover:text-white" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-black dark:hover:text-white" href="/terms">
              Terms
            </Link>
            <Link className="hover:text-black dark:hover:text-white" href="/support">
              Support
            </Link>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-sm font-medium text-center md:text-right space-y-2">
            <p>© 2026 11Planner. Designed for peace.</p>
            <Link href="/logo-story" className="text-xs hover:text-slate-600 dark:hover:text-slate-300">
              Stranger Things and related marks are trademarks and copyrights of Netflix, Inc. 11Planner is not affiliated with Netflix.
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
