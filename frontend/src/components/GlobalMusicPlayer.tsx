"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMusic } from "@/contexts/MusicContext";
import { useEffect, useState } from "react";

// Renders a floating music player outside dashboard so focus music can continue across routes.
export default function GlobalMusicPlayer() {
  const pathname = usePathname();
  const {
    musicProvider,
    isMusicOpen,
    setIsMusicOpen,
    spotifyPlaylist,
    youtubeTracks,
    activeYoutubeIndex,
    isYoutubePlaying,
    setIsYoutubePlaying,
    setActiveYoutubeIndex,
  } = useMusic();

  // Listen for timer/soundscape floating UI presence
  const [hasFloatingTimerOrSound, setHasFloatingTimerOrSound] = useState(false);
  useEffect(() => {
    // Listen for a custom event dispatched by GlobalTimerTicker or soundscapes
    function handleFloatUIEvent(e: any) {
      setHasFloatingTimerOrSound(Boolean(e.detail && e.detail.active));
    }
    window.addEventListener("floating-ui-active", handleFloatUIEvent);
    return () => window.removeEventListener("floating-ui-active", handleFloatUIEvent);
  }, []);

  // The timer/soundscapes component should dispatch this event when mounted/unmounted or state changes:
  // window.dispatchEvent(new CustomEvent("floating-ui-active", { detail: { active: true/false } }));

  if (pathname?.startsWith("/dashboard") || !isMusicOpen) {
    return null;
  }

  const activeYoutubeTrack = youtubeTracks[activeYoutubeIndex] ?? youtubeTracks[0];
  const hasYoutubeTrack = Boolean(activeYoutubeTrack?.youtubeId);

  if (musicProvider === "youtube" && (!hasYoutubeTrack || !isYoutubePlaying)) {
    return null;
  }

  const youtubeEmbedSrc = hasYoutubeTrack
    ? `https://www.youtube.com/embed/${activeYoutubeTrack.youtubeId}?autoplay=${isYoutubePlaying ? 1 : 0}&controls=1&rel=0&modestbranding=1`
    : "";

  // Move lower if timer/sound is active
  const playerPosition = hasFloatingTimerOrSound
    ? "left-2 top-56 md:left-4" // lower if timer/sound is present
    : "left-2 top-24 md:left-4";

  return (
    <div className={`fixed ${playerPosition} z-[75] w-[260px] max-w-[calc(100vw-1rem)] md:w-[300px]`}>
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/88 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/88">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-2.5 py-2 dark:border-slate-700/70">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Focus Music
            </p>
            <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
              {musicProvider === "spotify" ? "Spotify Player" : `${activeYoutubeTrack.title} • ${activeYoutubeTrack.artist}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMusicOpen(false);
              if (musicProvider === "youtube") {
                setIsYoutubePlaying(false);
              }
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Close floating music player"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">close</span>
          </button>
        </div>

        <div className="bg-black/95">
          {musicProvider === "spotify" ? (
            <iframe
              style={{ border: "none" }}
              src={`https://open.spotify.com/embed/playlist/${spotifyPlaylist}?utm_source=generator&theme=0`}
              width="100%"
              height="140"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify floating player"
            />
          ) : (
            <iframe
              src={youtubeEmbedSrc}
              title={activeYoutubeTrack.title}
              width="100%"
              height="156"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-200/80 px-2.5 py-2 dark:border-slate-700/70">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Open Dashboard
          </Link>
          {musicProvider === "youtube" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!youtubeTracks.length) {
                    return;
                  }
                  setActiveYoutubeIndex((prev: number) => (prev - 1 + youtubeTracks.length) % youtubeTracks.length);
                  setIsYoutubePlaying(true);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Previous YouTube track"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">skip_previous</span>
              </button>
              <button
                type="button"
                onClick={() => setIsYoutubePlaying((prev: boolean) => !prev)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-500"
                aria-label="Toggle YouTube playback"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {isYoutubePlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!youtubeTracks.length) {
                    return;
                  }
                  setActiveYoutubeIndex((prev: number) => (prev + 1) % youtubeTracks.length);
                  setIsYoutubePlaying(true);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Next YouTube track"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">skip_next</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
