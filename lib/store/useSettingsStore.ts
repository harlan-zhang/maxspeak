import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MiniMaxModel, AudioFormat, SampleRate, AudioChannel, LanguageBoost } from '@/lib/minimax/types';

interface SettingsState {
  // API configuration
  apiKey: string;
  baseUrl: string;
  directConnect: boolean; // true = browser direct to MiniMax, false = proxy via Next.js API routes

  // Default TTS preferences
  defaultModel: MiniMaxModel;
  defaultFormat: AudioFormat;
  defaultSampleRate: SampleRate;
  defaultBitrate: number;
  defaultChannel: AudioChannel;
  defaultLanguage: LanguageBoost;

  // UI preferences
  theme: 'light' | 'dark' | 'system';
  autoPlay: boolean;
  autoStream: boolean;

  // Actions
  setApiKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setDirectConnect: (direct: boolean) => void;
  setDefaultModel: (model: MiniMaxModel) => void;
  setDefaultFormat: (format: AudioFormat) => void;
  setDefaultSampleRate: (rate: SampleRate) => void;
  setDefaultBitrate: (bitrate: number) => void;
  setDefaultChannel: (channel: AudioChannel) => void;
  setDefaultLanguage: (lang: LanguageBoost) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAutoPlay: (auto: boolean) => void;
  setAutoStream: (auto: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      baseUrl: 'https://api.minimax.io',
      directConnect: false,

      defaultModel: 'speech-2.8-hd',
      defaultFormat: 'mp3',
      defaultSampleRate: 32000,
      defaultBitrate: 128000,
      defaultChannel: 1,
      defaultLanguage: 'auto',

      theme: 'system',
      autoPlay: true,
      autoStream: true,

      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setDirectConnect: (directConnect) => set({ directConnect }),
      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setDefaultFormat: (defaultFormat) => set({ defaultFormat }),
      setDefaultSampleRate: (defaultSampleRate) => set({ defaultSampleRate }),
      setDefaultBitrate: (defaultBitrate) => set({ defaultBitrate }),
      setDefaultChannel: (defaultChannel) => set({ defaultChannel }),
      setDefaultLanguage: (defaultLanguage) => set({ defaultLanguage }),
      setTheme: (theme) => set({ theme }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      setAutoStream: (autoStream) => set({ autoStream }),
    }),
    {
      name: 'tts-workbench-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        directConnect: state.directConnect,
        defaultModel: state.defaultModel,
        defaultFormat: state.defaultFormat,
        defaultSampleRate: state.defaultSampleRate,
        defaultBitrate: state.defaultBitrate,
        defaultChannel: state.defaultChannel,
        defaultLanguage: state.defaultLanguage,
        theme: state.theme,
        autoPlay: state.autoPlay,
        autoStream: state.autoStream,
      }),
    }
  )
);
