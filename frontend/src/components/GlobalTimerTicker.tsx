"use client";

// Shows floating timer/sound controls only while they are active outside dashboard.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { useTimer } from "@/contexts/TimerContext";
import {
  getFocusAudioPlaybackSnapshot,
  subscribeFocusAudioPlayback,
  toggleFocusAudioMuted,
} from "@/lib/focusAudioPlayback";

// Formats remaining timer seconds as MM:SS.
function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Shows a floating timer chip while a timer runs outside the dashboard page.
export default function GlobalTimerTicker() {
  const pathname = usePathname();
  const { userId } = usePlanner();
  const { activeTimerMode, activeTimeLeft } = useTimer();
  const [audioSnapshot, setAudioSnapshot] = useState(() => getFocusAudioPlaybackSnapshot());

  useEffect(() => {
    return subscribeFocusAudioPlayback((snapshot) => {
      setAudioSnapshot(snapshot);
    });
  }, []);

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const hasActiveSound =
    audioSnapshot.isPlaying
    && audioSnapshot.userId === userId
    && audioSnapshot.soundId !== "no-sound";
  const hasActiveTimer = activeTimerMode !== null && activeTimeLeft !== null;
  const canToggleAudio = hasActiveSound;

  if (!hasActiveTimer && !hasActiveSound) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 md:top-22 md:left-6 z-[70] flex flex-col gap-2">
      {hasActiveTimer ? (
        <Link
          href="/dashboard"
          className="rounded-2xl border border-emerald-200/70 dark:border-emerald-500/35 bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl shadow-lg px-5 py-4 transition hover:scale-[1.02]"
          aria-label="Open dashboard timer"
          title="Open Dashboard Timer"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Focus Session
          </p>
          <p className="text-2xl font-bold leading-none text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatTime(activeTimeLeft)}
          </p>
          <p className="text-[11px] mt-2 text-slate-500 dark:text-slate-400">
            Open dashboard timer
          </p>
        </Link>
      ) : null}

      {hasActiveSound ? (
        <div className="flex items-stretch rounded-xl border border-emerald-300/80 dark:border-emerald-500/40 bg-white/90 dark:bg-slate-900/90 text-emerald-700 dark:text-emerald-200 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              if (!canToggleAudio) {
                return;
              }
              toggleFocusAudioMuted();
            }}
            disabled={!canToggleAudio}
            className="px-3 py-2 text-xs font-semibold transition hover:bg-white dark:hover:bg-slate-900 disabled:opacity-70"
            aria-label={audioSnapshot.isMuted ? "Unmute focus sound" : "Mute focus sound"}
          >
            {audioSnapshot.isMuted ? "Unmute Focus Sound" : "Mute Focus Sound"}
          </button>
          <Link
            href="/dashboard?focus=sounds"
            className="h-9 w-9 shrink-0 border-l border-emerald-300/80 dark:border-emerald-500/40 transition hover:bg-white dark:hover:bg-slate-900 flex items-center justify-center"
            aria-label="Open dashboard sounds"
            title="Open dashboard sounds"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">music_note</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
