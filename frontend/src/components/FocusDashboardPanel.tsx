"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import { taskAPI } from "@/lib/api";
import Link from "next/link";
import Timer from "@/components/Dashboard/Timer";
import StatCard from "@/components/Dashboard/StatCard";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

type YouTubeTrack = {
  title: string;
  artist: string;
  duration: string;
  youtubeId: string;
  searchQuery: string;
};

type AppleTrack = {
  trackName: string;
  artistName: string;
  previewUrl: string;
  trackViewUrl: string;
  artworkUrl100?: string;
};

type AppleMood = "lofi-beats" | "deep-focus" | "ambient-study";
type YouTubeMood = "lofi" | "synthwave" | "coding";

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
    loadTasks,
    loadAssignments,
    loadScheduleBlocks,
  } = usePlanner();

  const [spotifyPlaylist, setSpotifyPlaylist] = useState("0vvXsWCC9xrXsKd4FyS8kM"); // Default to Lofi Girl
  const [musicProvider, setMusicProvider] = useState("spotify"); // 'spotify', 'youtube'
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyConnecting, setSpotifyConnecting] = useState(false);
  const [spotifyAccessToken, setSpotifyAccessToken] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const [appleTracks, setAppleTracks] = useState<AppleTrack[]>([]);
  const [activeAppleIndex, setActiveAppleIndex] = useState(0);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleError, setAppleError] = useState("");
  const [appleMood, setAppleMood] = useState<AppleMood>("lofi-beats");
  const [youtubeMood, setYoutubeMood] = useState<YouTubeMood>("lofi");
  const [privacyPersonalizationEnabled, setPrivacyPersonalizationEnabled] = useState(true);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
  const youtubeTracks: YouTubeTrack[] = [
    {
      title: "Deep Focus Lofi",
      artist: "Lofi Girl",
      duration: "Live",
      youtubeId: "jfKfPfyJRdk",
      searchQuery: "lofi beats",
    },
    {
      title: "Synthwave Radio",
      artist: "Lofi Geek",
      duration: "Live",
      youtubeId: "4xDzrJKXOOY",
      searchQuery: "synthwave focus",
    },
    {
      title: "Coding Mix",
      artist: "Chill Music Lab",
      duration: "1:02:10",
      youtubeId: "n61ULEU7CO0",
      searchQuery: "coding lofi mix",
    },
  ];
  const [activeYoutubeIndex, setActiveYoutubeIndex] = useState(0);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(false);

  const appleMoodQueryMap: Record<AppleMood, string> = {
    "lofi-beats": "lofi beats",
    "deep-focus": "deep focus instrumental",
    "ambient-study": "ambient study",
  };

  const appleMoodLabelMap: Record<AppleMood, string> = {
    "lofi-beats": "Lofi Beats",
    "deep-focus": "Deep Focus",
    "ambient-study": "Ambient Study",
  };

  const providerSiteMap: Record<string, string> = {
    spotify: "https://accounts.spotify.com/en/login",
    apple: "https://music.apple.com/",
    youtube: "https://music.youtube.com/",
  };

  const toBase64Url = (bytes: Uint8Array) => {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const createPkceChallenge = async (verifier: string) => {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toBase64Url(new Uint8Array(digest));
  };

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

  const connectAppleInPopup = () => {
    setConnectMessage("");
    const popup = window.open("https://music.apple.com/", "apple-connect", "popup=yes,width=520,height=760");
    if (!popup) {
      setConnectMessage("Popup was blocked. Allow popups and try again.");
      return;
    }
    popup.focus();
  };

  const handleProviderConnect = () => {
    if (musicProvider === "spotify") {
      void startSpotifyPopupConnect();
      return;
    }
    window.open(providerSiteMap.youtube, "youtube-connect", "popup=yes,width=520,height=760");
  };

  useEffect(() => {
    if (musicProvider === "apple") {
      setMusicProvider("spotify");
    }
  }, [musicProvider]);

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
    if (musicProvider !== "apple") {
      return;
    }

    let isMounted = true;
    const loadApplePreviews = async () => {
      setAppleLoading(true);
      setAppleError("");
      try {
        const query = appleMoodQueryMap[appleMood];
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=8`);
        const data = await response.json();
        const tracks = (data?.results || [])
          .filter((item: AppleTrack) => item.previewUrl && item.trackViewUrl)
          .map((item: AppleTrack) => ({
            trackName: item.trackName,
            artistName: item.artistName,
            previewUrl: item.previewUrl,
            trackViewUrl: item.trackViewUrl,
            artworkUrl100: item.artworkUrl100,
          })) as AppleTrack[];

        if (isMounted) {
          setAppleTracks(tracks);
          setActiveAppleIndex(0);
          if (tracks.length === 0) {
            setAppleError("No preview tracks found right now.");
          }
        }
      } catch {
        if (isMounted) {
          setAppleError("Could not load Apple previews. Use Open Apple Music instead.");
        }
      } finally {
        if (isMounted) {
          setAppleLoading(false);
        }
      }
    };

    void loadApplePreviews();
    return () => {
      isMounted = false;
    };
  }, [musicProvider, appleMood]);

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
        setSpotifyAccessToken(tokenData.access_token ?? null);
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

  // Get today's tasks and assignments for the checklist sidebar
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter schedule blocks for today
  const todaysScheduleBlocks = scheduleBlocks.filter((block) => {
    const blockDate = new Date(block.start_time);
    blockDate.setHours(0, 0, 0, 0);
    return blockDate.getTime() === today.getTime();
  });

  // Map blocks to task details with timing info
  const todaysScheduledTasks = todaysScheduleBlocks.map((block) => {
    const task = tasks.find((t) => t.id === block.task_id);
    return {
      id: block.id,
      taskId: block.task_id,
      title: task?.title || "Untitled Task",
      startTime: new Date(block.start_time),
      endTime: new Date(block.end_time),
      completed: task?.completed || false,
    };
  });

  const dueTodayTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline.getTime() === today.getTime();
  });

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

  const activeSpotifyPlaylistUrl = `https://open.spotify.com/playlist/${spotifyPlaylist}`;
  const isConnectedForActiveProvider = musicProvider === "spotify" ? spotifyConnected : false;
  const activeYoutubeTrack = youtubeTracks[activeYoutubeIndex];
  const activeAppleTrack = appleTracks[activeAppleIndex];

  const youtubeEmbedSrc = `https://www.youtube.com/embed/${activeYoutubeTrack.youtubeId}?autoplay=${isYoutubePlaying ? 1 : 0}&controls=1&rel=0&modestbranding=1`;
  const activeYouTubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(activeYoutubeTrack.searchQuery)}`;

  const handleYouTubePrev = () => {
    setActiveYoutubeIndex((prev) => (prev - 1 + youtubeTracks.length) % youtubeTracks.length);
    setIsYoutubePlaying(true);
  };

  const handleYouTubeNext = () => {
    setActiveYoutubeIndex((prev) => (prev + 1) % youtubeTracks.length);
    setIsYoutubePlaying(true);
  };

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
            accentColor="indigo"
          />

          {/* Music Player Panel */}
          <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/40 dark:border-slate-700/40 mt-2 transition-[min-height] duration-200 ${isMusicOpen ? "" : "min-h-[110px]"}`}>
            <div className={`mb-3 items-center px-2 py-2 ${isMusicOpen ? "grid grid-cols-[auto_1fr_auto] gap-2" : "flex justify-between"}`}>
              <h3 className="text-sm font-semibold tracking-normal text-slate-500 dark:text-slate-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">headphones</span>
                Focus Music
              </h3>

              {isMusicOpen ? (
                <div className="flex items-center justify-center gap-2">
                  {musicProvider === 'spotify' && (
                    <select 
                      className="text-xs bg-transparent border-none text-slate-500 dark:text-slate-400 focus:ring-0 cursor-pointer outline-none font-medium p-0"
                      value={spotifyPlaylist}
                      onChange={(e) => setSpotifyPlaylist(e.target.value)}
                    >
                      <option value="0vvXsWCC9xrXsKd4FyS8kM">Lofi Beats</option>
                      <option value="37i9dQZF1DWZeKCadgRdKQ">Deep Focus</option>
                      <option value="37i9dQZF1DX8CwnimMFF76">Ambient</option>
                    </select>
                  )}
                  {musicProvider === 'youtube' && (
                    <select
                      className="text-xs bg-transparent border-none text-slate-500 dark:text-slate-400 focus:ring-0 cursor-pointer outline-none font-medium p-0"
                      value={youtubeMood}
                      onChange={(e) => setYoutubeMood(e.target.value as YouTubeMood)}
                    >
                      <option value="lofi">Lofi Beats</option>
                      <option value="synthwave">Synthwave</option>
                      <option value="coding">Coding Mix</option>
                    </select>
                  )}
                  <select 
                    className="text-xs bg-slate-100 dark:bg-slate-700 rounded-md px-2 py-1 border-none text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none font-bold"
                    value={musicProvider}
                    onChange={(e) => setMusicProvider(e.target.value)}
                  >
                    <option value="spotify">Spotify</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              ) : null}

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
                className="h-7 min-w-[64px] rounded-full border border-slate-300 px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isMusicOpen ? "Hide" : "Show"}
              </button>
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
                    {/* Open Spotify login screen */}
                    <a
                      href="https://accounts.spotify.com/login"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Open Spotify
                    </a>
                  </div>
                </div>
              )}
              {musicProvider === 'apple' && (
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-[#f7f8fb] via-[#f4f2f8] to-[#fbecef] p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white">A</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Apple Music</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Listen Now · {appleMoodLabelMap[appleMood]}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-300 bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Preview
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">Focus</span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">Chill</span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">Instrumental</span>
                  </div>

                  {appleLoading ? (
                    <div className="mb-4 rounded-xl border border-white/80 bg-white/80 p-4 text-xs text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                      Loading Apple previews...
                    </div>
                  ) : null}

                  {!appleLoading && activeAppleTrack ? (
                    <div className="mb-4 rounded-xl border border-white/80 bg-white/85 p-3 shadow-sm dark:border-slate-600 dark:bg-slate-900/50">
                      <div className="mb-3 flex items-center gap-3">
                        {activeAppleTrack.artworkUrl100 ? (
                          <img
                            src={activeAppleTrack.artworkUrl100}
                            alt={activeAppleTrack.trackName}
                            className="h-12 w-12 rounded-lg object-cover ring-1 ring-black/5"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{activeAppleTrack.trackName}</p>
                          <p className="truncate text-xs text-slate-600 dark:text-slate-300">{activeAppleTrack.artistName}</p>
                        </div>
                      </div>
                      <audio
                        key={activeAppleTrack.previewUrl}
                        controls
                        preload="none"
                        className="w-full"
                        src={activeAppleTrack.previewUrl}
                      />
                    </div>
                  ) : null}

                  {!appleLoading && appleTracks.length > 0 ? (
                    <div className="mb-4 min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-white/80 bg-white/85 p-2 shadow-sm dark:border-slate-600 dark:bg-slate-900/50">
                      {appleTracks.map((track, idx) => (
                        <button
                          key={`${track.trackName}-${track.artistName}-${idx}`}
                          type="button"
                          onClick={() => setActiveAppleIndex(idx)}
                          className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs transition ${idx === activeAppleIndex ? "bg-rose-100 text-slate-900 dark:bg-slate-700 dark:text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                          <span className="truncate">{track.trackName}</span>
                          <span className="ml-2 truncate text-slate-500">{track.artistName}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {appleError ? (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      {appleError}
                    </div>
                  ) : null}

                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={connectAppleInPopup}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Connect Apple
                    </button>
                    <a
                      href={activeAppleTrack?.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(appleMoodQueryMap[appleMood])}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open Apple Music
                    </a>
                    <a
                      href={`https://music.apple.com/us/search?term=${encodeURIComponent(appleMoodQueryMap[appleMood])}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Open In Browser
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
                {/* YouTube Music login - opens in new tab */}
                <a
                  href="https://accounts.google.com/signin"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Connect YouTube
                </a>
                <a
                  href="https://music.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Open YouTube Music
                </a>
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
              Today's Checklist
            </h3>
            
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
                            disabled={updatingTaskIds.has(item.taskId)}
                            onChange={async () => {
                              setUpdatingTaskIds(prev => new Set(prev).add(item.taskId));
                              try {
                                await taskAPI.update(item.taskId, { completed: !item.completed });
                                await loadTasks();
                              } catch (error) {
                                console.error("Failed to update task:", error);
                              } finally {
                                setUpdatingTaskIds(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(item.taskId);
                                  return newSet;
                                });
                              }
                            }}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {item.endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
                            disabled={updatingTaskIds.has(task.id)}
                            onChange={async () => {
                              setUpdatingTaskIds(prev => new Set(prev).add(task.id));
                              try {
                                await taskAPI.update(task.id, { completed: !task.completed });
                                await loadTasks();
                              } catch (error) {
                                console.error("Failed to update task:", error);
                              } finally {
                                setUpdatingTaskIds(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(task.id);
                                  return newSet;
                                });
                              }
                            }}
                            className="mt-0.5 rounded border-amber-300 text-amber-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {new Date(task.deadline).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
