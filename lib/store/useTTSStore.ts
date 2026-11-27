import { create } from 'zustand';
import type { MiniMaxModel, Emotion, AudioFormat, SampleRate, AudioChannel, LanguageBoost, VoiceModify, OutputFormat } from '@/lib/minimax/types';
import { isSameVoiceAccount } from '@/lib/voices/custom-voices';
import { samePlannerDraft, type PlannerDraft, type PronunciationEntry } from '@/lib/planner/core';
import { useSettingsStore } from './useSettingsStore';

const DEFAULT_VOICE_ID = 'Chinese (Mandarin)_Reliable_Executive';

export interface TTSState {
  // Current TTS parameters
  model: MiniMaxModel;
  text: string;
  voiceId: string;
  accountBoundVoice: boolean;
  speed: number;
  volume: number;
  pitch: number;
  emotion: Emotion | undefined;
  audioFormat: AudioFormat;
  sampleRate: SampleRate;
  bitrate: number;
  channel: AudioChannel;
  languageBoost: LanguageBoost;
  voiceModify: VoiceModify | undefined;
  outputFormat: OutputFormat;
  stream: boolean;

  // Pronunciation dictionary entries
  pronunciationEntries: PronunciationEntry[];
  plannerDraftRevision: number;
  plannerUndo: { before: PlannerDraft; after: PlannerDraft } | null;

  // Actions
  setModel: (model: MiniMaxModel) => void;
  setText: (text: string) => void;
  setVoiceId: (voiceId: string, accountBoundVoice?: boolean) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setPitch: (pitch: number) => void;
  setEmotion: (emotion: Emotion | undefined) => void;
  setAudioFormat: (format: AudioFormat) => void;
  setSampleRate: (rate: SampleRate) => void;
  setBitrate: (bitrate: number) => void;
  setChannel: (channel: AudioChannel) => void;
  setLanguageBoost: (lang: LanguageBoost) => void;
  setVoiceModify: (modify: VoiceModify | undefined) => void;
  setOutputFormat: (format: OutputFormat) => void;
  setStream: (stream: boolean) => void;
  addPronunciationEntry: (original: string, pronunciation: string) => void;
  removePronunciationEntry: (index: number) => void;
  applyPlannerDraft: (expected: PlannerDraft, next: PlannerDraft, expectedRevision?: number) => boolean;
  undoPlannerDraft: () => boolean;
  resetToDefaults: (defaults: {
    model: MiniMaxModel;
    audioFormat: AudioFormat;
    sampleRate: SampleRate;
    bitrate: number;
    channel: AudioChannel;
    languageBoost: LanguageBoost;
  }) => void;
}

function updateDraft(state: TTSState, change: Partial<PlannerDraft>) {
  const next = { text: state.text, model: state.model, pronunciationEntries: state.pronunciationEntries, ...change };
  return samePlannerDraft(state, next)
    ? {}
    : { plannerDraftRevision: state.plannerDraftRevision + 1, plannerUndo: null };
}

export const useTTSStore = create<TTSState>()((set, get) => ({
  model: 'speech-2.8-hd',
  text: '',
  voiceId: DEFAULT_VOICE_ID,
  accountBoundVoice: false,
  speed: 1.0,
  volume: 1.0,
  pitch: 0,
  emotion: undefined,
  audioFormat: 'mp3',
  sampleRate: 32000,
  bitrate: 128000,
  channel: 1,
  languageBoost: 'auto',
  voiceModify: undefined,
  outputFormat: 'url',
  stream: false,

  pronunciationEntries: [],
  plannerDraftRevision: 0,
  plannerUndo: null,

  setModel: (model) => set((state) => ({ model, ...updateDraft(state, { model }) })),
  setText: (text) => set((state) => ({ text, ...updateDraft(state, { text }) })),
  setVoiceId: (voiceId, accountBoundVoice = false) => set({ voiceId, accountBoundVoice }),
  setSpeed: (speed) => set({ speed }),
  setVolume: (volume) => set({ volume }),
  setPitch: (pitch) => set({ pitch }),
  setEmotion: (emotion) => set({ emotion }),
  setAudioFormat: (audioFormat) => set({ audioFormat }),
  setSampleRate: (sampleRate) => set({ sampleRate }),
  setBitrate: (bitrate) => set({ bitrate }),
  setChannel: (channel) => set({ channel }),
  setLanguageBoost: (languageBoost) => set({ languageBoost }),
  setVoiceModify: (voiceModify) => set({ voiceModify }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setStream: (stream) => set({ stream }),

  addPronunciationEntry: (original, pronunciation) =>
    set((state) => {
      const pronunciationEntries = [...state.pronunciationEntries, { original, pronunciation }];
      return { pronunciationEntries, ...updateDraft(state, { pronunciationEntries }) };
    }),

  removePronunciationEntry: (index) =>
    set((state) => {
      const pronunciationEntries = state.pronunciationEntries.filter((_, i) => i !== index);
      return { pronunciationEntries, ...updateDraft(state, { pronunciationEntries }) };
    }),

  applyPlannerDraft: (expected, next, expectedRevision) => {
    const state = get();
    if (next.model !== state.model || (expectedRevision !== undefined && expectedRevision !== state.plannerDraftRevision)
      || !samePlannerDraft(state, expected) || samePlannerDraft(state, next)) return false;
    set({
      text: next.text,
      pronunciationEntries: next.pronunciationEntries,
      plannerDraftRevision: state.plannerDraftRevision + 1,
      plannerUndo: { before: expected, after: next },
    });
    return true;
  },

  undoPlannerDraft: () => {
    const state = get();
    const undo = state.plannerUndo;
    if (!undo || !samePlannerDraft(state, undo.after)) return false;
    set({
      text: undo.before.text,
      pronunciationEntries: undo.before.pronunciationEntries,
      plannerDraftRevision: state.plannerDraftRevision + 1,
      plannerUndo: null,
    });
    return true;
  },

  resetToDefaults: (defaults) =>
    set((state) => ({
      ...updateDraft(state, { model: defaults.model }),
      model: defaults.model,
      audioFormat: defaults.audioFormat,
      sampleRate: defaults.sampleRate,
      bitrate: defaults.bitrate,
      channel: defaults.channel,
      languageBoost: defaults.languageBoost,
    })),
}));

useSettingsStore.subscribe((next, previous) => {
  const tts = useTTSStore.getState();
  if (tts.accountBoundVoice && !isSameVoiceAccount(next, previous)) {
    tts.setVoiceId(DEFAULT_VOICE_ID);
  }
});
