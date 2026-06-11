'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { LANGUAGE_OPTIONS } from '@/lib/voices/languages';
import type { LanguageBoost } from '@/lib/minimax/types';

export function LanguageBoostSelect() {
  const language = useTTSStore((s) => s.languageBoost);
  const setLanguage = useTTSStore((s) => s.setLanguageBoost);

  return (
    <div className="card p-3">
      <label className="label">语言增强</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageBoost)}
        className="input-field text-sm"
      >
        {LANGUAGE_OPTIONS.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.flag || ''} {lang.label} ({lang.nativeLabel})
          </option>
        ))}
      </select>
      <p className="text-[10px] text-[rgb(var(--muted-foreground))] mt-1">
        选择对应语言可获得更好的合成效果。选择"自动检测"由系统判断。
      </p>
    </div>
  );
}
