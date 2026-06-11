'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { EMOTION_OPTIONS } from '@/lib/voices/emotions';
import { cn } from '@/lib/utils';
import type { Emotion } from '@/lib/minimax/types';

export function EmotionTags() {
  const emotion = useTTSStore((s) => s.emotion);
  const setEmotion = useTTSStore((s) => s.setEmotion);
  const model = useTTSStore((s) => s.model);

  const modelSupportsEmotion = (emotionOption: typeof EMOTION_OPTIONS[number]) => {
    return emotionOption.models.includes(model);
  };

  return (
    <div className="card p-3">
      <label className="label">情感标签</label>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setEmotion(undefined)}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
            !emotion
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300'
              : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          无
        </button>
        {EMOTION_OPTIONS.map((opt) => {
          const supported = modelSupportsEmotion(opt);
          return (
            <button
              key={opt.value}
              onClick={() => supported && setEmotion(opt.value)}
              disabled={!supported}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                emotion === opt.value
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300'
                  : supported
                  ? 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-transparent text-[rgb(var(--muted-foreground))]/40 cursor-not-allowed'
              )}
              title={opt.description + (supported ? '' : ' (当前模型不支持)')}
            >
              {opt.icon} {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
