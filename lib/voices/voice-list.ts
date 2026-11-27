type VoiceRecord = Record<string, unknown>;
export type VoiceType = 'system' | 'voice_cloning' | 'voice_generation';

export interface VoiceListEntry extends VoiceRecord {
  voice_id: string;
  voice_type: VoiceType;
}

const GROUPS = [
  ['system_voice', 'system'],
  ['system_voices', 'system'],
  ['voice_cloning', 'voice_cloning'],
  ['voice_generation', 'voice_generation'],
] as const;

export function isVoiceRecord(value: unknown): value is VoiceRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function voiceText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function voiceRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isVoiceRecord(value)) return [];
  return Object.values(value).flatMap((group) => Array.isArray(group) ? group : []);
}

export function normalizeVoiceList(data: VoiceRecord): VoiceListEntry[] {
  const entries = new Map<string, VoiceListEntry>();
  const sources = isVoiceRecord(data.data) ? [data, data.data] : [data];

  function addRows(rows: unknown, type?: VoiceType) {
    for (const row of voiceRows(rows)) {
      if (!isVoiceRecord(row)) continue;
      const id = voiceText(row.voice_id);
      if (!id) continue;

      const existing = entries.get(id);
      const flatType = row.voice_type === 'voice_cloning' || row.voice_type === 'voice_generation'
        ? row.voice_type
        : 'system';
      entries.set(id, { ...row, ...existing, voice_id: id, voice_type: existing?.voice_type ?? type ?? flatType });
    }
  }

  for (const [group, type] of GROUPS) {
    for (const source of sources) addRows(source[group], type);
  }
  for (const source of sources) {
    addRows(source.voice_list);
    addRows(source.voices);
  }

  return [...entries.values()];
}

export function voiceDescription(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(voiceText).filter(Boolean).join(' / ');
  }
  return voiceText(value) ?? '';
}
