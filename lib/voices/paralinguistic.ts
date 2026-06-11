import type { ParalinguisticTag } from '@/lib/minimax/types';

export interface ParalinguisticOption {
  value: ParalinguisticTag;
  label: string;
  icon: string;
  category: string;
  insertText: string; // e.g. "(sighs)"
}

export const PARALINGUISTIC_TAGS: ParalinguisticOption[] = [
  // Breathing & Vocalizations
  { value: 'sighs', label: '叹气', icon: '😮‍💨', category: '呼吸/发声', insertText: '(sighs)' },
  { value: 'breath', label: '呼吸', icon: '🌬️', category: '呼吸/发声', insertText: '(breath)' },
  { value: 'inhale', label: '吸气', icon: '🫁', category: '呼吸/发声', insertText: '(inhale)' },
  { value: 'exhale', label: '呼气', icon: '💨', category: '呼吸/发声', insertText: '(exhale)' },
  { value: 'pant', label: '喘息', icon: '😤', category: '呼吸/发声', insertText: '(pant)' },
  { value: 'gasps', label: '倒抽气', icon: '😱', category: '呼吸/发声', insertText: '(gasps)' },
  { value: 'groans', label: '呻吟', icon: '😩', category: '呼吸/发声', insertText: '(groans)' },

  // Laughter & Emotion
  { value: 'laughs', label: '大笑', icon: '😂', category: '笑声/情感', insertText: '(laughs)' },
  { value: 'chuckle', label: '轻笑', icon: '😄', category: '笑声/情感', insertText: '(chuckle)' },
  { value: 'crying', label: '哭泣', icon: '😭', category: '笑声/情感', insertText: '(crying)' },
  { value: 'emm', label: '嗯...', icon: '🤔', category: '笑声/情感', insertText: '(emm)' },

  // Body Sounds
  { value: 'coughs', label: '咳嗽', icon: '😷', category: '身体音效', insertText: '(coughs)' },
  { value: 'clear-throat', label: '清嗓子', icon: '🗣️', category: '身体音效', insertText: '(clear-throat)' },
  { value: 'sniffs', label: '抽鼻子', icon: '🤧', category: '身体音效', insertText: '(sniffs)' },
  { value: 'snorts', label: '哼气', icon: '🐽', category: '身体音效', insertText: '(snorts)' },
  { value: 'burps', label: '打嗝', icon: '🤭', category: '身体音效', insertText: '(burps)' },
  { value: 'sneezes', label: '打喷嚏', icon: '🤧', category: '身体音效', insertText: '(sneezes)' },
  { value: 'lip-smacking', label: '咂嘴', icon: '👄', category: '身体音效', insertText: '(lip-smacking)' },

  // Sounds & Actions
  { value: 'humming', label: '哼唱', icon: '🎵', category: '声音/动作', insertText: '(humming)' },
  { value: 'whistles', label: '吹口哨', icon: '🎶', category: '声音/动作', insertText: '(whistles)' },
  { value: 'hissing', label: '嘶嘶声', icon: '🐍', category: '声音/动作', insertText: '(hissing)' },
  { value: 'applause', label: '鼓掌', icon: '👏', category: '声音/动作', insertText: '(applause)' },
];

// Supported models: speech-2.8-hd, speech-2.8-turbo only
export const PARALINGUISTIC_SUPPORTED_MODELS = ['speech-2.8-hd', 'speech-2.8-turbo'];

// Categories for grouping
export const PARALINGUISTIC_CATEGORIES = [
  { key: '呼吸/发声', label: '呼吸 / 发声' },
  { key: '笑声/情感', label: '笑声 / 情感' },
  { key: '身体音效', label: '身体音效' },
  { key: '声音/动作', label: '声音 / 动作' },
];
