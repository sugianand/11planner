"use client";

// Shows focus dashboard widgets, stats, and music controls on the dashboard page.

import { ReactNode, useCallback, useEffect, useState } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { useMusic } from "@/contexts/MusicContext";
import Timer from "@/components/Dashboard/Timer";
import StatCard from "@/components/Dashboard/StatCard";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

type FocusDashboardPanelProps = {
  atmospherePanel?: ReactNode;
  uiHidden?: boolean;
  timerMode: TimerMode;
  timeLeft: number;
  isTimerActive: boolean;
  activeTimerMode: TimerMode | null;
  activeTimeLeft: number | null;
  customTimerDurations: Record<TimerMode, number>;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onModeChange: (mode: TimerMode) => void;
  onSetCustomTimerDurations: (durations: Record<TimerMode, number>) => void;
  onSaveTimerSettings: (durations?: Record<TimerMode, number>) => void;
};

export default function FocusDashboardPanel({
  atmospherePanel,
  uiHidden = false,
  timerMode,
  timeLeft,
  isTimerActive,
  activeTimerMode,
  activeTimeLeft,
  customTimerDurations,
  onToggleTimer,
  onResetTimer,
  onModeChange,
  onSetCustomTimerDurations,
  onSaveTimerSettings,
}: FocusDashboardPanelProps) {
  const {
    userId,
    tasks,
    scheduleBlocks,
    updateTask,
    loadTasks,
    loadAssignments,
    loadScheduleBlocks,
  } = usePlanner();

  const {
    spotifyPlaylist,
    setSpotifyPlaylist,
    musicProvider,
    setMusicProvider,
    isMusicOpen,
    setIsMusicOpen,
    spotifyConnected,
    setSpotifyConnected,
    spotifyConnecting,
    setSpotifyConnecting,
    connectMessage,
    setConnectMessage,
    youtubeMood,
    setYoutubeMood,
    activeYoutubeIndex,
    setActiveYoutubeIndex,
    isYoutubePlaying,
    setIsYoutubePlaying,
    youtubeTracks,
  } = useMusic();

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(true);

  const providerSiteMap: Record<string, string> = {
    spotify: "https://accounts.spotify.com/en/login",
    youtube: "https://music.youtube.com/",
  };

  // Encodes PKCE bytes into URL-safe base64.
  const toBase64Url = (bytes: Uint8Array) => {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  // Creates an S256 PKCE challenge from a verifier string.
  const createPkceChallenge = async (verifier: string) => {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toBase64Url(new Uint8Array(digest));
  };

  // Starts Spotify OAuth in a popup and stores PKCE/session metadata.
  const startSpotifyPopupConnect = async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      setConnectMessage("Spotify connect needs NEXT_PUBLIC_SPOTIFY_CLIENT_ID in frontend/.env.local.");
      return;
    }

    try {
      setConnectMessage("");
      setSpotifyConnecting(true);

      const state = crypto.randomUUID();
      const verifier = crypto.randomUUID() + crypto.randomUUID();
      const challenge = await createPkceChallenge(verifier);
      const redirectUri = `${window.location.origin}/music-auth/spotify`;
      
      // Log the redirect URI for debugging
      console.log('[11Planner] Spotify OAuth - Using redirect_uri:', redirectUri);

      sessionStorage.setItem("spotify_oauth_state", state);
      sessionStorage.setItem("spotify_oauth_verifier", verifier);
      sessionStorage.setItem("spotify_oauth_redirect_uri", redirectUri);

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: challenge,
        state,
        scope: "user-read-email user-read-private",
      });

      const popup = window.open(
        `https://accounts.spotify.com/authorize?${params.toString()}`,
        "spotify-connect",
        "popup=yes,width=520,height=760"
      );

      if (!popup) {
        setConnectMessage("Popup was blocked. Allow popups and try again.");
        setSpotifyConnecting(false);
        return;
      }

      popup.focus();

      const closeWatcher = window.setInterval(() => {
        if (!popup.closed) {
          return;
        }

        window.clearInterval(closeWatcher);
        const pendingState = sessionStorage.getItem("spotify_oauth_state");
        if (pendingState) {
          setSpotifyConnecting(false);
          setConnectMessage("Spotify connect window was closed before finishing.");
        }
      }, 500);
    } catch {
      setConnectMessage("Could not start Spotify connection. Please try again.");
      setSpotifyConnecting(false);
    }
  };

  // Routes provider connect actions to Spotify OAuth or YouTube site popup.
  const handleProviderConnect = () => {
    if (musicProvider === "spotify") {
      void startSpotifyPopupConnect();
      return;
    }
    window.open(providerSiteMap.youtube, "youtube-connect", "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes");
  };

  useEffect(() => {
    if (musicProvider !== "spotify" && connectMessage) {
      setConnectMessage("");
    }
  }, [musicProvider, connectMessage]);

  useEffect(() => {
    if (!connectMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setConnectMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [connectMessage]);

  useEffect(() => {
    loadTasks();
    loadAssignments();
    loadScheduleBlocks();
  }, [userId, loadTasks, loadAssignments, loadScheduleBlocks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPrivacyPersonalizationEnabled(localStorage.getItem("privacyPersonalizationEnabled") !== "false");
  }, []);

  useEffect(() => {
    const indexMap: Record<YouTubeMood, number> = {
      lofi: 0,
      synthwave: 1,
      coding: 2,
    };
    setActiveYoutubeIndex(indexMap[youtubeMood]);
  }, [youtubeMood]);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const processSpotifyPayload = async (payload: {
      source?: string;
      provider?: string;
      code?: string;
      state?: string;
      error?: string;
    }) => {
      if (payload?.source !== "music-oauth-callback" || payload?.provider !== "spotify") {
        return;
      }

      if (payload.error) {
        setConnectMessage("Spotify authorization was canceled or failed.");
        setSpotifyConnecting(false);
        return;
      }

      const expectedState = sessionStorage.getItem("spotify_oauth_state");
      const verifier = sessionStorage.getItem("spotify_oauth_verifier");
      const redirectUri = sessionStorage.getItem("spotify_oauth_redirect_uri") || `${window.location.origin}/music-auth/spotify`;
      const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

      if (!payload.code || !payload.state || payload.state !== expectedState || !verifier || !clientId) {
        setConnectMessage("Spotify authorization validation failed.");
        setSpotifyConnecting(false);
        return;
      }

      try {
        const tokenRes = await fetch(`${apiBaseUrl}/api/music/spotify/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: payload.code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: verifier,
          }),
        });

        if (!tokenRes.ok) {
          throw new Error("token_exchange_failed");
        }

        const tokenData = await tokenRes.json();
        setSpotifyConnected(Boolean(tokenData.access_token));
        setConnectMessage(tokenData.access_token ? "Spotify connected." : "Spotify token missing.");
      } catch {
        setConnectMessage("Spotify token exchange failed. Check Spotify redirect URI and backend server.");
      } finally {
        setSpotifyConnecting(false);
        sessionStorage.removeItem("spotify_oauth_state");
        sessionStorage.removeItem("spotify_oauth_verifier");
        sessionStorage.removeItem("spotify_oauth_redirect_uri");
      }
    };

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = event.data as {
        source?: string;
        provider?: string;
        code?: string;
        state?: string;
        error?: string;
      };

      await processSpotifyPayload(payload);
    };

    const onStorage = async (event: StorageEvent) => {
      if (event.key !== "spotify_oauth_result" || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue) as {
          source?: string;
          provider?: string;
          code?: string;
          state?: string;
          error?: string;
        };
        await processSpotifyPayload(payload);
      } catch {
        setConnectMessage("Spotify callback response could not be read.");
        setSpotifyConnecting(false);
      } finally {
        localStorage.removeItem("spotify_oauth_result");
      }
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const productivityScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const scheduledHours = tasks
    .filter((t) => scheduleBlocks.some((b) => b.task_id === t.id))
    .reduce((sum, t) => sum + t.estimated_hours, 0);

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const isWithinToday = (dateValue: Date) =>
    dateValue.getTime() >= startOfToday.getTime() && dateValue.getTime() < startOfTomorrow.getTime();

  const taskById = new Map<string, (typeof tasks)[number]>();
  tasks.forEach((task) => {
    taskById.set(task.id, task);
  });

  const groupedByTask = new Map<
    string,
    {
      id: string;
      taskId: string;
      title: string;
      startTime: Date;
      endTime: Date;
      completed: boolean;
      blockCount: number;
    }
  >();

  scheduleBlocks.forEach((block) => {
    if (!block.task_id) {
      return;
    }

    const blockStart = new Date(block.start_time);
    if (Number.isNaN(blockStart.getTime()) || !isWithinToday(blockStart)) {
      return;
    }

    const blockEnd = new Date(block.end_time);
    const task = taskById.get(block.task_id);
    if (!task) {
      return;
    }

    const existing = groupedByTask.get(block.task_id);
    if (!existing) {
      groupedByTask.set(block.task_id, {
        id: block.task_id,
        taskId: block.task_id,
        title: task.title || "Untitled Task",
        startTime: blockStart,
        endTime: Number.isNaN(blockEnd.getTime()) ? blockStart : blockEnd,
        completed: task.completed,
        blockCount: 1,
      });
      return;
    }

    if (blockStart.getTime() < existing.startTime.getTime()) {
      existing.startTime = blockStart;
    }

    if (!Number.isNaN(blockEnd.getTime()) && blockEnd.getTime() > existing.endTime.getTime()) {
      existing.endTime = blockEnd;
    }

    existing.completed = task.completed;
    existing.blockCount += 1;
  });

  const todaysScheduledTasks = Array.from(groupedByTask.values()).sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.startTime.getTime() - b.startTime.getTime();
  });

  const scheduledTaskIdSet = new Set(todaysScheduledTasks.map((item) => item.taskId));

  const dueTodayTasks = tasks
    .filter((task) => {
      const deadline = new Date(task.deadline);
      if (Number.isNaN(deadline.getTime())) {
        return false;
      }
      return isWithinToday(deadline) && !scheduledTaskIdSet.has(task.id);
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const checklistTotalCount = todaysScheduledTasks.length + dueTodayTasks.length;
  const checklistCompletedCount =
    todaysScheduledTasks.filter((item) => item.completed).length
    + dueTodayTasks.filter((task) => task.completed).length;
  const checklistProgressPercent =
    checklistTotalCount === 0 ? 0 : Math.round((checklistCompletedCount / checklistTotalCount) * 100);

  const formatDueTime = (deadlineValue: string) => {
    const deadline = new Date(deadlineValue);
    if (Number.isNaN(deadline.getTime())) {
      return "Due today";
    }
    if (deadline.getHours() === 0 && deadline.getMinutes() === 0) {
      return "Due today";
    }
    return `Due ${deadline.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleChecklistToggle = useCallback(
    async (taskId: string, currentCompleted: boolean) => {
      if (!taskId) {
        return;
      }

      setChecklistError(null);
      setTogglingTaskId(taskId);
      try {
        await updateTask(taskId, { completed: !currentCompleted });
      } catch (err) {
        console.error("Failed to update checklist task:", err);
        setChecklistError("Could not update checklist item. Please try again.");
      } finally {
        setTogglingTaskId(null);
      }
    },
    [updateTask]
  );

  // Formats estimated hours with compact rounding for stat cards.
  const formatHours = (hours: number) => {
    const rounded = Math.round(hours * 10) / 10;
    if (rounded === 0) {
      return "0 hrs";
    }
    if (Number.isInteger(rounded)) {
      return `${rounded} hrs`;
    }
    return `${rounded.toFixed(1)} hrs`;
  };

  const overdueTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now && !task.completed;
  });

  const isConnectedForActiveProvider = musicProvider === "spotify" ? spotifyConnected : false;
  const activeYoutubeTrack = youtubeTracks[activeYoutubeIndex];

  const youtubeEmbedSrc = `https://www.youtube.com/embed/${activeYoutubeTrack.youtubeId}?autoplay=${isYoutubePlaying ? 1 : 0}&controls=1&rel=0&modestbranding=1`;
  const activeYouTubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(activeYoutubeTrack.searchQuery)}`;

  // Moves to the previous YouTube track and starts playback.
  const handleYouTubePrev = () => {
    setActiveYoutubeIndex((prev) => (prev - 1 + youtubeTracks.length) % youtubeTracks.length);
    setIsYoutubePlaying(true);
  };

  // Moves to the next YouTube track and starts playback.
  const handleYouTubeNext = () => {
    setActiveYoutubeIndex((prev) => (prev + 1) % youtubeTracks.length);
    setIsYoutubePlaying(true);
  };

  // Toggles embedded YouTube playback state.
  const handleYouTubeTogglePlay = () => {
    setIsYoutubePlaying((prev) => !prev);
  };

  return (
    <div className={`flex flex-col gap-8 transition-opacity duration-150 ${uiHidden ? "pointer-events-none" : "pointer-events-auto"}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={`lg:col-span-3 flex flex-col gap-4 transition-all duration-150 ease-out ${uiHidden ? "-translate-x-8 opacity-0" : "translate-x-0 opacity-100"}`}>
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            subtext={completedTasks > 0 ? `${completedTasks} completed` : "No tasks yet"}
            icon="checklist"
            accentColor="blue"
          />

          <StatCard
            label="Total Hours"
            value={formatHours(totalHours)}
            subtext={`${formatHours(scheduledHours)} scheduled`}
            icon="schedule"
            accentColor="blue"
          />

          {/* Music Player Panel */}
          <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/40 dark:border-slate-700/40 mt-2 transition-[min-height] duration-200 ${isMusicOpen ? "" : "min-h-[110px]"}`}>
            <div className="mb-3 px-2 py-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="shrink-0 text-sm font-semibold tracking-normal text-slate-500 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">headphones</span>
                  Focus Music
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setIsMusicOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setMusicProvider("spotify");
                      }
                      return next;
                    });
                  }}
                  className="h-7 min-w-[64px] shrink-0 rounded-full border border-slate-300 px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {isMusicOpen ? "Hide" : "Show"}
                </button>
              </div>

              {isMusicOpen ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {musicProvider === 'spotify' && (
                    <select
                      className="h-7 rounded-full border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      value={spotifyPlaylist}
                      onChange={(e) => setSpotifyPlaylist(e.target.value)}
                    >
                      <option value="0vvXsWCC9xrXsKd4FyS8kM">Lofi Beats</option>
                      <option value="37i9dQZF1DWZeKCadgRdKQ">Deep Focus</option>
                      <option value="37i9dQZF1DXdf43Md5h6cE">Ambient</option>
                    </select>
                  )}
                  {musicProvider === 'youtube' && (
                    <select
                      className="h-7 rounded-full border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      value={youtubeMood}
                      onChange={(e) => setYoutubeMood(e.target.value as YouTubeMood)}
                    >
                      <option value="lofi">Lofi Beats</option>
                      <option value="synthwave">Synthwave</option>
                      <option value="coding">Coding Mix</option>
                    </select>
                  )}
                  <select
                    className="h-7 rounded-full border border-slate-300 bg-slate-100 px-3 text-xs font-bold text-slate-700 outline-none transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    value={musicProvider}
                    onChange={(e) => setMusicProvider(e.target.value)}
                  >
                    <option value="spotify">Spotify</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              ) : null}
            </div>

            {isMusicOpen && musicProvider === "spotify" && connectMessage ? (
              <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                {connectMessage}
              </p>
            ) : null}

            {isMusicOpen ? (
            <>
            <div className="h-[520px] w-full overflow-hidden transition-all duration-300">
              {musicProvider === 'spotify' && (
                <div className="flex h-full flex-col">
                  <div className="min-h-0 flex-1 overflow-hidden rounded-xl">
                    <iframe
                      style={{ border: 'none', borderRadius: '12px', height: '100%' }}
                      src={`https://open.spotify.com/embed/playlist/${spotifyPlaylist}?utm_source=generator&theme=0`}
                      width="100%"
                      height="100%"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="h-full shadow-sm"
                    ></iframe>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {isConnectedForActiveProvider ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Connected
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleProviderConnect}
                      disabled={spotifyConnecting}
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {spotifyConnecting ? "Connecting..." : "Connect Spotify"}
                    </button>
                    {/* Open Spotify home page in a new tab */}
                    <a
                      href="https://open.spotify.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Open Spotify
                    </a>
                  </div>
                </div>
              )}
              {musicProvider === 'youtube' && (
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-b from-[#131313] via-[#0f0f0f] to-black p-4 text-zinc-100 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <a
                        href={activeYouTubeMusicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-500/80 bg-red-600/95"
                        aria-label="Open YouTube Music"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
                          <path d="M9 7.5v9l8-4.5-8-4.5z" />
                        </svg>
                      </a>
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold tracking-wide text-white">YouTube Music</p>
                        <p className="text-[11px] text-zinc-400">
                          {privacyPersonalizationEnabled ? "Personalized mix for focus" : "Focus mix"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-zinc-300">
                      Listening
                    </div>
                  </div>

                  <div className="mb-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
                    <iframe
                      src={youtubeEmbedSrc}
                      title={activeYoutubeTrack.title}
                      width="100%"
                      height="220"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="truncate text-[11px] uppercase tracking-wide text-zinc-400">Now Playing</p>
                    <p className="truncate text-sm font-semibold text-white">{activeYoutubeTrack.title}</p>
                    <p className="truncate text-xs text-zinc-400">{activeYoutubeTrack.artist} · {activeYoutubeTrack.duration}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleYouTubePrev}
                        className="rounded-full border border-zinc-700 bg-zinc-900 p-2 transition hover:bg-zinc-800"
                        aria-label="Previous track"
                      >
                        <span className="material-symbols-outlined text-base">skip_previous</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleYouTubeTogglePlay}
                        className="rounded-full bg-red-600 p-2 transition hover:bg-red-500"
                        aria-label="Play or pause"
                      >
                        <span className="material-symbols-outlined text-base">{isYoutubePlaying ? "pause" : "play_arrow"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleYouTubeNext}
                        className="rounded-full border border-zinc-700 bg-zinc-900 p-2 transition hover:bg-zinc-800"
                        aria-label="Next track"
                      >
                        <span className="material-symbols-outlined text-base">skip_next</span>
                      </button>
                      <button
                        type="button"
                        className="ml-auto rounded-full border border-zinc-700 bg-zinc-900 p-2 transition hover:bg-zinc-800"
                        aria-label="Like track"
                      >
                        <span className="material-symbols-outlined text-base">favorite</span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Queue</p>
                    <div className="space-y-1.5 text-xs">
                      {youtubeTracks.map((track, idx) => (
                        <button
                          key={track.youtubeId}
                          type="button"
                          onClick={() => {
                            setActiveYoutubeIndex(idx);
                            setIsYoutubePlaying(true);
                          }}
                          className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${idx === activeYoutubeIndex ? "bg-zinc-800 text-white" : "hover:bg-zinc-900"}`}
                        >
                          <span className="truncate">{track.title} · {track.artist}</span>
                          <span className="text-zinc-500">{track.duration}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {musicProvider === 'youtube' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Opens YouTube Music directly so sign-in completes in the correct product context. */}
                <a
                  href="https://music.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Connect YouTube Music
                </a>
                <a
                  href="https://music.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Open YouTube Music
                </a>
                <p className="w-full text-[11px] text-slate-500 dark:text-slate-400">
                  YouTube account selection is managed by YouTube Music. Open it to confirm the signed-in account.
                </p>
              </div>
            ) : null}
            </>
            ) : null}
          </div>
        </div>

        <div className={`lg:col-span-6 flex justify-center transition-all duration-150 ease-out ${uiHidden ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
          <div className="w-full max-w-xl transition-transform duration-150 ease-out">
            <Timer
              mode={timerMode}
              timeLeft={timeLeft}
              isActive={isTimerActive}
              activeMode={activeTimerMode}
              activeTimeLeft={activeTimeLeft}
              customDurations={customTimerDurations}
              onToggleTimer={onToggleTimer}
              onResetTimer={onResetTimer}
              onModeChange={onModeChange}
              onSetCustomDurations={onSetCustomTimerDurations}
              onSaveSettings={onSaveTimerSettings}
            />
          </div>
        </div>

        <div className={`lg:col-span-3 flex flex-col gap-4 transition-all duration-150 ease-out ${uiHidden ? "translate-x-8 opacity-0" : "translate-x-0 opacity-100"}`}>
          <StatCard
            label="Productivity Score"
            value={`${productivityScore}%`}
            subtext={productivityScore === 100 ? "Perfect!" : "Keep going!"}
            icon="bolt"
            accentColor={productivityScore >= 80 ? "green" : productivityScore >= 50 ? "yellow" : "red"}
          />
          <StatCard
            label="Overdue"
            value={overdueTasks.length}
            subtext={overdueTasks.length > 0 ? "Needs attention" : "All good!"}
            icon="warning"
            accentColor={overdueTasks.length > 0 ? "red" : "green"}
          />

          {/* Display today's scheduled tasks and due assignments in a checklist format */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/40 dark:border-slate-700/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Today&rsquo;s Checklist
            </h3>

            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Progress</span>
                <span>{checklistCompletedCount}/{checklistTotalCount} done</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${checklistProgressPercent}%` }}
                />
              </div>
            </div>

            {checklistError ? (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
                {checklistError}
              </p>
            ) : null}
            
            {todaysScheduledTasks.length === 0 && dueTodayTasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">No tasks or assignments for today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {/* Scheduled Tasks Section */}
                {todaysScheduledTasks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Scheduled
                    </p>
                    <div className="space-y-2">
                      {todaysScheduledTasks.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            disabled={togglingTaskId === item.taskId}
                            onChange={() => {
                              void handleChecklistToggle(item.taskId, item.completed);
                            }}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${item.completed ? "text-slate-600 dark:text-slate-300" : "text-slate-700 dark:text-slate-200"}`}>
                                {item.title}
                              </p>
                              {item.completed ? (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  Done
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {item.endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              {item.blockCount > 1 ? ` · ${item.blockCount} blocks` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Today Section */}
                {dueTodayTasks.length > 0 && (
                  <div>
                    {todaysScheduledTasks.length > 0 && <div className="border-t border-slate-200 dark:border-slate-600 my-3"></div>}
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Due Today
                    </p>
                    <div className="space-y-2">
                      {dueTodayTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition border border-amber-200/50 dark:border-amber-800/50">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            disabled={togglingTaskId === task.id}
                            onChange={() => {
                              void handleChecklistToggle(task.id, task.completed);
                            }}
                            className="mt-0.5 rounded border-amber-300 text-amber-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${task.completed ? "text-slate-600 dark:text-slate-300" : "text-slate-700 dark:text-slate-200"}`}>
                                {task.title}
                              </p>
                              {task.completed ? (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  Done
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formatDueTime(task.deadline)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {atmospherePanel ? (
        <div className={`w-full transition-all duration-500 ease-out ${uiHidden ? "translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}>
          {atmospherePanel}
        </div>
      ) : null}


    </div>
  );
}
