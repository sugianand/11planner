'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';

export type YouTubeMood = 'lofi' | 'synthwave' | 'coding';

export type YouTubeTrack = {
  title: string;
  artist: string;
  duration: string;
  youtubeId: string;
  searchQuery: string;
};

interface MusicContextType {
  // Spotify state
  spotifyPlaylist: string;
  setSpotifyPlaylist: Dispatch<SetStateAction<string>>;
  spotifyConnected: boolean;
  setSpotifyConnected: Dispatch<SetStateAction<boolean>>;
  spotifyConnecting: boolean;
  setSpotifyConnecting: Dispatch<SetStateAction<boolean>>;
  connectMessage: string;
  setConnectMessage: Dispatch<SetStateAction<string>>;

  // YouTube state
  youtubeMood: YouTubeMood;
  setYoutubeMood: Dispatch<SetStateAction<YouTubeMood>>;
  activeYoutubeIndex: number;
  setActiveYoutubeIndex: Dispatch<SetStateAction<number>>;
  isYoutubePlaying: boolean;
  setIsYoutubePlaying: Dispatch<SetStateAction<boolean>>;

  // General music state
  musicProvider: 'spotify' | 'youtube';
  setMusicProvider: Dispatch<SetStateAction<'spotify' | 'youtube'>>;
  isMusicOpen: boolean;
  setIsMusicOpen: Dispatch<SetStateAction<boolean>>;

  // YouTube tracks
  youtubeTracks: YouTubeTrack[];
}

const MusicContext = createContext<MusicContextType | null>(null);

const MUSIC_STORAGE_KEY = 'musicPlayerState';

export function MusicProvider({ children }: { children: ReactNode }) {
  // Spotify state
  const [spotifyPlaylist, setSpotifyPlaylist] = useState('0vvXsWCC9xrXsKd4FyS8kM');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyConnecting, setSpotifyConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');

  // YouTube state
  const [youtubeMood, setYoutubeMood] = useState<YouTubeMood>('lofi');
  const [activeYoutubeIndex, setActiveYoutubeIndex] = useState(0);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(false);

  // General music state
  const [musicProvider, setMusicProvider] = useState<'spotify' | 'youtube'>('spotify');
  const [isMusicOpen, setIsMusicOpen] = useState(false);

  const youtubeTracks: YouTubeTrack[] = [
    {
      title: 'Deep Focus Lofi',
      artist: 'Lofi Girl',
      duration: 'Live',
      youtubeId: 'jfKfPfyJRdk',
      searchQuery: 'lofi beats',
    },
    {
      title: 'Synthwave Radio',
      artist: 'Lofi Geek',
      duration: 'Live',
      youtubeId: '4xDzrJKXOOY',
      searchQuery: 'synthwave focus',
    },
    {
      title: 'Coding Mix',
      artist: 'Chill Music Lab',
      duration: '1:02:10',
      youtubeId: 'n61ULEU7CO0',
      searchQuery: 'coding lofi mix',
    },
  ];

  // Load persisted state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
      if (saved) {
        const {
          spotifyPlaylist: sp,
          spotifyConnected: sc,
          youtubeMood: ym,
          activeYoutubeIndex: ayi,
          isYoutubePlaying: iyp,
          musicProvider: mp,
          isMusicOpen: imo,
        } = JSON.parse(saved);

        if (sp) setSpotifyPlaylist(sp);
        if (sc !== undefined) setSpotifyConnected(sc);
        if (ym) setYoutubeMood(ym);
        if (ayi !== undefined) setActiveYoutubeIndex(ayi);
        if (iyp !== undefined) setIsYoutubePlaying(iyp);
        if (mp) setMusicProvider(mp);
        if (imo !== undefined) setIsMusicOpen(imo);
      }
    } catch (e) {
      console.error('Failed to load music state:', e);
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      const state = {
        spotifyPlaylist,
        spotifyConnected,
        youtubeMood,
        activeYoutubeIndex,
        isYoutubePlaying,
        musicProvider,
        isMusicOpen,
      };
      localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save music state:', e);
    }
  }, [spotifyPlaylist, spotifyConnected, youtubeMood, activeYoutubeIndex, isYoutubePlaying, musicProvider, isMusicOpen]);

  const value = useMemo(
    () => ({
      spotifyPlaylist,
      setSpotifyPlaylist,
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
      musicProvider,
      setMusicProvider,
      isMusicOpen,
      setIsMusicOpen,
      youtubeTracks,
    }),
    [
      spotifyPlaylist,
      spotifyConnected,
      spotifyConnecting,
      connectMessage,
      youtubeMood,
      activeYoutubeIndex,
      isYoutubePlaying,
      musicProvider,
      isMusicOpen,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
