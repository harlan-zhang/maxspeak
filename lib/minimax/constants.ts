import type { MiniMaxModel, AudioFormat, SampleRate, AudioChannel, LanguageBoost } from './types';

// API base URLs
export const MINIMAX_API_BASE = 'https://api.minimax.io';
export const MINIMAX_API_BASE_CN = 'https://api.minimaxi.com';

// Endpoints
export const ENDPOINTS = {
  TTS: '/v1/t2a_v2',
  TTS_ASYNC: '/v1/t2a_async_v2',
  VOICE_CLONE: '/v1/voice_clone',
  VOICE_DESIGN: '/v1/voice_design',
  GET_VOICE: '/v1/get_voice',
  FILE_UPLOAD: '/v1/files/upload',
} as const;

// Model options with metadata
export const MODELS: { value: MiniMaxModel; label: string; description: string; tier: 'latest' | 'previous' | 'legacy' }[] = [
  { value: 'speech-2.8-hd', label: 'Speech 2.8 HD', description: '最新高清品质，最佳音色表现', tier: 'latest' },
  { value: 'speech-2.8-turbo', label: 'Speech 2.8 Turbo', description: '最新快速版，性价比之选', tier: 'latest' },
  { value: 'speech-2.6-hd', label: 'Speech 2.6 HD', description: '40语言高清模型', tier: 'previous' },
  { value: 'speech-2.6-turbo', label: 'Speech 2.6 Turbo', description: '40语言快速模型', tier: 'previous' },
  { value: 'speech-02-hd', label: 'Speech 02 HD', description: '经典高清品质', tier: 'legacy' },
  { value: 'speech-02-turbo', label: 'Speech 02 Turbo', description: '经典快速版本', tier: 'legacy' },
  { value: 'speech-01-hd', label: 'Speech 01 HD', description: '旧版高清模型', tier: 'legacy' },
  { value: 'speech-01-turbo', label: 'Speech 01 Turbo', description: '旧版快速模型', tier: 'legacy' },
  { value: 'speech-01-240228', label: 'Speech 01 (240228)', description: '240228 旧版模型', tier: 'legacy' },
  { value: 'speech-01-turbo-240228', label: 'Speech 01 Turbo (240228)', description: '240228 旧版Turbo', tier: 'legacy' },
];

// Audio format options
export const AUDIO_FORMATS: { value: AudioFormat; label: string; streaming: boolean }[] = [
  { value: 'mp3', label: 'MP3', streaming: true },
  { value: 'wav', label: 'WAV', streaming: false },
  { value: 'flac', label: 'FLAC', streaming: true },
  { value: 'pcm', label: 'PCM', streaming: true },
];

export const SAMPLE_RATES: { value: SampleRate; label: string }[] = [
  { value: 8000, label: '8 kHz' },
  { value: 16000, label: '16 kHz' },
  { value: 22050, label: '22.05 kHz' },
  { value: 24000, label: '24 kHz' },
  { value: 32000, label: '32 kHz' },
  { value: 44100, label: '44.1 kHz' },
];

export const BITRATES: { value: number; label: string }[] = [
  { value: 64000, label: '64 kbps' },
  { value: 96000, label: '96 kbps' },
  { value: 128000, label: '128 kbps' },
  { value: 160000, label: '160 kbps' },
  { value: 192000, label: '192 kbps' },
  { value: 256000, label: '256 kbps' },
  { value: 320000, label: '320 kbps' },
];

export const CHANNELS: { value: AudioChannel; label: string }[] = [
  { value: 1, label: '单声道 (Mono)' },
  { value: 2, label: '立体声 (Stereo)' },
];

// Voice Modify sound effects presets
export const SOUND_EFFECTS: { value: string; label: string }[] = [
  { value: '', label: '无' },
  { value: 'spacious_echo', label: '宽敞回音' },
  { value: 'telephone', label: '电话音效' },
  { value: 'radio', label: '收音机' },
  { value: 'megaphone', label: '扩音器' },
];

// TTS parameter ranges
export const PARAM_RANGES = {
  speed: { min: 0.5, max: 2.0, step: 0.1, default: 1.0 },
  volume: { min: 0.1, max: 10.0, step: 0.1, default: 1.0 },
  pitch: { min: -12, max: 12, step: 1, default: 0 },
  textMaxLength: 10000,
  streamingTextThreshold: 3000,
};

// Pricing constants (CNY per 10K characters)
export const PRICING: Record<string, number> = {
  'speech-2.8-hd': 3.5,
  'speech-2.8-turbo': 2.0,
  'speech-2.6-hd': 3.5,
  'speech-2.6-turbo': 2.0,
  'speech-02-hd': 3.5,
  'speech-02-turbo': 2.0,
  'speech-01-hd': 3.5,
  'speech-01-turbo': 2.0,
  'speech-01-240228': 3.5,
  'speech-01-turbo-240228': 2.0,
};

// Voice cloning pricing
export const VOICE_CLONE_FEE_CNY = 9.9;
export const VOICE_DESIGN_FEE_CNY = 9.9;

// Voice ID naming rules
export const VOICE_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{7,255}$/;
export const VOICE_ID_RULES = '8-256个字符，以字母开头，只能包含字母、数字、连字符和下划线，不能以 - 或 _ 结尾';
