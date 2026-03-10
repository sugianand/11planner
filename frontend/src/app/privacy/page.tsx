"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>


      <div className="max-w-3xl mx-auto p-6 lg:p-10 mt-16 mb-24">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Privacy</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
            Your data, your control.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
            Effective date: February 6, 2026
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Overview</h2>
            <p className="text-slate-700 dark:text-slate-300">
              11Planner is a student-focused planning tool. We collect only the information
              needed to create schedules, reminders, and productivity insights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Information we collect</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Profile data: name, email, university, and major (if provided).</li>
              <li>Planning data: courses, tasks, deadlines, and schedule blocks.</li>
              <li>Device data: browser type and basic diagnostics for reliability.</li>
              <li>Usage data: feature interactions to improve the product.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">How we use data</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Generate schedules, reminders, and focus sessions.</li>
              <li>Sync your data across sessions and devices (if enabled).</li>
              <li>Improve performance, security, and feature quality.</li>
              <li>Provide support and respond to requests.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sharing and disclosure</h2>
            <p className="text-slate-700 dark:text-slate-300">
              We do not sell your personal data. We may share limited data with trusted
              service providers that help run the app (hosting, analytics, email).
              Those providers are required to protect your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your choices</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Update your profile at any time from the Profile page.</li>
              <li>Disable notifications or reminders from Settings.</li>
              <li>Request deletion of your account and associated data.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data retention</h2>
            <p className="text-slate-700 dark:text-slate-300">
              We retain data while your account is active. If you delete your account,
              we remove your personal data within a reasonable timeframe.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Questions about privacy? Email support@11planner.com.
            </p>
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
