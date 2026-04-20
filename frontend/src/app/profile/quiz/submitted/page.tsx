"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

export default function QuizSubmittedPage() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      router.replace("/");
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-30" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.24),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.18),transparent_40%)]" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center p-6">
        <div className="w-full rounded-3xl border border-white/45 bg-white/65 p-8 shadow-[0_30px_120px_-48px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/55">
          <div className="rounded-2xl border border-emerald-200/60 bg-white/75 p-8 text-center dark:border-emerald-700/50 dark:bg-slate-800/55">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Thank you, you can edit your Preferences in the Profile page
            </h1>
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              Redirecting to home...
            </p>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
