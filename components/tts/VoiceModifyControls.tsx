'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { SOUND_EFFECTS } from '@/lib/minimax/constants';
import type { VoiceModify } from '@/lib/minimax/types';

export function VoiceModifyControls() {
  const voiceModify = useTTSStore((s) => s.voiceModify);
  const setVoiceModify = useTTSStore((s) => s.setVoiceModify);

  const update = (key: keyof VoiceModify, value: number | string | undefined) => {
    const current = voiceModify || {};
    if (value === '' || value === undefined) {
      const next = { ...current };
      delete next[key];
      if (Object.keys(next).length === 0) {
        setVoiceModify(undefined);
        return;
      }
      setVoiceModify(next);
      return;
    }
    setVoiceModify({ ...current, [key]: value });
  };

  const hasValue = (key: keyof VoiceModify) => {
    return voiceModify && voiceModify[key] !== undefined && voiceModify[key] !== '';
  };

  return (
    <div className="card p-3 space-y-3">
      <label className="label">声音修饰 (Voice Modify)</label>

      {/* Pitch */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">音高修饰</span>
          <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">
            {hasValue('pitch') ? voiceModify?.pitch : '默认'}
          </span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={voiceModify?.pitch ?? 0}
          onChange={(e) => update('pitch', parseInt(e.target.value))}
          className="w-full h-1.5 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Intensity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">强度 / 能量</span>
          <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">
            {hasValue('intensity') ? voiceModify?.intensity : '默认'}
          </span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={voiceModify?.intensity ?? 0}
          onChange={(e) => update('intensity', parseInt(e.target.value))}
          className="w-full h-1.5 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Timbre */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">音色</span>
          <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">
            {hasValue('timbre') ? voiceModify?.timbre : '默认'}
          </span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={voiceModify?.timbre ?? 0}
          onChange={(e) => update('timbre', parseInt(e.target.value))}
          className="w-full h-1.5 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Sound Effects */}
      <div>
        <label className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">音效预设</label>
        <select
          value={voiceModify?.sound_effects || ''}
          onChange={(e) => update('sound_effects', e.target.value || undefined)}
          className="input-field text-xs"
        >
          {SOUND_EFFECTS.map((se) => (
            <option key={se.value} value={se.value}>{se.label}</option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {voiceModify && (
        <button
          onClick={() => setVoiceModify(undefined)}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          重置所有修饰
        </button>
      )}
    </div>
  );
}
