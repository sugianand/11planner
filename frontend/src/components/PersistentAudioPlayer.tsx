"use client";

/**
 * PersistentAudioPlayer — Maintains audio playback across page navigation.
 * 
 * This component is placed at the root layout level to ensure that:
 * 1. Soundscape audio continues playing when switching pages
 * 2. Spotify Web Playback continues uninterrupted
 * 3. YouTube music playback persists across navigation
 * 
 * The component maintains references to audio elements and ensures they
 * are not unmounted when routes change.
 */

import { useEffect, useRef } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { usePlanner } from "@/contexts/PlannerContext";
import {
  attachHtmlAudioSession,
  getFocusAudioPlaybackSnapshot,
  subscribeFocusAudioPlayback,
} from "@/lib/focusAudioPlayback";

export default function PersistentAudioPlayer() {
  const { userId } = usePlanner();
  const soundscapeAudioRef = useRef<HTMLAudioElement | null>(null);
  const focusAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements on mount and maintain them across navigation
  useEffect(() => {
    // Create soundscape audio element if it doesn't exist
    if (!soundscapeAudioRef.current) {
      const audio = document.createElement("audio");
      audio.crossOrigin = "anonymous";
      audio.loop = true;
      soundscapeAudioRef.current = audio;
      document.body.appendChild(audio);
    }

    // Create focus/timer audio element if it doesn't exist
    if (!focusAudioRef.current) {
      const audio = document.createElement("audio");
      audio.crossOrigin = "anonymous";
      audio.loop = true;
      focusAudioRef.current = audio;
      document.body.appendChild(audio);
    }

    // Subscribe to focus audio playback changes to maintain reference
    const unsubscribe = subscribeFocusAudioPlayback((snapshot) => {
      if (
        snapshot.isPlaying &&
        snapshot.soundId &&
        focusAudioRef.current &&
        !focusAudioRef.current.src
      ) {
        // Reattach audio element if it was lost
        attachHtmlAudioSession(
          focusAudioRef.current,
          snapshot.soundId,
          snapshot.userId || userId || ""
        );
      }
    });

    return () => {
      unsubscribe();
      // Don't remove audio elements on unmount - they should persist
    };
  }, [userId]);

  // Hidden audio elements - they are controlled programmatically
  return (
    <>
      {/* Soundscape audio element (for focus atmospheres) */}
      <audio
        ref={soundscapeAudioRef}
        style={{ display: "none" }}
        controls={false}
      />
      {/* Focus timer audio element */}
      <audio
        ref={focusAudioRef}
        style={{ display: "none" }}
        controls={false}
      />
    </>
  );
}
