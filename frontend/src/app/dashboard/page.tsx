"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FocusDashboardPanel from "@/components/FocusDashboardPanel";
import Footer from "@/components/Footer";

type AtmosphereCategory = "All" | "Anime" | "Nature" | "Cafe" | "City" | "Abstract";

type FocusBackground = {
  id: string;
  label: string;
  description: string;
  category: AtmosphereCategory;
  videoUrl?: string;
  imageUrl?: string;
};

type SoundCategory =
  | "All"
  | "Ambiance"
  | "Workspace"
  | "Nature Sounds"
  | "Weather"
  | "Urban"
  | "Brainwaves"
  | "Noise";

type Soundscape = {
  id: string;
  label: string;
  description: string;
  category: SoundCategory;
  engine:
  | "none"
  | "rain"
  | "cafe"
  | "forest"
  | "city"
  | "cinematic"
  | "lofi"
  | "abstract"
  | "whiteNoise"
  | "pinkNoise"
  | "brownNoise";
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

const atmosphereCategories: AtmosphereCategory[] = [
  "All",
  "Nature",
  "Cafe",
  "City",
  "Anime",
  "Abstract",
];

const backgroundCategories: FocusBackground["category"][] = atmosphereCategories;

const soundscapes: Soundscape[] = [
  {
    id: "no-sound",
    label: "No Sound",
    description: "Silence mode. Stops any currently playing audio.",
    category: "All",
    engine: "none",
  },
  {
    id: "delta-waves",
    label: "Delta Waves",
    description: "Deep slow pulse intended for calm grounding.",
    category: "Brainwaves",
    engine: "cinematic",
  },
  {
    id: "rain",
    label: "Rain",
    description: "Steady rain with soft broadband masking.",
    category: "Weather",
    engine: "rain",
    audioUrl: "/sounds/weather/rain.mp3",
  },
  {
    id: "theta-waves",
    label: "Theta Waves",
    description: "Soft low-frequency flow for reflective work blocks.",
    category: "Brainwaves",
    engine: "cinematic",
    audioUrl: "/sounds/brainwaves/theta-waves.mp3",
  },
  {
    id: "cafe",
    label: "Cafe",
    description: "Coffeehouse crowd and espresso-room energy.",
    category: "Ambiance",
    engine: "cafe",
    audioUrl: "/sounds/ambiance/cafe.mp3",
  },
  {
    id: "fireplace",
    label: "Fireplace",
    description: "Warm crackle-like bed with low cozy warmth.",
    category: "Ambiance",
    engine: "brownNoise",
    audioUrl: "/sounds/ambiance/fireplace.mp3",
  },
  {
    id: "lava",
    label: "Lava",
    description: "Dense molten-style drone with slow motion.",
    category: "Ambiance",
    engine: "abstract",
    audioUrl: "/sounds/ambiance/lava.mp3",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Wide surf-like wash with soft rolling highs.",
    category: "Nature Sounds",
    engine: "rain",
    audioUrl: "/sounds/nature/ocean-waves-richard.mp3",
  },
  {
    id: "keyboard-typing",
    label: "Keyboard Typing",
    description: "Office typing layer blended with subtle room tone.",
    category: "Workspace",
    engine: "cafe",
    audioUrl: "/sounds/workspace/keyboard-typing.mp3",
  },
  {
    id: "design-lab",
    label: "Design Lab",
    description: "Modern studio-like ambience with light synth focus.",
    category: "Workspace",
    engine: "lofi",
    audioUrl: "/sounds/workspace/design-lab.mp3",
  },
  {
    id: "office",
    label: "Office",
    description: "Low office hum and conversational room texture.",
    category: "Workspace",
    engine: "cafe",
    audioUrl: "/sounds/workspace/office.mp3",
  },
  {
    id: "wind-chimes",
    label: "Wind Chimes",
    description: "Delicate bright tones with gentle airy motion.",
    category: "Nature Sounds",
    engine: "abstract",
    audioUrl: "/sounds/nature/wind-chimes.mp3",
  },
  {
    id: "city-rooftop",
    label: "City Rooftop",
    description: "Distant skyline rumble from above street level.",
    category: "Urban",
    engine: "city",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Soft dinner-room chatter and table ambience.",
    category: "Ambiance",
    engine: "cafe",
    audioUrl: "/sounds/ambiance/restaurant.mp3",
  },
  {
    id: "street",
    label: "Street",
    description: "Open-air road noise with passing movement.",
    category: "Urban",
    engine: "city",
  },
  {
    id: "park",
    label: "Park",
    description: "Open green-space ambience with light natural movement.",
    category: "Nature Sounds",
    engine: "forest",
  },
  {
    id: "jungle",
    label: "Jungle",
    description: "Dense forest atmosphere with layered natural texture.",
    category: "Nature Sounds",
    engine: "forest",
    audioUrl: "/sounds/nature/jungle.mp3",
  },
  {
    id: "lake-pier",
    label: "Lake Pier",
    description: "Still-water mood with faint wind and soft wildlife.",
    category: "Nature Sounds",
    engine: "forest",
    audioUrl: "/sounds/nature/lake-pier.mp3",
  },
  {
    id: "rain-car-roof",
    label: "Rain Car Roof",
    description: "Closer rain texture with enclosed-space dampening.",
    category: "Weather",
    engine: "rain",
    audioUrl: "/sounds/weather/rain-car-roof.mp3",
  },
  {
    id: "splatty-rain",
    label: "Splatty Rain",
    description: "Sharper droplet impacts mixed into rainfall noise.",
    category: "Weather",
    engine: "rain",
    audioUrl: "/sounds/weather/splatty-rain.mp3",
  },
  {
    id: "outer-space",
    label: "Outer Space",
    description: "Wide sparse tonal bed with sci-fi ambience.",
    category: "Ambiance",
    engine: "abstract",
    audioUrl: "/sounds/ambiance/outer-space.mp3",
  },
  {
    id: "birds-chirping",
    label: "Birds Chirping",
    description: "Light high chirp-like texture over natural bed.",
    category: "Nature Sounds",
    engine: "forest",
    audioUrl: "/sounds/nature/birds-chirping.mp3",
  },
  {
    id: "white-noise",
    label: "White Noise",
    description: "Flat-spectrum masking noise for concentration.",
    category: "Noise",
    engine: "whiteNoise",
    audioUrl: "/sounds/noise/white-noise.mp3",
  },
  {
    id: "beta-waves",
    label: "Beta Waves",
    description: "Slightly brighter pulse for alert, active focus.",
    category: "Brainwaves",
    engine: "lofi",
    audioUrl: "/sounds/brainwaves/beta-waves.mp3",
  },
  {
    id: "brown-noise",
    label: "Brown Noise",
    description: "Deep low-frequency weighted noise bed.",
    category: "Noise",
    engine: "brownNoise",
    audioUrl: "/sounds/noise/brown-noise.mp3",
  },
  {
    id: "pink-noise",
    label: "Pink Noise",
    description: "Balanced low-high shaped noise for long sessions.",
    category: "Noise",
    engine: "pinkNoise",
    audioUrl: "/sounds/noise/pink-noise.mp3",
  },
  {
    id: "gray-noise",
    label: "Gray Noise",
    description: "Equal-loudness style masking profile across frequencies.",
    category: "Noise",
    engine: "pinkNoise",
    audioUrl: "/sounds/noise/gray-noise.mp3",
  },
  {
    id: "blue-noise",
    label: "Blue Noise",
    description: "Higher-frequency weighted hiss for crisp masking.",
    category: "Noise",
    engine: "whiteNoise",
    audioUrl: "/sounds/noise/blue-noise.mp3",
  },
  {
    id: "alpha-waves",
    label: "Alpha Waves",
    description: "Relaxed mid-range pulse for steady concentration.",
    category: "Brainwaves",
    engine: "lofi",
    audioUrl: "/sounds/brainwaves/alpha-waves.mp3",
  },
  {
    id: "gamma-waves",
    label: "Gamma Waves",
    description: "Higher-energy tonal bed for intensive focus bursts.",
    category: "Brainwaves",
    engine: "cinematic",
    audioUrl: "/sounds/brainwaves/gamma-waves.mp3",
  },
  {
    id: "thunderstorm",
    label: "Thunderstorm",
    description: "Heavy storm atmosphere with deeper rumble feel.",
    category: "Weather",
    engine: "rain",
    audioUrl: "/sounds/weather/thunderstorm.mp3",
  },
];

const soundCategories: SoundCategory[] = [
  "All",
  "Ambiance",
  "Workspace",
  "Nature Sounds",
  "Weather",
  "Urban",
  "Brainwaves",
  "Noise",
];

const soundCategoryIcons: Record<SoundCategory, string> = {
  All: "\u{1F3A7}",
  Ambiance: "\u2728",
  Workspace: "\u{1F4BB}",
  "Nature Sounds": "\u{1F33F}",
  Weather: "\u{1F327}\uFE0F",
  Urban: "\u{1F3D9}\uFE0F",
  Brainwaves: "\u{1F9E0}",
  Noise: "\u3030\uFE0F",
};

const soundIconsById: Record<string, string> = {
  "no-sound": "\u{1F507}",
  "delta-waves": "\u{1F30A}",
  rain: "\u{1F327}\uFE0F",
  "theta-waves": "\u{1F9E0}",
  cafe: "\u2615",
  fireplace: "\u{1F525}",
  lava: "\u{1F30B}",
  ocean: "\u{1F30A}",
  "keyboard-typing": "\u2328\uFE0F",
  "design-lab": "\u{1F9EA}",
  office: "\u{1F3E2}",
  "wind-chimes": "\u{1F390}",
  "city-rooftop": "\u{1F3D9}\uFE0F",
  restaurant: "\u{1F37D}\uFE0F",
  street: "\u{1F695}",
  park: "\u{1F333}",
  jungle: "\u{1F334}",
  "lake-pier": "\u{1F6F6}",
  "rain-car-roof": "\u{1F697}",
  "splatty-rain": "\u26C8\uFE0F",
  "outer-space": "\u{1F680}",
  "birds-chirping": "\u{1F426}",
  "white-noise": "\u{1F90D}",
  "gray-noise": "\u25FD",
  "blue-noise": "\u{1F499}",
  "beta-waves": "\u{1F30A}",
  "brown-noise": "\u{1F90E}",
  "pink-noise": "\u{1F497}",
  "alpha-waves": "\u{1F30A}",
  "gamma-waves": "\u{1F30A}",
  thunderstorm: "\u26C8\uFE0F",
};

const timerModes = {
  pomodoro: { label: "Focus", minutes: 25 },
  shortBreak: { label: "Short Break", minutes: 5 },
  longBreak: { label: "Long Break", minutes: 15 },
} as const;

type TimerMode = keyof typeof timerModes;

const getInitialTimerPosition = () => ({
  x: 32,
  y: typeof window === "undefined" ? 100 : Math.max(24, window.innerHeight - 400),
});

const createNoiseBuffer = (
  audioContext: AudioContext,
  color: "white" | "pink" | "brown"
): AudioBuffer => {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * 2;
  const noiseBuffer = audioContext.createBuffer(1, length, sampleRate);
  const data = noiseBuffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  if (color === "brown") {
    let lastOut = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return noiseBuffer;
  }

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return noiseBuffer;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"backgrounds" | "sounds">("backgrounds");
  const [backgroundId, setBackgroundId] = useState(focusBackgrounds[0]?.id ?? "");
  const [soundId, setSoundId] = useState(
    soundscapes.find((scene) => scene.id === "ambiance")?.id ?? soundscapes[0]?.id ?? ""
  );
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
  const [timerPosition, setTimerPosition] = useState(getInitialTimerPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(timerModes.pomodoro.minutes * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [videoError, setVideoError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedAudioRef = useRef<{
    context: AudioContext;
    masterGain: GainNode;
    stop: () => void;
  } | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackRequestRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - timerPosition.x,
      y: e.clientY - timerPosition.y,
    });
  };

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

  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isTimerActive) {
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimerInterval();
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval, isTimerActive]);

  const stopPlayback = useCallback(async (syncState: boolean = true) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (generatedAudioRef.current) {
      generatedAudioRef.current.stop();
      await generatedAudioRef.current.context.close().catch(() => undefined);
      generatedAudioRef.current = null;
    }

    if (syncState) {
      setIsPlaying(false);
    }
  }, []);

  const createGeneratedSound = useCallback(
    (engine: Soundscape["engine"], nextVolume: number) => {
      const AudioContextCtor =
        window.AudioContext
        ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }

      const context = new AudioContextCtor();
      const masterGain = context.createGain();
      masterGain.gain.value = nextVolume;
      masterGain.connect(context.destination);
      const stopCallbacks: Array<() => void> = [];

      const addNoiseLayer = (
        color: "white" | "pink" | "brown",
        gainValue: number,
        filterType?: BiquadFilterType,
        filterFrequency?: number
      ) => {
        const source = context.createBufferSource();
        source.buffer = createNoiseBuffer(context, color);
        source.loop = true;

        const gainNode = context.createGain();
        gainNode.gain.value = gainValue;
        source.connect(gainNode);

        let finalNode: AudioNode = gainNode;
        let filterNode: BiquadFilterNode | null = null;

        if (filterType && filterFrequency) {
          filterNode = context.createBiquadFilter();
          filterNode.type = filterType;
          filterNode.frequency.value = filterFrequency;
          gainNode.connect(filterNode);
          finalNode = filterNode;
        }

        finalNode.connect(masterGain);
        source.start();

        stopCallbacks.push(() => {
          try {
            source.stop();
          } catch {
            // no-op: source may already be stopped
          }
          source.disconnect();
          gainNode.disconnect();
          filterNode?.disconnect();
        });
      };

      const addToneLayer = (
        type: OscillatorType,
        frequency: number,
        gainValue: number,
        detune: number = 0
      ) => {
        const oscillator = context.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.detune.value = detune;

        const gainNode = context.createGain();
        gainNode.gain.value = gainValue;

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        oscillator.start();

        stopCallbacks.push(() => {
          try {
            oscillator.stop();
          } catch {
            // no-op: source may already be stopped
          }
          oscillator.disconnect();
          gainNode.disconnect();
        });

        return oscillator;
      };

      switch (engine) {
        case "rain":
          addNoiseLayer("pink", 0.3, "lowpass", 1200);
          addNoiseLayer("white", 0.05, "highpass", 2500);
          break;
        case "cafe":
          addNoiseLayer("brown", 0.12, "lowpass", 900);
          addNoiseLayer("white", 0.03, "bandpass", 1800);
          addToneLayer("sine", 140, 0.01);
          break;
        case "forest": {
          addNoiseLayer("pink", 0.16, "highpass", 550);
          const chirp = addToneLayer("sine", 1150, 0.003);
          const chirpLfo = context.createOscillator();
          const chirpDepth = context.createGain();
          chirpLfo.frequency.value = 0.25;
          chirpDepth.gain.value = 120;
          chirpLfo.connect(chirpDepth);
          chirpDepth.connect(chirp.frequency);
          chirpLfo.start();
          stopCallbacks.push(() => {
            try {
              chirpLfo.stop();
            } catch {
              // no-op: source may already be stopped
            }
            chirpLfo.disconnect();
            chirpDepth.disconnect();
          });
          break;
        }
        case "city":
          addNoiseLayer("brown", 0.2, "lowpass", 280);
          addToneLayer("sawtooth", 55, 0.016);
          addToneLayer("sine", 85, 0.01);
          break;
        case "cinematic": {
          addToneLayer("sawtooth", 48, 0.03);
          addToneLayer("sine", 72, 0.018);
          const swellLfo = context.createOscillator();
          const swellDepth = context.createGain();
          swellLfo.frequency.value = 0.08;
          swellDepth.gain.value = 0.04;
          swellLfo.connect(swellDepth);
          swellDepth.connect(masterGain.gain);
          swellLfo.start();
          stopCallbacks.push(() => {
            try {
              swellLfo.stop();
            } catch {
              // no-op: source may already be stopped
            }
            swellLfo.disconnect();
            swellDepth.disconnect();
          });
          break;
        }
        case "lofi":
          addNoiseLayer("brown", 0.08, "highpass", 320);
          addToneLayer("triangle", 220, 0.012);
          addToneLayer("sine", 440, 0.006);
          break;
        case "abstract":
          addToneLayer("sine", 320, 0.02);
          addToneLayer("triangle", 640, 0.01);
          addNoiseLayer("white", 0.015, "highpass", 1800);
          break;
        case "whiteNoise":
          addNoiseLayer("white", 0.22, "highpass", 60);
          break;
        case "pinkNoise":
          addNoiseLayer("pink", 0.22, "lowpass", 2400);
          break;
        case "brownNoise":
          addNoiseLayer("brown", 0.25, "lowpass", 800);
          break;
      }

      return {
        context,
        masterGain,
        stop: () => {
          stopCallbacks.forEach((stopLayer) => stopLayer());
        },
      };
    },
    []
  );

  const startPlayback = useCallback(
    async (scene: Soundscape, requestId: number) => {
      await stopPlayback(false);

      if (requestId !== playbackRequestRef.current) {
        return false;
      }

      if (scene.engine === "none") {
        return false;
      }

      if (scene.audioUrl) {
        const audio = new Audio(scene.audioUrl);
        audio.loop = true;
        audio.volume = volume;
        try {
          await audio.play();

          if (requestId !== playbackRequestRef.current) {
            audio.pause();
            audio.src = "";
            return false;
          }

          audioRef.current = audio;
          return true;
        } catch {
          audio.pause();
          return false;
        }
      }

      const generatedSound = createGeneratedSound(scene.engine, volume);
      if (!generatedSound) {
        return false;
      }

      if (requestId !== playbackRequestRef.current) {
        generatedSound.stop();
        await generatedSound.context.close().catch(() => undefined);
        return false;
      }

      generatedAudioRef.current = generatedSound;
      return true;
    },
    [createGeneratedSound, stopPlayback, volume]
  );

  const toggleMiniTimer = () => {
    if (isTimerActive) {
      clearTimerInterval();
      setIsTimerActive(false);
      return;
    }

    if (timeLeft === 0) {
      setTimeLeft(timerModes[timerMode].minutes * 60);
    }
    setIsTimerActive(true);
  };

  const handleTimerModeChange = (mode: TimerMode) => {
    clearTimerInterval();
    setTimerMode(mode);
    setIsTimerActive(false);
    setTimeLeft(timerModes[mode].minutes * 60);
  };

  const resetMiniTimer = () => {
    clearTimerInterval();
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
    const noSoundOption = soundscapes.find((scene) => scene.id === "no-sound");
    const scopedScenes = soundscapes.filter((scene) => scene.category === activeSoundCategory);
    return noSoundOption ? [noSoundOption, ...scopedScenes] : scopedScenes;
  }, [activeSoundCategory]);

  const handleBackgroundSelect = (sceneId: string) => {
    setVideoError(false);
    setBackgroundId(sceneId);
  };

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }

    if (generatedAudioRef.current) {
      generatedAudioRef.current.masterGain.gain.value = nextVolume;
    }
  };

  const handleSoundSelect = async (sceneId: string) => {
    const requestId = playbackRequestRef.current + 1;
    playbackRequestRef.current = requestId;
    setSoundId(sceneId);

    const scene = soundscapes.find((item) => item.id === sceneId);
    if (!scene) {
      return;
    }

    if (scene.engine === "none") {
      await stopPlayback(true);
      setIsPlaying(false);
      return;
    }

    const isStarted = await startPlayback(scene, requestId);
    if (requestId === playbackRequestRef.current) {
      setIsPlaying(isStarted);
    }
  };

  useEffect(() => {
    return () => {
      clearTimerInterval();
      void stopPlayback(false);
    };
  }, [clearTimerInterval, stopPlayback]);

  const atmospherePanel = (
    <div
      className={`${isUiTransparent
        ? "bg-white/30 dark:bg-slate-900/30 border-white/20 dark:border-slate-700/20"
        : "bg-white/75 dark:bg-slate-900/70 border-white/40 dark:border-slate-700/40"
        } backdrop-blur-xl rounded-3xl border p-6 shadow-sm transition-colors relative`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-col gap-1 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Focus Atmosphere</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Pick a live background and a soundscape to match your focus.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAtmosphereOpen((prev) => !prev)}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 transition"
          >
            {isAtmosphereOpen ? "Hide" : "Show"}
          </button>
          <button
            onClick={() => setIsUiTransparent((prev) => !prev)}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 transition"
          >
            {isUiTransparent ? "Solid" : "Glass"}
          </button>
          <button
            onClick={() => setIsUiHidden(true)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
          >
            Hide All UI
          </button>
        </div>
      </div>

      {isAtmosphereOpen && (
        <div className="w-full flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab("backgrounds")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${activeTab === "backgrounds"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-white/40 dark:border-slate-700/40 hover:bg-white"
                }`}
            >
              Live Backgrounds
            </button>
            <button
              onClick={() => setActiveTab("sounds")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${activeTab === "sounds"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-white/40 dark:border-slate-700/40 hover:bg-white"
                }`}
            >
              Sounds
            </button>
          </div>

          {activeTab === "backgrounds" && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-2">
                {backgroundCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveBackgroundCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${category === activeBackgroundCategory
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-white/40 dark:border-slate-700/40 hover:bg-white"
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid w-full gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {filteredBackgrounds.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => handleBackgroundSelect(scene.id)}
                    className={`text-center rounded-2xl border p-4 transition shadow-sm ${scene.id === activeBackground?.id
                      ? "border-emerald-500 bg-emerald-50/80"
                      : "border-white/40 bg-white/70 hover:bg-white"
                      }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-20 w-32 rounded-xl bg-slate-200/70 overflow-hidden">
                        {scene.videoUrl ? (
                          <video
                            className="h-full w-full object-cover"
                            src={scene.videoUrl}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                          />
                        ) : scene.imageUrl ? (
                          <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${scene.imageUrl})` }}
                          />
                        ) : (
                          <div className="h-full w-full bg-[radial-gradient(circle_at_top,#bbf7d0,transparent_60%),radial-gradient(circle_at_30%_60%,#fde68a,transparent_55%),radial-gradient(circle_at_80%_20%,#bae6fd,transparent_55%)]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{scene.label}</p>
                        <p className="text-xs text-slate-600 mt-1">{scene.description}</p>
                        {!scene.videoUrl && !scene.imageUrl && scene.id !== "default" && (
                          <p className="text-[11px] text-amber-600 mt-2">
                            Add a video or image URL to enable a live background.
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "sounds" && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-2">
                {soundCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveSoundCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${category === activeSoundCategory
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-white/40 dark:border-slate-700/40 hover:bg-white"
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex w-max min-w-full justify-center gap-3 px-1">
                  {filteredSoundscapes.map((scene) => {
                    const isActive = scene.id === activeSound?.id;
                    const icon = soundIconsById[scene.id] ?? soundCategoryIcons[scene.category];

                    return (
                      <button
                        key={scene.id}
                        onClick={() => {
                          void handleSoundSelect(scene.id);
                        }}
                        className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition ${isActive
                          ? "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-900/30"
                          : "border-white/40 bg-white/75 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{icon}</span>
                          <span className={`text-sm font-semibold ${isActive ? "text-emerald-800 dark:text-emerald-200" : "text-slate-800 dark:text-slate-100"}`}>
                            {scene.label}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`material-symbols-outlined text-base ${isActive && isPlaying ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"}`}>
                            {isActive && isPlaying ? "volume_up" : "volume_off"}
                          </span>
                          <span className={`h-px flex-1 ${isActive ? "bg-emerald-400/80" : "bg-slate-400/50 dark:bg-slate-600/70"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {isPlaying ? "Now Playing" : "Select a sound to play"}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {activeSound?.description}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Volume
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(event) => handleVolumeChange(Number(event.target.value))}
                    className="w-40 accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent transition-colors duration-500 p-6 lg:p-10 flex flex-col gap-8">
      <div className="fixed inset-0 -z-20">
        {activeBackground?.videoUrl ? (
          <video
            key={activeBackground.id}
            className="h-full w-full object-cover"
            src={activeBackground.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadStart={() => setVideoError(false)}
            onError={() => setVideoError(true)}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: activeBackground?.imageUrl
                ? `url(${activeBackground.imageUrl})`
                : activeBackground?.id === "default"
                  ? "none"
                  : "radial-gradient(circle at top, rgba(34, 197, 94, 0.35), transparent 55%), radial-gradient(circle at 30% 40%, rgba(251, 191, 36, 0.3), transparent 45%), radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.25), transparent 45%)",
              backgroundColor: activeBackground?.id === "default" ? "#f8fafc" : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
      </div>
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
                    onClick={() => handleTimerModeChange("pomodoro")}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-full transition ${timerMode === "pomodoro" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"}`}
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => handleTimerModeChange("shortBreak")}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-full transition ${timerMode === "shortBreak" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"}`}
                  >
                    Short
                  </button>
                  <button
                    onClick={() => handleTimerModeChange("longBreak")}
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
          <FocusDashboardPanel atmospherePanel={atmospherePanel} />
        </div>
      )}
      <Footer />
    </div>
  );
}