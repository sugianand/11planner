"use client";

// Shows an always-visible mini timer when a session is running outside dashboard.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTimer } from "@/contexts/TimerContext";

// Formats remaining timer seconds as MM:SS.
function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Shows a floating timer chip while a timer runs outside the dashboard page.
export default function GlobalTimerTicker() {
  const pathname = usePathname();
  const { activeTimerMode, activeTimeLeft } = useTimer();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  if (!activeTimerMode || activeTimeLeft === null) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="fixed top-20 left-4 md:top-22 md:left-6 z-[70] rounded-2xl border border-emerald-200/70 dark:border-emerald-500/35 bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl shadow-lg px-5 py-4 transition hover:scale-[1.02]"
      aria-label="Open dashboard timer"
      title="Open Dashboard Timer"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
        Focus Session
      </p>
      <p className="text-2xl font-bold leading-none text-slate-900 dark:text-white mt-1 tabular-nums">
        {formatTime(activeTimeLeft)}
      </p>
    </Link>
  );
}
