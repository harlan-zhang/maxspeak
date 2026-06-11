'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { PARAM_RANGES } from '@/lib/minimax/constants';
import { fmt1 } from '@/lib/utils';

export function SpeedPitchControls() {
  const speed = useTTSStore((s) => s.speed);
  const volume = useTTSStore((s) => s.volume);
  const pitch = useTTSStore((s) => s.pitch);
  const setSpeed = useTTSStore((s) => s.setSpeed);
  const setVolume = useTTSStore((s) => s.setVolume);
  const setPitch = useTTSStore((s) => s.setPitch);

  return (
    <div className="card p-3 space-y-3">
      {/* Speed */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">语速</label>
          <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">{fmt1(speed)}x</span>
        </div>
        <input
          type="range"
          min={PARAM_RANGES.speed.min}
          max={PARAM_RANGES.speed.max}
          step={PARAM_RANGES.speed.step}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-[rgb(var(--muted-foreground))]">
          <span>慢</span>
          <span>正常</span>
          <span>快</span>
        </div>
      </div>

      {/* Pitch */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">音高</label>
          <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">{pitch > 0 ? '+' : ''}{pitch}</span>
        </div>
        <input
          type="range"
          min={PARAM_RANGES.pitch.min}
          max={PARAM_RANGES.pitch.max}
          step={PARAM_RANGES.pitch.step}
          value={pitch}
          onChange={(e) => setPitch(parseInt(e.target.value))}
          className="w-full h-1.5 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-[rgb(var(--muted-foreground))]">
          <span>低</span>
          <span>正常</span>
          <span>高</span>
        </div>
      </div>

      {/* Volume */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">音量</label>
          <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">{fmt1(volume)}x</span>
        </div>
        <input
          type="range"
          min={PARAM_RANGES.volume.min}
          max={PARAM_RANGES.volume.max}
          step={PARAM_RANGES.volume.step}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-[rgb(var(--muted-foreground))]">
          <span>轻</span>
          <span>正常</span>
          <span>响</span>
        </div>
      </div>
    </div>
  );
}
