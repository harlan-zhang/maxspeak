'use client';

import { useState } from 'react';
import { useTTSStore } from '@/lib/store/useTTSStore';

export function PronunciationEditor() {
  const entries = useTTSStore((s) => s.pronunciationEntries);
  const addEntry = useTTSStore((s) => s.addPronunciationEntry);
  const removeEntry = useTTSStore((s) => s.removePronunciationEntry);
  const [original, setOriginal] = useState('');
  const [pronunciation, setPronunciation] = useState('');

  const handleAdd = () => {
    if (original.trim() && pronunciation.trim()) {
      addEntry(original.trim(), pronunciation.trim());
      setOriginal('');
      setPronunciation('');
    }
  };

  return (
    <div className="card p-3 space-y-3">
      <label className="label">发音词典</label>

      {/* Add form */}
      <div className="flex gap-2">
        <input
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          placeholder="原文 (例: Omg)"
          className="input-field text-xs flex-1"
        />
        <input
          value={pronunciation}
          onChange={(e) => setPronunciation(e.target.value)}
          placeholder="发音 (例: Oh my god)"
          className="input-field text-xs flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={!original.trim() || !pronunciation.trim()}
          className="btn-primary text-xs px-3 py-2 disabled:opacity-50"
        >
          添加
        </button>
      </div>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 bg-[rgb(var(--muted))] rounded-lg text-xs">
              <span className="font-medium text-[rgb(var(--foreground))]">{entry.original}</span>
              <span className="text-[rgb(var(--muted-foreground))]">→</span>
              <span className="text-primary-600 dark:text-primary-400 font-mono">{entry.pronunciation}</span>
              <button
                onClick={() => removeEntry(i)}
                className="ml-auto p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900 text-[rgb(var(--muted-foreground))] hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-[rgb(var(--muted-foreground))]">
        <p>中文发音：使用数字标注声调，如 (cao3)(di1)，1-4 为四声，5 为轻声</p>
        <p>英文发音：如 Omg/Oh my god</p>
      </div>
    </div>
  );
}
