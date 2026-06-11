'use client';

import { useState, useMemo } from 'react';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { PRESET_VOICES, VOICE_LANGUAGES, filterVoices } from '@/lib/voices/preset-voices';
import { VoiceCard } from './VoiceCard';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { User, UserRound, Bot } from 'lucide-react';

interface Props {
  onPreviewVoice?: (voiceId: string) => void;
  previewLoading?: string | null;
}

export function VoiceSelector({ onPreviewVoice, previewLoading }: Props) {
  const voiceId = useTTSStore((s) => s.voiceId);
  const setVoiceId = useTTSStore((s) => s.setVoiceId);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  const filtered = useMemo(
    () => filterVoices(PRESET_VOICES, language || undefined, search || undefined, gender || undefined),
    [language, search, gender]
  );

  const selectedVoice = PRESET_VOICES.find(v => v.id === voiceId);

  return (
    <div className="card p-3">
      <label className="label">音色选择</label>

      {/* Selected Voice Display */}
      {selectedVoice && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-primary-50 dark:bg-primary-950 rounded-lg">
          <span className="flex-shrink-0">
            {selectedVoice.gender === 'female' ? <UserRound size={14} className="text-rose-500" /> : selectedVoice.gender === 'male' ? <User size={14} className="text-sky-500" /> : <Bot size={14} className="text-violet-500" />}
          </span>
          <span className="text-sm font-medium text-[rgb(var(--foreground))] truncate">{selectedVoice.name}</span>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">{selectedVoice.languageLabel}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search voices..."
          className="input-field text-sm pl-8"
        />
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input-field text-xs py-1 flex-1"
        >
          <option value="">全部语言</option>
          {VOICE_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="input-field text-xs py-1 w-24"
        >
          <option value="">全部</option>
          <option value="male">男声</option>
          <option value="female">女声</option>
          <option value="neutral">中性</option>
        </select>
      </div>

      {/* Voice List */}
      <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-[rgb(var(--muted-foreground))] text-center py-4">
            未找到匹配的音色
          </p>
        )}
        {filtered.slice(0, 100).map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            isSelected={voice.id === voiceId}
            onSelect={() => setVoiceId(voice.id)}
            onPreview={onPreviewVoice}
            previewLoading={previewLoading === voice.id}
          />
        ))}
        {filtered.length > 100 && (
          <p className="text-xs text-[rgb(var(--muted-foreground))] text-center py-2">
            显示前 100 个结果，请使用搜索或过滤缩小范围
          </p>
        )}
      </div>
    </div>
  );
}
