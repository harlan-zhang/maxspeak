import type { Emotion } from '@/lib/minimax/types';

export interface EmotionOption {
  value: Emotion;
  label: string;
  icon: string;
  description: string;
  models: string[]; // which models support this emotion
}

export const EMOTION_OPTIONS: EmotionOption[] = [
  { value: 'happy', label: '开心', icon: '😊', description: '愉悦、积极的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'sad', label: '悲伤', icon: '😢', description: '低沉、忧伤的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'angry', label: '愤怒', icon: '😠', description: '激烈、愤怒的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'fearful', label: '恐惧', icon: '😨', description: '紧张、害怕的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'disgusted', label: '厌恶', icon: '🤢', description: '反感、厌恶的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'surprised', label: '惊讶', icon: '😲', description: '吃惊、意外的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'neutral', label: '中性/平静', icon: '😐', description: '平稳、不带情绪的语调', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo', 'speech-02-hd', 'speech-02-turbo', 'speech-01-hd', 'speech-01-turbo'] },
  { value: 'fluent', label: '流畅', icon: '💬', description: '快速流畅的语流', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo'] },
  { value: 'whisper', label: '耳语', icon: '🤫', description: '轻声低语', models: ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo'] },
];
