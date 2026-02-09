"use client";

import Link from "next/link";

export default function SupportPage() {
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
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Support</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
            We are here to help.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
            Need help? We respond quickly with clear next steps.
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Email: support@11planner.com
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              Response time: within 1 business day.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Before you email</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Include the page where the issue occurred.</li>
              <li>Share steps to reproduce and any error messages.</li>
              <li>Add screenshots if the UI looks wrong.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Common fixes</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Refresh the page and try again.</li>
              <li>Sign out and back in if data looks outdated.</li>
              <li>Clear browser cache for rendering issues.</li>
            </ul>
          </section>
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-700/70">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
