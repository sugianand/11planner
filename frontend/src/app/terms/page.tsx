"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { usePlanner } from "@/contexts/PlannerContext";

export default function TermsPage() {
  const { userId } = usePlanner();
  const isLoggedIn = userId !== "user_demo";

  const highlights = [
    {
      icon: "check_circle",
      title: "Clear Usage Rules",
      body: "Use 11Planner for personal academic planning and responsible account behavior."
    },
    {
      icon: "lock_person",
      title: "You Own Your Content",
      body: "Your coursework and planning inputs remain yours."
    },
    {
      icon: "gavel",
      title: "Fair Enforcement",
      body: "Accounts may be restricted only for misuse, abuse, or policy violations."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>

      <div className="max-w-4xl mx-auto p-6 lg:p-10 mt-16 mb-24">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 md:p-10 border border-white/40 dark:border-slate-700/40 space-y-8">
          <div className="mb-8 border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--theme-accent-strong)" }}>Terms</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
              Simple terms for a calmer workflow.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
              Effective date: March 30, 2026
            </p>
            <p className="text-slate-700 dark:text-slate-300 mt-4 leading-relaxed max-w-3xl">
              These Terms explain acceptable use, account responsibilities, and legal boundaries
              for using 11Planner.
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acceptance of terms</h2>
            <p className="text-slate-700 dark:text-slate-300">
              By using 11Planner, you agree to these Terms and our
              <Link href="/privacy" className="font-semibold hover:underline" style={{ color: "var(--theme-accent-strong)" }}> Privacy Policy</Link>.
              If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Use of the service</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Use the app for personal academic planning and productivity.</li>
              <li>Do not attempt to disrupt, reverse engineer, or abuse the service.</li>
              <li>Keep your account details secure and accurate.</li>
              <li>Follow applicable laws and institutional policies while using the platform.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Content and ownership</h2>
            <p className="text-slate-700 dark:text-slate-300">
              You retain ownership of the content you create. You grant us a limited license
              to store and process it only for providing the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Availability and updates</h2>
            <p className="text-slate-700 dark:text-slate-300">
              We aim for reliable uptime but do not guarantee uninterrupted access. Features
              may change or be removed as the product evolves.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Termination and account actions</h2>
            <p className="text-slate-700 dark:text-slate-300">
              You can stop using the service at any time. We may suspend accounts that
              violate these terms or harm the platform or other users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Disclaimer and limitation</h2>
            <p className="text-slate-700 dark:text-slate-300">
              11Planner is provided &quot;as is&quot; without warranties. We are not responsible for
              missed deadlines or outcomes based on scheduling suggestions.
            </p>
          </section>

          <section
            className="space-y-4 rounded-2xl p-5"
            style={{
              backgroundColor: "var(--theme-accent-soft)",
              border: "1px solid color-mix(in srgb, var(--theme-accent) 35%, transparent)"
            }}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Questions about terms</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Questions about these terms? Email 11planner.support@gmail.com.
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              You can also visit{' '}
              <Link href="/support" className="font-semibold hover:underline" style={{ color: "var(--theme-accent-strong)" }}>/support</Link>{' '}
              for troubleshooting and contact guidance.
            </p>
          </section>

          {isLoggedIn && (
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
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
