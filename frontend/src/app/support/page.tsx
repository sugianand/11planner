"use client";

// Support page — provides contact details, common troubleshooting tips,
// and links to related policy pages (privacy, terms).

import Link from "next/link";
import Footer from "@/components/Footer";
import { usePlanner } from "@/contexts/PlannerContext";
// Support page with contact info, response expectations, common fixes, and related links, styled for clarity and ease of use.
export default function SupportPage() {
  const { userId } = usePlanner();
  // Only show "Back to home" for authenticated users
  const isLoggedIn = userId !== "user_demo";

  // Key support options displayed as summary cards
  const supportHighlights = [
    {
      icon: "mail",
      title: "Direct Email Support",
      body: "Reach us at 11planner.support@gmail.com for account, bug, and usage questions."
    },
    {
      icon: "schedule",
      title: "Fast Response",
      body: "We typically respond within 2-3 business days with concrete next steps."
    },
    {
      icon: "checklist",
      title: "Actionable Help",
      body: "You will receive troubleshooting guidance, clarifications, or escalation details."
    }
  ];
//Returns the JSX for the support page, including a header, support highlights, contact info, common fixes, and related links, with conditional rendering of a back to home link if the user is logged in.
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>

      <div className="max-w-4xl mx-auto p-6 lg:p-10 mt-16 mb-24">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 md:p-10 border border-white/40 dark:border-slate-700/40 space-y-8">
          <div className="mb-8 border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--theme-accent-strong)" }}>Support</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
              We are here to help.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
              Need help with planning, account setup, or unexpected behavior? We respond quickly with clear next steps.
            </p>
          </div>

          {/* Support highlights — email, response time, and actionable help */}
          <section className="grid md:grid-cols-3 gap-4">
            {supportHighlights.map((item) => (
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

          {/* Contact details — highlighted with themed accent background */}
          <section
            className="space-y-4 rounded-2xl p-5"
            style={{
              backgroundColor: "var(--theme-accent-soft)",
              border: "1px solid color-mix(in srgb, var(--theme-accent) 35%, transparent)"
            }}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contact support</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Email: <span className="font-semibold">11planner.support@gmail.com</span>
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Typical response time: within 2-3 business days.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              For account deletion or privacy-related requests, please include &quot;Privacy Request&quot; in your subject line.
            </p>
          </section>

          {/* Tips for writing a helpful support email */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Before you email us</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Include the page where the issue occurred.</li>
              <li>Share steps to reproduce and any error messages.</li>
              <li>Tell us your browser and device type if relevant.</li>
              <li>Add screenshots if the UI looks wrong.</li>
            </ul>
          </section>

          {/* Common self-service fixes users can try first */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Common fixes</h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>Refresh the page and try again.</li>
              <li>Sign out and back in if data looks outdated.</li>
              <li>Clear browser cache for rendering issues.</li>
              <li>Temporarily disable browser extensions if UI actions are blocked.</li>
            </ul>
          </section>

          <section className="space-y-4 rounded-2xl bg-white/55 dark:bg-slate-800/45 border border-white/60 dark:border-slate-700/45 p-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Related pages</h2>
            <p className="text-slate-700 dark:text-slate-300">
              For policy details, review
              <Link href="/privacy" className="font-semibold hover:underline" style={{ color: "var(--theme-accent-strong)" }}> /privacy</Link>
              {' '}and
              <Link href="/terms" className="font-semibold hover:underline" style={{ color: "var(--theme-accent-strong)" }}> /terms</Link>
              .
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
