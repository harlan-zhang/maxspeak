import type { TTSState } from '../store/useTTSStore';
import type { PlannerDraft } from '../planner/core';
import type { TTSRequest } from './types';

export function buildSynthesisRequest(
  tts: TTSState,
  draft: Pick<PlannerDraft, 'text' | 'pronunciationEntries'> = tts,
): TTSRequest {
  return {
    model: tts.model,
    text: draft.text,
    voice_setting: {
      voice_id: tts.voiceId,
      speed: tts.speed,
      vol: tts.volume,
      pitch: tts.pitch,
      ...(tts.emotion ? { emotion: tts.emotion } : {}),
    },
    audio_setting: {
      sample_rate: tts.sampleRate,
      bitrate: tts.bitrate,
      format: tts.audioFormat,
      channel: tts.channel,
    },
    language_boost: tts.languageBoost,
    ...(tts.voiceModify && Object.keys(tts.voiceModify).length > 0 ? { voice_modify: tts.voiceModify } : {}),
    ...(draft.pronunciationEntries.length > 0 ? {
      pronunciation_dict: { tone: draft.pronunciationEntries.map(({ original, pronunciation }) => original + '/' + pronunciation) },
    } : {}),
    output_format: 'hex',
  };
}
