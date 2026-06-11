import { create } from 'zustand';

interface PlayerState {
  // Playback state
  isPlaying: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  audioUrl: string | null;

  // Streaming progress
  streamingProgress: number; // 0-100
  streamingTotalChunks: number;
  streamingReceivedChunks: number;

  // History
  lastGeneratedAudio: {
    url?: string;
    hex?: string;
    format: string;
    fileName: string;
  } | null;

  // Actions
  setPlaying: (playing: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setLoading: (loading: boolean) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setAudioUrl: (url: string | null) => void;
  setStreamingProgress: (received: number, total: number) => void;
  setLastGeneratedAudio: (audio: { url?: string; hex?: string; format: string; fileName: string } | null) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  isPlaying: false,
  isStreaming: false,
  isLoading: false,
  duration: 0,
  currentTime: 0,
  audioUrl: null,
  streamingProgress: 0,
  streamingTotalChunks: 0,
  streamingReceivedChunks: 0,
  lastGeneratedAudio: null,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setLoading: (isLoading) => set({ isLoading }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  setStreamingProgress: (received, total) =>
    set({
      streamingReceivedChunks: received,
      streamingTotalChunks: total,
      streamingProgress: total > 0 ? Math.round((received / total) * 100) : 0,
    }),
  setLastGeneratedAudio: (lastGeneratedAudio) => set({ lastGeneratedAudio }),
  reset: () =>
    set({
      isPlaying: false,
      isStreaming: false,
      isLoading: false,
      duration: 0,
      currentTime: 0,
      streamingProgress: 0,
      streamingTotalChunks: 0,
      streamingReceivedChunks: 0,
      lastGeneratedAudio: null,
    }),
}));
