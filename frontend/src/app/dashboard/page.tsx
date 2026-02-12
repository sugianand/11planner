"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FocusDashboardPanel from "@/components/FocusDashboardPanel";
import Footer from "@/components/Footer";

type FocusBackground = {
  id: string;
  label: string;
  description: string;
  category: "All" | "Anime" | "Nature" | "Cafe" | "City" | "Abstract";
  videoUrl?: string;
  imageUrl?: string;
};

type Soundscape = {
  id: string;
  label: string;
  description: string;
  category: "All" | "Nature" | "Cafe" | "City" | "Anime" | "Abstract";
  audioUrl?: string;
};

const focusBackgrounds: FocusBackground[] = [
  {
    id: "default",
    label: "Default",
    description: "Standard app background used across all pages.",
    category: "All",
    videoUrl: "",
    imageUrl: "",
  },
  {
    id: "waterfall-forest",
    label: "Waterfall Forest",
    description: "Forest waterfall with steady motion.",
    category: "Nature",
    videoUrl: "/nature/37088-413229662_medium.mp4",
    imageUrl: "",
  },
  {
    id: "reeds-wind",
    label: "Reeds in Wind",
    description: "Reeds and grasses swaying softly.",
    category: "Nature",
    videoUrl: "/nature/152740-803732906_medium.mp4",
    imageUrl: "",
  },
  {
    id: "lotus-bloom",
    label: "Flower Bloom",
    description: "Flowering lotus on still water.",
    category: "Nature",
    videoUrl: "/nature/16111-269128115_medium.mp4",
    imageUrl: "",
  },
  {
    id: "forest-water-river",
    label: "Forest Water River",
    description: "Flowing forest river with soft reflections.",
    category: "Nature",
    videoUrl: "/nature/287-forest-water-river.mp4",
    imageUrl: "",
  },
  {
    id: "moving-through-forest",
    label: "Moving Through Forest",
    description: "A gentle walk through lush forest trails.",
    category: "Nature",
    videoUrl: "/nature/305-moving-through-forest.mp4",
    imageUrl: "",
  },
  {
    id: "mountains-clouds",
    label: "Mountains Clouds",
    description: "Rolling clouds over quiet mountain peaks.",
    category: "Nature",
    videoUrl: "/nature/346-mountains-clouds.mp4",
    imageUrl: "",
  },
  {
    id: "girl-coding-dark",
    label: "Girl Coding Dark",
    description: "Anime night coding with a moody glow.",
    category: "Anime",
    videoUrl: "/anime/270408-girl-coding-dark.mp4",
    imageUrl: "",
  },
  {
    id: "guy-music",
    label: "Guy Music",
    description: "Anime room with late-night music vibes.",
    category: "Anime",
    videoUrl: "/anime/267772-guy-music.mp4",
    imageUrl: "",
  },
  {
    id: "night-time-japan",
    label: "Night Time Japan",
    description: "Neon streets and midnight train glow.",
    category: "Anime",
    videoUrl: "/anime/247741-night-time-japan.mp4",
    imageUrl: "",
  },
  {
    id: "girl-studying-night",
    label: "Girl Studying Night",
    description: "Late-night study with rain-lit windows.",
    category: "Anime",
    videoUrl: "/anime/214500-girl-studying-night.mp4",
    imageUrl: "",
  },
  {
    id: "girl-studying-day",
    label: "Girl Studying Day",
    description: "Sunlit desk and calm study pace.",
    category: "Anime",
    videoUrl: "/anime/204056-girl-studying-day.mp4",
    imageUrl: "",
  },
  {
    id: "train-anime",
    label: "Train Anime",
    description: "Calm train ride with soft city glow.",
    category: "Anime",
    videoUrl: "/anime/904-train-anime.mp4",
    imageUrl: "",
  },
  {
    id: "moka-pot-leaves",
    label: "Moka Pot Leaves",
    description: "Steamy moka pot with a cozy cafe glow.",
    category: "Cafe",
    videoUrl: "/cafe/237-moka-pot-leaves.mp4",
    imageUrl: "",
  },
  {
    id: "espresso-beans-falling",
    label: "Espresso Beans Falling",
    description: "Fresh beans tumbling into the grinder.",
    category: "Cafe",
    videoUrl: "/cafe/401-espresso-beans-falling.mp4",
    imageUrl: "",
  },
  {
    id: "coffee-machine",
    label: "Coffee Machine",
    description: "Cafe machines humming in the background.",
    category: "Cafe",
    videoUrl: "/cafe/469-coffee-machine.mp4",
    imageUrl: "",
  },
  {
    id: "boiling-coffee",
    label: "Boiling Coffee",
    description: "Bubbling brew with rich aroma.",
    category: "Cafe",
    videoUrl: "/cafe/472-boiling-coffee.mp4",
    imageUrl: "",
  },
  {
    id: "coffee-hot-water",
    label: "Coffee with Hot Water",
    description: "Slow pour over with rising steam.",
    category: "Cafe",
    videoUrl: "/cafe/209-coffee-hot-water.mp4",
    imageUrl: "",
  },
  {
    id: "outside-cafe",
    label: "Outside Cafe",
    description: "Street-side cafe with warm ambience.",
    category: "Cafe",
    videoUrl: "/cafe/2174-outside-cafe.mp4",
    imageUrl: "",
  },
  {
    id: "speed-city",
    label: "Speed City",
    description: "Fast-paced city lights and motion blur.",
    category: "City",
    videoUrl: "/city/211-speed-city.mp4",
    imageUrl: "",
  },
  {
    id: "slow-skyscrapers",
    label: "Slow Skyscrapers",
    description: "Slow pan across towering city blocks.",
    category: "City",
    videoUrl: "/city/917-slow-skyscrapers.mp4",
    imageUrl: "",
  },
  {
    id: "speed-night-city-cars",
    label: "Speed Night City Cars",
    description: "Night traffic streaks through downtown.",
    category: "City",
    videoUrl: "/city/216-speed-night-city-cars.mp4",
    imageUrl: "",
  },
  {
    id: "eagle-drone-roundabout",
    label: "Eagle Drone Roundabout",
    description: "Aerial roundabout with sweeping motion.",
    category: "City",
    videoUrl: "/city/233-eagle-drone-roundabout.mp4",
    imageUrl: "",
  },
  {
    id: "slow-evening-highway",
    label: "Slow Evening Highway",
    description: "Evening highway flow with steady lights.",
    category: "City",
    videoUrl: "/city/277-slow-evening-highway-cars.mp4",
    imageUrl: "",
  },
  {
    id: "new-york-highways",
    label: "New York City Highways",
    description: "Urban skyline with looping highways.",
    category: "City",
    videoUrl: "/city/296-new-york-city-highways.mp4",
    imageUrl: "",
  },
  {
    id: "blue-lines",
    label: "Blue Lines",
    description: "Cool blue lines flowing in the dark.",
    category: "Abstract",
    videoUrl: "/abstract/626-blue-lines.mp4",
    imageUrl: "",
  },
  {
    id: "orange-leaves-motion",
    label: "Orange Leaves Motion",
    description: "Warm leaves drifting in slow motion.",
    category: "Abstract",
    videoUrl: "/abstract/145-orange-leaves-motion.mp4",
    imageUrl: "",
  },
  {
    id: "particles-plexus-network",
    label: "Particles Plexus Network",
    description: "Glowing particles connecting in motion.",
    category: "Abstract",
    videoUrl: "/abstract/276-particles-plexus-network.mp4",
    imageUrl: "",
  },
  {
    id: "ink-water-underwater",
    label: "Ink Water Underwater",
    description: "Ink blooms drifting underwater.",
    category: "Abstract",
    videoUrl: "/abstract/673-ink-water-underwater.mp4",
    imageUrl: "",
  },
  {
    id: "pink-ink-paint",
    label: "Pink Ink Paint",
    description: "Pink ink swirling in liquid.",
    category: "Abstract",
    videoUrl: "/abstract/910-pink-ink-paint.mp4",
    imageUrl: "",
  },
  {
    id: "sea-waves-reflection",
    label: "Sea Waves Reflection",
    description: "Shimmering waves and soft reflections.",
    category: "Abstract",
    videoUrl: "/abstract/215-sea-waves-reflection.mp4",
    imageUrl: "",
  },
];

const backgroundCategories: FocusBackground["category"][] = [
  "All",
  "Nature",
  "Cafe",
  "City",
  "Anime",
  "Abstract",
];

const soundscapes: Soundscape[] = [
  {
    id: "rain",
    label: "Soft Rain",
    description: "Calming rain with distant thunder.",
    category: "All",
    audioUrl: "",
  },
  {
    id: "cafe",
    label: "Cafe Hum",
    description: "Low chatter and espresso steam.",
    category: "Cafe",
    audioUrl: "",
  },
  {
    id: "forest",
    label: "Forest Night",
    description: "Crickets and light wind.",
    category: "Nature",
    audioUrl: "",
  },
  {
    id: "city-rumble",
    label: "City Rumble",
    description: "Distant traffic and night air.",
    category: "City",
    audioUrl: "",
  },
  {
    id: "cinematic-drone",
    label: "Cinematic Drone",
    description: "Low strings with soft tension.",
    category: "Movies",
    audioUrl: "",
  },
];

const soundCategories: Soundscape["category"][] = [
  "All",
  "Nature",
  "Cafe",
  "City",
  "Anime",
  "Abstract",
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"backgrounds" | "sounds">("backgrounds");
  const [backgroundId, setBackgroundId] = useState(focusBackgrounds[0]?.id ?? "");
  const [soundId, setSoundId] = useState(soundscapes[0]?.id ?? "");
  const [activeBackgroundCategory, setActiveBackgroundCategory] = useState<FocusBackground["category"]>(
    "All"
  );
  const [activeSoundCategory, setActiveSoundCategory] = useState<Soundscape["category"]>(
    "All"
  );
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState(false);
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [isUiTransparent, setIsUiTransparent] = useState(false);
  const [showMiniTimer, setShowMiniTimer] = useState(false);
  const [timerPosition, setTimerPosition] = useState({ x: 32, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [timerMode, setTimerMode] = useState<"pomodoro" | "shortBreak" | "longBreak">("pomodoro");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [videoError, setVideoError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - timerPosition.x,
      y: e.clientY - timerPosition.y,
    });
  };

  useEffect(() => {
    setTimerPosition({ x: 32, y: window.innerHeight - 400 });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setTimerPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const timerModes = {
    pomodoro: { label: "Focus", minutes: 25 },
    shortBreak: { label: "Short Break", minutes: 5 },
    longBreak: { label: "Long Break", minutes: 15 },
  };

  useEffect(() => {
    setTimeLeft(timerModes[timerMode].minutes * 60);
    setIsTimerActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [timerMode]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerActive, timeLeft]);

  const toggleMiniTimer = () => setIsTimerActive(!isTimerActive);
  const resetMiniTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(timerModes[timerMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeBackground = useMemo(
    () => focusBackgrounds.find((scene) => scene.id === backgroundId) ?? focusBackgrounds[0],
    [backgroundId]
  );

  const activeSound = useMemo(
    () => soundscapes.find((scene) => scene.id === soundId) ?? soundscapes[0],
    [soundId]
  );

  const filteredBackgrounds = useMemo(() => {
    if (activeBackgroundCategory === "All") {
      return focusBackgrounds;
    }
    return focusBackgrounds.filter((scene) => scene.category === activeBackgroundCategory);
  }, [activeBackgroundCategory]);

  const filteredSoundscapes = useMemo(() => {
    if (activeSoundCategory === "All") {
      return soundscapes;
    }
    return soundscapes.filter((scene) => scene.category === activeSoundCategory);
  }, [activeSoundCategory]);

  useEffect(() => {
    setVideoError(false);
  }, [activeBackground?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!activeSound?.audioUrl) {
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(activeSound.audioUrl);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    setIsPlaying(false);

    return () => {
      audio.pause();
    };
  }, [activeSound?.audioUrl, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayback = async () => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const hasAudio = Boolean(activeSound?.audioUrl);

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 p-6 lg:p-10 flex flex-col gap-8">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>
      <div className="fixed inset-0 -z-10 bg-white/15 dark:bg-slate-950/55" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
      </div>

      {videoError && (
        <div className="fixed bottom-6 right-6 z-20 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 text-xs px-3 py-2 rounded-full shadow">
          Video failed to load: {activeBackground?.videoUrl}
        </div>
      )}

      {isUiHidden && (
        <>
          <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
            <button
              onClick={() => setShowMiniTimer((prev) => !prev)}
              className="rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 p-3 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition"
              title="Toggle Mini Timer"
            >
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">timer</span>
            </button>
            <div className="rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 px-4 py-2 shadow-lg">
              <button
                onClick={() => setIsUiHidden(false)}
                className="text-sm font-semibold px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                Show UI
              </button>
            </div>
          </div>

          {showMiniTimer && (
            <div
              className="fixed z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 rounded-3xl p-4 shadow-lg w-48 cursor-move select-none"
              style={{
                left: `${timerPosition.x}px`,
                top: `${timerPosition.y}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{timerModes[timerMode].label}{timerMode === "pomodoro" ? " Session" : ""}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatTime(timeLeft)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetMiniTimer}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-700 dark:text-slate-200">restart_alt</span>
                  </button>
                  <button
                    onClick={toggleMiniTimer}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-700 transition"
                  >
                    <span className="material-symbols-outlined text-xl text-white fill-current">{isTimerActive ? "pause" : "play_arrow"}</span>
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-700 dark:text-slate-200">settings</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                  <button
                    onClick={() => setTimerMode("pomodoro")}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-full transition ${timerMode === "pomodoro" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"}`}
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => setTimerMode("shortBreak")}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-full transition ${timerMode === "shortBreak" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"}`}
                  >
                    Short
                  </button>
                  <button
                    onClick={() => setTimerMode("longBreak")}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-full transition ${timerMode === "longBreak" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"}`}
                  >
                    Long
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!isUiHidden && (
        <div className={`${isUiTransparent ? "opacity-70" : "opacity-100"} transition-opacity duration-300`}>
          <FocusDashboardPanel />
        </div>
      )}
      <Footer />
    </div>
  );
}
