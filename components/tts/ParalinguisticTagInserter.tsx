'use client';

import { useRef } from 'react';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { PARALINGUISTIC_TAGS, PARALINGUISTIC_CATEGORIES, PARALINGUISTIC_SUPPORTED_MODELS } from '@/lib/voices/paralinguistic';
import { cn } from '@/lib/utils';

export function ParalinguisticTagInserter() {
  const setText = useTTSStore((s) => s.setText);
  const text = useTTSStore((s) => s.text);
  const model = useTTSStore((s) => s.model);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isSupported = PARALINGUISTIC_SUPPORTED_MODELS.includes(model);

  const insertTag = (tagText: string) => {
    // Find the textarea in the DOM and insert at cursor position
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.slice(0, start) + tagText + text.slice(end);
      setText(newText);
      // Restore cursor position after React re-render
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagText.length, start + tagText.length);
      }, 0);
    } else {
      setText(text + tagText);
    }
  };

  if (!isSupported) {
    return (
      <div className="card p-3">
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          💡 副语言标签仅支持 speech-2.8-hd / speech-2.8-turbo 模型。请切换模型以使用此功能。
        </p>
      </div>
    );
  }

  return (
    <div className="card p-3">
      <label className="label">副语言标签（点击插入到光标位置）</label>
      <div className="space-y-2">
        {PARALINGUISTIC_CATEGORIES.map((cat) => {
          const tags = PARALINGUISTIC_TAGS.filter(t => t.category === cat.key);
          if (tags.length === 0) return null;
          return (
            <div key={cat.key}>
              <span className="text-[10px] text-[rgb(var(--muted-foreground))] mb-1 block">{cat.label}</span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => insertTag(tag.insertText)}
                    className={cn(
                      'px-2 py-1 rounded-md text-xs font-medium transition-all duration-150',
                      'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]',
                      'hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300',
                      'active:scale-95'
                    )}
                    title={tag.label}
                  >
                    {tag.icon} {tag.insertText}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
