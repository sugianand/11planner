"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-hero-scenic bg-cover bg-center -z-20"></div>
      <div className="fixed inset-0 bg-white/20 dark:bg-black/40 -z-10"></div>

      <main className="w-full max-w-[1200px] mx-auto px-6 mt-16 md:mt-24 mb-32 relative">
        <div className="glass-hero dark:bg-slate-800/40 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl dark:border dark:border-slate-700/50">
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
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">calendar_today</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">11 Planner</h2>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <a className="hover:text-black dark:hover:text-white" href="#">Privacy</a>
            <a className="hover:text-black dark:hover:text-white" href="#">Terms</a>
            <a className="hover:text-black dark:hover:text-white" href="#">Support</a>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">© 2026 11 Planner. Designed for peace.</p>
        </div>
      </footer>
    </div>
  );
}
