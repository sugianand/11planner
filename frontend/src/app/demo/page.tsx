"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function DemoPage() {
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-8 left-8 h-72 w-72 rounded-full bg-emerald-200/35 dark:bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-[-4rem] top-1/3 h-96 w-96 rounded-full bg-sky-200/30 dark:bg-sky-500/15 blur-3xl" />
      </div>

      <main className="w-full max-w-[980px] mx-auto px-6 py-16">
        <section className="bg-white/75 dark:bg-slate-900/75 border border-white/50 dark:border-slate-700/60 rounded-3xl shadow-xl p-8 md:p-12 backdrop-blur-sm text-center">
          <p className="text-xs tracking-[0.16em] uppercase font-bold text-emerald-700 dark:text-emerald-300">
            Demo Update
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Product Tour Video Coming Soon
          </h1>
          <p className="mt-4 text-slate-700 dark:text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            We are replacing this demo with a guided video tour of our actual 11Planner web app.
            This page is still in progress and will be updated soon.
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/55 p-8">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Video placeholder</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              The embedded walkthrough will be added here.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 border border-white/70 dark:border-slate-600/70 text-slate-900 dark:text-slate-100 px-6 py-3 rounded-pill font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              Back to home
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-[#306844] dark:bg-[#3d8658] text-white px-6 py-3 rounded-pill font-bold hover:opacity-90 transition-opacity"
            >
              Open 11Planner
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
