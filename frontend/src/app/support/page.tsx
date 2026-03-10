"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function SupportPage() {
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>

      <div className="max-w-3xl mx-auto p-6 lg:p-10 mt-16 mb-24">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 md:p-10 border border-white/40 dark:border-slate-700/40 space-y-6">
          <div className="mb-8 border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Support</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
              We are here to help.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
              Need help? We respond quickly with clear next steps.
            </p>
          </div>

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
      <Footer />
    </div>
  );
}
