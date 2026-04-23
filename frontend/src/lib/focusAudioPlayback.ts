"use client";

// Focus Audio Playback — singleton state manager for background audio
// played during focus sessions (Pomodoro timer). Supports both HTML
// <audio> elements (file-based sounds) and Web Audio API generated sounds.
// External consumers subscribe to snapshots for reactive UI updates.

// Snapshot of a Web Audio API session (used for procedurally generated sounds)
export type GeneratedSoundSession = {
  context: AudioContext;
  masterGain: GainNode;
  stop: () => void;
};

// Immutable snapshot emitted to subscribers whenever playback state changes
export type FocusAudioPlaybackSnapshot = {
  requestId: number;
  soundId: string | null;
  userId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  hasAudio: boolean;
};

// Callback type for playback state subscribers
type PlaybackListener = (snapshot: FocusAudioPlaybackSnapshot) => void;

// Set of active listeners notified on every state change
const listeners = new Set<PlaybackListener>();

// Internal mutable playback state (module-level singleton)
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

// Clamp volume to the valid [0, 1] range
const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

// Build an immutable snapshot from the current mutable state
const getSnapshot = (): FocusAudioPlaybackSnapshot => ({
  requestId: state.requestId,
  soundId: state.soundId,
  userId: state.userId,
  isPlaying: state.isPlaying,
  isMuted: state.isMuted,
  volume: state.volume,
  hasAudio: Boolean(state.audio || state.generatedAudio),
});

// Notify all subscribers with the latest snapshot
const emit = () => {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

// Sync volume and mute state to the active audio source
const applyOutputLevels = () => {
  if (state.audio) {
    state.audio.volume = state.volume;
    state.audio.muted = state.isMuted;
  }

  if (state.generatedAudio) {
    state.generatedAudio.masterGain.gain.value = state.isMuted ? 0 : state.volume;
  }
};

/** Subscribe to playback state changes. Returns an unsubscribe function. */
export const subscribeFocusAudioPlayback = (listener: PlaybackListener) => {
  listeners.add(listener);
  listener(getSnapshot());
  return () => {
    listeners.delete(listener);
  };
};

/** Get the current playback snapshot without subscribing. */
export const getFocusAudioPlaybackSnapshot = (): FocusAudioPlaybackSnapshot => getSnapshot();

/** Return the current request counter value. */
export const getCurrentPlaybackRequestId = (): number => state.requestId;

/** Increment and return a new unique playback request ID. */
export const createPlaybackRequest = (): number => {
  state.requestId += 1;
  emit();
  return state.requestId;
};

/** Set the playback volume (0–1). */
export const setFocusAudioVolume = (nextVolume: number) => {
  state.volume = clampVolume(nextVolume);
  applyOutputLevels();
  emit();
};

/** Mute or unmute playback. */
export const setFocusAudioMuted = (muted: boolean) => {
  state.isMuted = muted;
  applyOutputLevels();
  emit();
};

/** Toggle muted state and return the new value. */
export const toggleFocusAudioMuted = (): boolean => {
  setFocusAudioMuted(!state.isMuted);
  return state.isMuted;
};

/** Attach an HTML <audio> element as the active playback source. */
export const attachHtmlAudioSession = (audio: HTMLAudioElement, soundId: string, userId: string) => {
  state.audio = audio;
  state.generatedAudio = null;
  state.isPlaying = true;
  state.soundId = soundId;
  state.userId = userId;
  applyOutputLevels();
  emit();
};

/** Attach a Web Audio API generated session as the active playback source. */
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

/** Stop all playback, release audio resources, and reset state. */
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
