"use client";

export type GeneratedSoundSession = {
  context: AudioContext;
  masterGain: GainNode;
  stop: () => void;
};

export type FocusAudioPlaybackSnapshot = {
  requestId: number;
  soundId: string | null;
  userId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  hasAudio: boolean;
};

type PlaybackListener = (snapshot: FocusAudioPlaybackSnapshot) => void;

const listeners = new Set<PlaybackListener>();

const state = {
  audio: null as HTMLAudioElement | null,
  generatedAudio: null as GeneratedSoundSession | null,
  requestId: 0,
  soundId: null as string | null,
  userId: null as string | null,
  isPlaying: false,
  isMuted: false,
  volume: 0.6,
};

const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

const getSnapshot = (): FocusAudioPlaybackSnapshot => ({
  requestId: state.requestId,
  soundId: state.soundId,
  userId: state.userId,
  isPlaying: state.isPlaying,
  isMuted: state.isMuted,
  volume: state.volume,
  hasAudio: Boolean(state.audio || state.generatedAudio),
});

const emit = () => {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

const applyOutputLevels = () => {
  if (state.audio) {
    state.audio.volume = state.volume;
    state.audio.muted = state.isMuted;
  }

  if (state.generatedAudio) {
    state.generatedAudio.masterGain.gain.value = state.isMuted ? 0 : state.volume;
  }
};

export const subscribeFocusAudioPlayback = (listener: PlaybackListener) => {
  listeners.add(listener);
  listener(getSnapshot());
  return () => {
    listeners.delete(listener);
  };
};

export const getFocusAudioPlaybackSnapshot = (): FocusAudioPlaybackSnapshot => getSnapshot();

export const getCurrentPlaybackRequestId = (): number => state.requestId;

export const createPlaybackRequest = (): number => {
  state.requestId += 1;
  emit();
  return state.requestId;
};

export const setFocusAudioVolume = (nextVolume: number) => {
  state.volume = clampVolume(nextVolume);
  applyOutputLevels();
  emit();
};

export const setFocusAudioMuted = (muted: boolean) => {
  state.isMuted = muted;
  applyOutputLevels();
  emit();
};

export const toggleFocusAudioMuted = (): boolean => {
  setFocusAudioMuted(!state.isMuted);
  return state.isMuted;
};

export const attachHtmlAudioSession = (audio: HTMLAudioElement, soundId: string, userId: string) => {
  state.audio = audio;
  state.generatedAudio = null;
  state.isPlaying = true;
  state.soundId = soundId;
  state.userId = userId;
  applyOutputLevels();
  emit();
};

export const attachGeneratedAudioSession = (
  generatedAudio: GeneratedSoundSession,
  soundId: string,
  userId: string
) => {
  state.generatedAudio = generatedAudio;
  state.audio = null;
  state.isPlaying = true;
  state.soundId = soundId;
  state.userId = userId;
  applyOutputLevels();
  emit();
};

export const stopFocusAudioPlayback = async () => {
  if (state.audio) {
    state.audio.pause();
    state.audio.src = "";
    state.audio = null;
  }

  if (state.generatedAudio) {
    state.generatedAudio.stop();
    await state.generatedAudio.context.close().catch(() => undefined);
    state.generatedAudio = null;
  }

  state.isPlaying = false;
  state.soundId = null;
  state.userId = null;
  emit();
};
