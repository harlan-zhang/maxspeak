// ============================================================
// MiniMax API TypeScript Type Definitions
// Based on https://platform.minimax.io/docs/api-reference/speech-t2a-http
// ============================================================

// --- Enums / Literal Unions ---

export type MiniMaxModel =
  | 'speech-2.8-hd'
  | 'speech-2.8-turbo'
  | 'speech-2.6-hd'
  | 'speech-2.6-turbo'
  | 'speech-02-hd'
  | 'speech-02-turbo'
  | 'speech-01-hd'
  | 'speech-01-turbo'
  | 'speech-01-240228'
  | 'speech-01-turbo-240228';

export type Emotion =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised'
  | 'neutral'
  | 'fluent'
  | 'whisper';

export type ParalinguisticTag =
  | 'sighs'
  | 'laughs'
  | 'chuckle'
  | 'coughs'
  | 'clear-throat'
  | 'groans'
  | 'breath'
  | 'pant'
  | 'inhale'
  | 'exhale'
  | 'gasps'
  | 'sniffs'
  | 'snorts'
  | 'burps'
  | 'lip-smacking'
  | 'humming'
  | 'hissing'
  | 'emm'
  | 'whistles'
  | 'sneezes'
  | 'crying'
  | 'applause';

export type AudioFormat = 'mp3' | 'pcm' | 'flac' | 'wav';

export type SampleRate = 8000 | 16000 | 22050 | 24000 | 32000 | 44100;

export type AudioChannel = 1 | 2;

export type LanguageBoost =
  | 'auto'
  | 'Chinese'
  | 'Chinese,Yue'
  | 'English'
  | 'Japanese'
  | 'Korean'
  | 'Arabic'
  | 'Russian'
  | 'Spanish'
  | 'French'
  | 'Portuguese'
  | 'German'
  | 'Turkish'
  | 'Dutch'
  | 'Ukrainian'
  | 'Vietnamese'
  | 'Indonesian'
  | 'Italian'
  | 'Thai'
  | 'Polish'
  | 'Romanian'
  | 'Greek'
  | 'Czech'
  | 'Finnish'
  | 'Hindi';

export type VoiceType =
  | 'all'
  | 'system'
  | 'voice_cloning'
  | 'voice_generation';

export type OutputFormat = 'url' | 'hex';

// --- Request Types ---

export interface VoiceSetting {
  voice_id: string;
  speed?: number;   // 0.5 - 2.0, default 1.0
  vol?: number;      // 0.1 - 10.0, default 1.0
  pitch?: number;    // -12 to +12, default 0
  emotion?: Emotion;
}

export interface AudioSetting {
  sample_rate?: SampleRate;
  bitrate?: number;    // 64000 - 320000 bps
  format?: AudioFormat;
  channel?: AudioChannel;
}

export interface VoiceModify {
  pitch?: number;         // voice modify pitch adjustment
  intensity?: number;     // energy/intensity control
  timbre?: number;         // tonal character/color
  sound_effects?: string;  // preset sound effect (e.g. "spacious_echo")
}

export interface PronunciationEntry {
  [key: string]: string;  // e.g. "Omg/Oh my god" or "草地/(cao3)(di1)"
}

export interface TTSRequest {
  model: MiniMaxModel;
  text: string;
  stream?: boolean;
  voice_setting: VoiceSetting;
  audio_setting?: AudioSetting;
  language_boost?: LanguageBoost;
  pronunciation_dict?: {
    tone: string[];
  };
  voice_modify?: VoiceModify;
  output_format?: OutputFormat;
}

// --- Response Types ---

export interface MiniMaxBaseResponse {
  status_code: number;
  status_msg: string;
}

export interface ExtraInfo {
  audio_length?: number;
  audio_sample_rate?: number;
  audio_bitrate?: number;
  audio_format?: AudioFormat;
  audio_channel?: AudioChannel;
  usage_characters?: number;
  word_count?: number;
}

export interface TTSResponse {
  audio_file?: string;      // URL to audio (when output_format: "url")
  data?: {                  // hex audio data (when output_format: "hex")
    audio: string;
  };
  base_resp: MiniMaxBaseResponse;
  trace_id: string;
  extra_info?: ExtraInfo;
  usage_characters?: number;
}

export interface SSETTSChunk {
  data: {
    audio: string;  // hex-encoded audio chunk
  };
  base_resp: MiniMaxBaseResponse;
  trace_id: string;
  extra_info?: ExtraInfo;
}

// --- Voice Types ---

export interface MiniMaxVoice {
  voice_id: string;
  voice_name?: string;
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  description?: string;
  voice_type: 'system' | 'voice_cloning' | 'voice_generation';
  demo_audio?: string;
  create_time?: number;
  status?: string;
}

export interface GetVoiceRequest {
  voice_type?: VoiceType;
  page_num?: number;
  page_size?: number;
}

export interface GetVoiceResponse {
  voice_list: MiniMaxVoice[];
  total_count: number;
  base_resp: MiniMaxBaseResponse;
}

// --- Voice Clone Types ---

export interface ClonePrompt {
  prompt_audio?: number;   // file_id of prompt audio
  prompt_text?: string;     // text description
}

export interface VoiceCloneRequest {
  file_id: number;
  voice_id: string;
  clone_prompt?: ClonePrompt;
  text?: string;                    // preview text
  model?: MiniMaxModel;
  need_noise_reduction?: boolean;
  need_volume_normalization?: boolean;
}

export interface VoiceCloneResponse {
  demo_audio?: string;
  voice_id: string;
  base_resp: MiniMaxBaseResponse;
  trace_id: string;
}

// --- Voice Design Types ---

export interface VoiceDesignRequest {
  prompt: string;           // voice description, max 500 chars
  preview_text: string;     // text for preview audio
  voice_id?: string;        // custom voice ID, auto-generated if omitted
}

export interface VoiceDesignResponse {
  trial_audio: string;      // hex-encoded audio
  voice_id: string;
  base_resp: MiniMaxBaseResponse;
  trace_id: string;
}

// --- File Upload Types ---

export type UploadPurpose = 'voice_clone' | 'prompt_audio';

export interface FileUploadResponse {
  file_id: number;
  file_name?: string;
  base_resp: MiniMaxBaseResponse;
}

// --- App-level Types ---

export interface PresetVoice {
  id: string;
  name: string;
  language: string;
  languageLabel: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
  tags?: string[];
  sampleText?: string;
}

export interface ClonedVoice {
  voiceId: string;
  name: string;
  createdAt: number;
  demoAudio?: string;
  fileId: number;
}

export interface DesignedVoice {
  voiceId: string;
  prompt: string;
  previewText: string;
  createdAt: number;
  trialAudio?: string;
}

export interface TTSParams {
  model: MiniMaxModel;
  text: string;
  voiceId: string;
  speed: number;
  volume: number;
  pitch: number;
  emotion?: Emotion;
  audioFormat: AudioFormat;
  sampleRate: SampleRate;
  bitrate: number;
  channel: AudioChannel;
  languageBoost: LanguageBoost;
  voiceModify?: VoiceModify;
  pronunciationDict?: PronunciationEntry;
  outputFormat: OutputFormat;
  stream: boolean;
}

export interface TTSHistoryItem {
  id: string;
  timestamp: number;
  params: TTSParams;
  audioUrl?: string;
  audioHex?: string;
  audioLength?: number;
  textPreview: string;
  voiceName: string;
}
