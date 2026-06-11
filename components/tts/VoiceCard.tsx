'use client';

import type { PresetVoice } from '@/lib/minimax/types';
import { cn } from '@/lib/utils';
import { User, UserRound, Bot, Play } from 'lucide-react';

interface VoiceCardProps {
  voice: PresetVoice;
  isSelected: boolean;
  onSelect: () => void;
  onPreview?: (voiceId: string) => void;
  previewLoading?: boolean;
}

export function VoiceCard({ voice, isSelected, onSelect, onPreview, previewLoading }: VoiceCardProps) {
  return (
    <div
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={cn(
        'w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150 text-sm group cursor-pointer',
        isSelected
          ? 'bg-violet-50 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-700'
          : 'hover:bg-[rgb(var(--muted))]'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0">
          {voice.gender === 'female' ? <UserRound size={14} className="text-rose-500" /> : voice.gender === 'male' ? <User size={14} className="text-sky-500" /> : <Bot size={14} className="text-violet-500" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-medium text-[rgb(var(--foreground))] truncate text-xs">
              {voice.name}
            </span>
            {onPreview && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(voice.id); }}
                disabled={previewLoading}
                className={cn(
                  'flex-shrink-0 p-1 rounded-md transition-all opacity-0 group-hover:opacity-100',
                  'hover:bg-violet-100 dark:hover:bg-violet-500/20',
                  'text-[rgb(var(--muted-foreground))] hover:text-violet-600 dark:hover:text-violet-400',
                  previewLoading && 'opacity-100 animate-pulse'
                )}
                title="试听"
              >
                <Play size={12} className="fill-current" />
              </button>
            )}
          </div>
          <div className="text-[10px] text-[rgb(var(--muted-foreground))] truncate">
            {voice.description}
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]">
            {voice.languageLabel.length > 8 ? voice.languageLabel.slice(0, 8) + '…' : voice.languageLabel}
          </span>
        </div>
      </div>
      {voice.tags && voice.tags.length > 0 && (
        <div className="flex gap-1 mt-1 ml-7">
          {voice.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
