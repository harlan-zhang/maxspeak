'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { MODELS } from '@/lib/minimax/constants';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const model = useTTSStore((s) => s.model);
  const setModel = useTTSStore((s) => s.setModel);

  return (
    <div className="card p-3">
      <label className="label">合成模型</label>
      <select
        value={model}
        onChange={(e) => setModel(e.target.value as typeof model)}
        className="input-field"
      >
        <optgroup label="最新">
          {MODELS.filter(m => m.tier === 'latest').map(m => (
            <option key={m.value} value={m.value}>{m.label} — {m.description}</option>
          ))}
        </optgroup>
        <optgroup label="上一代">
          {MODELS.filter(m => m.tier === 'previous').map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </optgroup>
        <optgroup label="旧版">
          {MODELS.filter(m => m.tier === 'legacy').map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
