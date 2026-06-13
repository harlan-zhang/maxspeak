'use client';

import { useState } from 'react';
import { Clock3, Plus } from 'lucide-react';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { insertIntoActiveTextarea } from '@/lib/text/insert-at-cursor';
import { cn } from '@/lib/utils';

const QUICK_PAUSES = [0.25, 0.5, 1, 2];
const MIN_PAUSE_SECONDS = 0.01;
const MAX_PAUSE_SECONDS = 99.99;

function formatPauseSeconds(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function normalizePauseSeconds(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  const clamped = Math.min(MAX_PAUSE_SECONDS, Math.max(MIN_PAUSE_SECONDS, parsed));
  return formatPauseSeconds(clamped);
}

export function PauseTagInserter() {
  const text = useTTSStore((s) => s.text);
  const setText = useTTSStore((s) => s.setText);
  const [customSeconds, setCustomSeconds] = useState('0.75');

  const insertPause = (seconds: string) => {
    insertIntoActiveTextarea(text, `<#${seconds}#>`, setText);
  };

  const insertCustomPause = () => {
    const seconds = normalizePauseSeconds(customSeconds);
    if (!seconds) return;

    setCustomSeconds(seconds);
    insertPause(seconds);
  };

  return (
    <div className="card p-3">
      <label className="label flex items-center gap-1.5">
        <Clock3 size={13} />
        停顿标签
      </label>

      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_PAUSES.map((seconds) => {
          const value = formatPauseSeconds(seconds);

          return (
            <button
              key={value}
              onClick={() => insertPause(value)}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-all duration-150',
                'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]',
                'hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300',
                'active:scale-95'
              )}
              title={`插入 ${value} 秒停顿`}
            >
              &lt;#{value}#&gt;
            </button>
          );
        })}

        <div className="flex items-center gap-1 ml-1">
          <input
            type="number"
            min={MIN_PAUSE_SECONDS}
            max={MAX_PAUSE_SECONDS}
            step="0.01"
            value={customSeconds}
            onChange={(event) => setCustomSeconds(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') insertCustomPause();
            }}
            className="input-field w-20 py-1 text-xs"
            aria-label="自定义停顿秒数"
          />
          <button
            onClick={insertCustomPause}
            className="p-1.5 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
            title="插入自定义停顿"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
