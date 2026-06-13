'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { PARAM_RANGES } from '@/lib/minimax/constants';

export function TextInput() {
  const text = useTTSStore((s) => s.text);
  const setText = useTTSStore((s) => s.setText);
  const charCount = text.length;

  const isOverLimit = charCount > PARAM_RANGES.textMaxLength;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">文本内容</label>
        <span className={`text-xs ${isOverLimit ? 'text-red-500 font-medium' : 'text-[rgb(var(--muted-foreground))]'}`}>
          {charCount} / {PARAM_RANGES.textMaxLength}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请输入需要合成语音的文本...&#10;&#10;支持停顿标签和副语言标签，例如：&#10;第一句结束。<#0.5#>第二句开始。&#10;Omg(sighs), the real danger is not that computers start thinking like people..."
        rows={6}
        className={`input-field resize-none font-sans ${isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      {isOverLimit && (
        <p className="text-xs text-red-500 mt-1">
          超过字数限制，同步模式下最多 {PARAM_RANGES.textMaxLength} 字符。请使用流式合成或缩短文本。
        </p>
      )}
    </div>
  );
}
