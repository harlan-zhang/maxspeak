import type { ClonedVoice, DesignedVoice, PresetVoice } from '../minimax/types';
import { isVoiceRecord, voiceDescription, voiceText, type VoiceListEntry } from './voice-list';

export interface VoiceAccount {
  apiKey: string;
  baseUrl: string;
}

export interface VoiceCatalog {
  cloned: ClonedVoice[];
  designed: DesignedVoice[];
}

export const EMPTY_VOICE_CATALOG: VoiceCatalog = { cloned: [], designed: [] };
export const VOICE_CATALOG_CHANGED = 'maxspeak-voice-catalog-changed';
const LEGACY_CLONED_KEY = 'tts-cloned-voices';
const LEGACY_DESIGNED_KEY = 'tts-designed-voices';

export function isSameVoiceAccount(first: VoiceAccount, second: VoiceAccount) {
  return first.apiKey === second.apiKey && first.baseUrl === second.baseUrl;
}

export async function getVoiceStorageKey({ apiKey, baseUrl }: VoiceAccount): Promise<string> {
  if (!apiKey.trim()) throw new Error('请先设置 API Key');
  if (!crypto.subtle) throw new Error('请在 HTTPS 或 localhost 中使用自定义音色库');

  const account = new TextEncoder().encode(JSON.stringify([new URL(baseUrl).origin, apiKey.trim()]));
  const digest = await crypto.subtle.digest('SHA-256', account);
  const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `maxspeak-voices:${id}`;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readCloned(row: Record<string, unknown>, voiceId: string): ClonedVoice {
  return {
    voiceId,
    name: voiceText(row.name) ?? voiceId,
    createdAt: finiteNumber(row.createdAt),
    demoAudio: voiceText(row.demoAudio),
    fileId: finiteNumber(row.fileId),
  };
}

function readDesigned(row: Record<string, unknown>, voiceId: string): DesignedVoice {
  return {
    voiceId,
    name: voiceText(row.name),
    prompt: voiceText(row.prompt) ?? '',
    previewText: voiceText(row.previewText) ?? '',
    createdAt: finiteNumber(row.createdAt),
    trialAudio: voiceText(row.trialAudio),
  };
}

function readRows<T>(value: unknown, readVoice: (row: Record<string, unknown>, id: string) => T): T[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.flatMap((row) => {
    if (!isVoiceRecord(row)) return [];
    const id = voiceText(row.voiceId);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [readVoice(row, id)];
  });
}

export function readVoiceCatalog(key: string): VoiceCatalog {
  const raw = window.localStorage.getItem(key);
  if (raw === null) return EMPTY_VOICE_CATALOG;

  const value: unknown = JSON.parse(raw);
  if (!isVoiceRecord(value) || !Array.isArray(value.cloned) || !Array.isArray(value.designed)) {
    throw new Error('本地音色库数据格式无效');
  }
  return { cloned: readRows(value.cloned, readCloned), designed: readRows(value.designed, readDesigned) };
}

export async function updateVoiceCatalog(key: string, update: (current: VoiceCatalog) => VoiceCatalog) {
  if (!navigator.locks) throw new Error('当前浏览器无法安全写入音色库，请使用支持 Web Locks 的浏览器');

  await navigator.locks.request(key, () => {
    const next = update(readVoiceCatalog(key));
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(VOICE_CATALOG_CHANGED));
  });
}

export function upsertVoice<T extends { voiceId: string }>(voices: T[], voice: T): T[] {
  return [voice, ...voices.filter((other) => other.voiceId !== voice.voiceId)];
}

function mergeVoices<T extends { voiceId: string }>(
  current: T[],
  synced: T[],
  merge: (saved: T, incoming: T) => T,
): T[] {
  const byId = new Map(current.map((voice) => [voice.voiceId, voice]));
  for (const incoming of synced) {
    const saved = byId.get(incoming.voiceId);
    byId.set(incoming.voiceId, saved ? merge(saved, incoming) : incoming);
  }
  return [...byId.values()];
}

export function mergeSyncedVoices(current: VoiceCatalog, synced: VoiceCatalog): VoiceCatalog {
  return {
    cloned: mergeVoices(current.cloned, synced.cloned, (saved, incoming) => ({
      ...saved,
      name: incoming.name !== incoming.voiceId ? incoming.name : saved.name,
      createdAt: saved.createdAt ?? incoming.createdAt,
      demoAudio: incoming.demoAudio ?? saved.demoAudio,
      fileId: saved.fileId ?? incoming.fileId,
    })),
    designed: mergeVoices(current.designed, synced.designed, (saved, incoming) => ({
      ...saved,
      name: incoming.name ?? saved.name,
      prompt: incoming.previewText || !saved.previewText ? incoming.prompt || saved.prompt : saved.prompt,
      previewText: incoming.previewText || saved.previewText,
      createdAt: saved.createdAt ?? incoming.createdAt,
      trialAudio: incoming.trialAudio ?? saved.trialAudio,
    })),
  };
}

function matchingLegacyVoices<T extends { voiceId: string }>(
  key: string,
  readVoice: (row: Record<string, unknown>, id: string) => T,
  synced: T[],
): T[] {
  if (synced.length === 0) return [];
  const raw = window.localStorage.getItem(key);
  if (raw === null) return [];

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    console.warn('音色库跳过了无法解析的旧版本记录', key);
    return [];
  }

  const confirmed = new Set(synced.map((voice) => voice.voiceId));
  return readRows(value, readVoice).filter((voice) => confirmed.has(voice.voiceId));
}

export function hasLegacyVoiceCatalog() {
  return window.localStorage.getItem(LEGACY_CLONED_KEY) !== null ||
    window.localStorage.getItem(LEGACY_DESIGNED_KEY) !== null;
}

export function saveSyncedVoices(key: string, synced: VoiceCatalog, restoreLegacy = false) {
  return updateVoiceCatalog(key, (current) => {
    if (!restoreLegacy) return mergeSyncedVoices(current, synced);

    const legacy = {
      cloned: matchingLegacyVoices(LEGACY_CLONED_KEY, readCloned, synced.cloned),
      designed: matchingLegacyVoices(LEGACY_DESIGNED_KEY, readDesigned, synced.designed),
    };
    return mergeSyncedVoices(mergeSyncedVoices(legacy, current), synced);
  });
}

function voiceCreationDate(row: VoiceListEntry): number | undefined {
  const raw = row.created_time ?? row.create_time;
  if (typeof raw === 'string') return finiteNumber(Date.parse(raw));
  const timestamp = finiteNumber(raw);
  return timestamp === undefined || timestamp >= 1_000_000_000_000 ? timestamp : timestamp * 1000;
}

export function customVoicesFromList(voices: VoiceListEntry[]): VoiceCatalog {
  const catalog: VoiceCatalog = { cloned: [], designed: [] };
  for (const row of voices) {
    if (row.voice_type === 'voice_cloning') {
      catalog.cloned.push({
        voiceId: row.voice_id,
        name: voiceText(row.voice_name) ?? (voiceDescription(row.description) || row.voice_id),
        createdAt: voiceCreationDate(row),
        demoAudio: voiceText(row.demo_audio),
        fileId: finiteNumber(row.file_id),
      });
    } else if (row.voice_type === 'voice_generation') {
      catalog.designed.push({
        voiceId: row.voice_id,
        name: voiceText(row.voice_name),
        prompt: voiceText(row.prompt) ?? voiceDescription(row.description),
        previewText: voiceText(row.preview_text) ?? voiceText(row.text) ?? '',
        createdAt: voiceCreationDate(row),
        trialAudio: voiceText(row.trial_audio),
      });
    }
  }
  return catalog;
}

export const CUSTOM_VOICE_LANGUAGE = 'Custom';

export function customVoiceOptions({ cloned, designed }: VoiceCatalog): PresetVoice[] {
  const options: PresetVoice[] = [];
  for (const [voices, label] of [[cloned, '复刻音色'], [designed, '设计音色']] as const) {
    for (const voice of voices) {
      options.push({
        id: voice.voiceId,
        name: voice.name || ('prompt' in voice ? voice.prompt : '') || voice.voiceId,
        language: CUSTOM_VOICE_LANGUAGE,
        languageLabel: label,
        gender: 'neutral',
        description: voice.voiceId,
      });
    }
  }
  return options;
}
