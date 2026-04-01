"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  const highlights = [
    {
      icon: "verified_user",
      title: "No Data Sales",
      body: "We do not sell personal information to advertisers or data brokers."
    },
    {
      icon: "delete_forever",
      title: "Deletion Control",
      body: "You can request account and data deletion at any time."
    },
    {
      icon: "shield_locked",
      title: "Security First",
      body: "Reasonable safeguards protect your account and planning data."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>


      <div className="max-w-4xl mx-auto p-6 lg:p-10 mt-16 mb-24">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 md:p-10 border border-white/40 dark:border-slate-700/40 space-y-8">
          <div className="mb-8 border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--theme-accent-strong)" }}>Privacy</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
              Your data, your control.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
              Effective date: March 30, 2026
            </p>
            <p className="text-slate-700 dark:text-slate-300 mt-4 leading-relaxed max-w-3xl">
              This policy explains what 11Planner collects, why we collect it, and the choices
              you have over your information.
            </p>
          </div>

          <section className="grid md:grid-cols-3 gap-4">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-white/70 dark:bg-slate-800/65 border border-white/60 dark:border-slate-700/50 p-5"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: "var(--theme-accent-soft)",
                    color: "var(--theme-accent-strong)"
                  }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">What we collect</h2>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="rounded-xl bg-white/55 dark:bg-slate-800/45 border border-white/60 dark:border-slate-700/45 p-4">
                <span className="font-semibold text-slate-900 dark:text-white">Account and profile data:</span> name,
                email, university, and major (if you choose to provide it).
              </li>
              <li className="rounded-xl bg-white/55 dark:bg-slate-800/45 border border-white/60 dark:border-slate-700/45 p-4">
                <span className="font-semibold text-slate-900 dark:text-white">Planning data:</span> courses,
                deadlines, tasks, and schedule blocks used to generate your plan.
              </li>
              <li className="rounded-xl bg-white/55 dark:bg-slate-800/45 border border-white/60 dark:border-slate-700/45 p-4">
                <span className="font-semibold text-slate-900 dark:text-white">Technical data:</span> basic
                diagnostics such as browser type, performance logs, and reliability events.
              </li>
              <li className="rounded-xl bg-white/55 dark:bg-slate-800/45 border border-white/60 dark:border-slate-700/45 p-4">
                <span className="font-semibold text-slate-900 dark:text-white">Usage data:</span> feature
                interactions used to improve quality and user experience.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">How we use your data</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Generate schedules, reminders, and focus recommendations.</li>
              <li>Sync your planner across sessions and devices when applicable.</li>
              <li>Maintain reliability, security, and fraud prevention.</li>
              <li>Respond to support requests and account-related questions.</li>
              <li>Improve product features and planning quality over time.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sharing and third parties</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We do not sell your personal information. We may share limited data with vetted
              providers that operate essential services (for example hosting, analytics, and
              email delivery), and those providers are contractually expected to protect data.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We may disclose information when required by law, to enforce platform safety,
              or to protect users and the integrity of our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your rights and choices</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Update profile information from your Profile page.</li>
              <li>Adjust reminders and notifications from Settings.</li>
              <li>Request export or deletion of your account data by contacting support.</li>
              <li>Stop using the service at any time.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Retention and security</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We keep account data while your account is active and as needed to provide
              the service. When you request deletion, we remove personal data within a
              reasonable period, except where retention is legally required.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We use administrative and technical safeguards designed to reduce unauthorized
              access, misuse, and data loss.
            </p>
          </section>

          <section
            className="space-y-4 rounded-2xl p-5"
            style={{
              backgroundColor: "var(--theme-accent-soft)",
              border: "1px solid color-mix(in srgb, var(--theme-accent) 35%, transparent)"
            }}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Questions or requests</h2>
            <p className="text-slate-700 dark:text-slate-300">
              For privacy questions, access requests, correction requests, or account deletion,
              contact: support@11planner.com
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              You can also review our terms at{" "}
              <Link href="/terms" className="font-semibold hover:underline" style={{ color: "var(--theme-accent-strong)" }}>
                /terms
              </Link>{" "}
              and get help from{" "}
              <Link href="/support" className="font-semibold hover:underline" style={{ color: "var(--theme-accent-strong)" }}>
                /support
              </Link>
              .
            </p>
          </section>

          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-700/70">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold"
              style={{ color: "var(--theme-accent-strong)" }}
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
