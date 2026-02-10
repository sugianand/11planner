"use client";

import Link from "next/link";

export default function TermsPage() {
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
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Terms</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
            Simple terms for a calmer workflow.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
            Effective date: February 6, 2026
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Acceptance of terms</h2>
            <p className="text-slate-700 dark:text-slate-300">
              By using 11Planner, you agree to these Terms of Service and our Privacy Policy.
              If you do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Use of the service</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Use the app for personal academic planning and productivity.</li>
              <li>Do not attempt to disrupt, reverse engineer, or abuse the service.</li>
              <li>Keep your account details secure and accurate.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Content and ownership</h2>
            <p className="text-slate-700 dark:text-slate-300">
              You retain ownership of the content you create. You grant us a limited license
              to store and process it only for providing the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Availability</h2>
            <p className="text-slate-700 dark:text-slate-300">
              We aim for reliable uptime but do not guarantee uninterrupted access. Features
              may change or be removed as the product evolves.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Termination</h2>
            <p className="text-slate-700 dark:text-slate-300">
              You can stop using the service at any time. We may suspend accounts that
              violate these terms or harm the platform or other users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Disclaimer</h2>
            <p className="text-slate-700 dark:text-slate-300">
              11Planner is provided "as is" without warranties. We are not responsible for
              missed deadlines or outcomes based on scheduling suggestions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Third-party rights notice</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Stranger Things and related marks are trademarks and copyrights of Netflix, Inc. 11Planner
              is not affiliated with Netflix. All third-party trademarks and copyrights remain the property
              of their respective owners.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Questions about these terms? Email support@11planner.com.
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
    </div>
  );
}
