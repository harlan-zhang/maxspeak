'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DesignedVoice } from '@/lib/minimax/types';

function hexToAudioUrl(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

export function VoiceDesignPanel() {
  const settings = useSettingsStore();
  const [prompt, setPrompt] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [isDesigning, setIsDesigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    voiceId: string;
    trialAudio: string;
  } | null>(null);
  const [designedVoices, setDesignedVoices] = useState<DesignedVoice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('tts-designed-voices') || '[]');
      } catch { return []; }
    }
    return [];
  });

  const saveDesignedVoices = (voices: DesignedVoice[]) => {
    setDesignedVoices(voices);
    localStorage.setItem('tts-designed-voices', JSON.stringify(voices));
  };

  const handleDesign = async () => {
    if (!prompt.trim() || !previewText.trim()) return;
    if (prompt.length > 500) {
      setError('提示词不能超过 500 个字符');
      return;
    }

    setError(null);
    setIsDesigning(true);

    try {
      const body = {
        prompt: prompt.trim(),
        preview_text: previewText.trim(),
        ...(voiceId.trim() ? { voice_id: voiceId.trim() } : {}),
      };

      const res = await fetch('/api/voice-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          ...(settings.baseUrl !== 'https://api.minimax.io' ? { 'x-base-url': settings.baseUrl } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Voice design failed');
      }

      const data = await res.json();

      setResult({
        voiceId: data.voice_id,
        trialAudio: data.trial_audio,
      });

      // Save to local list
      const newVoice: DesignedVoice = {
        voiceId: data.voice_id,
        prompt: prompt.trim(),
        previewText: previewText.trim(),
        createdAt: Date.now(),
        trialAudio: data.trial_audio,
      };
      saveDesignedVoices([newVoice, ...designedVoices]);

      // Auto-play trial audio
      if (data.trial_audio) {
        try {
          const url = hexToAudioUrl(data.trial_audio);
          new Audio(url).play().catch(() => {});
        } catch { /* playback failure is non-critical */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Design error');
    } finally {
      setIsDesigning(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setPreviewText('');
    setVoiceId('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(var(--foreground))] tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-500" />
          </div>
          Voice Design
        </h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">
          通过文字描述来创造全新的音色，无需音频样本。费用：预览生成 $30/1M 字符，音色首次使用 ¥9.9。
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <div>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-xs underline mt-1">关闭</button>
          </div>
        </div>
      )}

      {!result ? (
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">
              音色描述 <span className="text-[rgb(var(--muted-foreground))]">({prompt.length}/500)</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="用自然语言描述您想要的音色...&#10;&#10;例如：&#10;• 温柔知性的女性声音，语速适中，适合朗读散文&#10;• 充满活力的年轻男声，快节奏，有感染力，适合产品评测&#10;• 沉稳大气的中年男性播音员，声音浑厚有力"
              rows={4}
              className="input-field resize-none"
              maxLength={500}
            />
          </div>

          <div>
            <label className="label">预览文本</label>
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="输入用于预览音色效果的文本..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="label">自定义音色 ID（可选）</label>
            <input
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="留空则自动生成 ttv-voice- 前缀的 ID"
              className="input-field font-mono text-sm"
            />
          </div>

          {/* Design Tips */}
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 text-xs text-purple-700 dark:text-purple-300 space-y-1">
            <p className="font-medium">💡 设计技巧：</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>描述性别、年龄、语气风格</li>
              <li>可指定语速、音高特征</li>
              <li>可描述情感特点（温柔/活泼/沉稳/激昂）</li>
              <li>可指定使用场景（播音/朗读/对话/配音）</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-xs text-amber-700 dark:text-amber-300">
            💰 预览生成按 $30/1M 字符计费。音色首次 TTS 使用时扣费 ¥9.9。
          </div>

          <button
            onClick={handleDesign}
            disabled={!prompt.trim() || !previewText.trim() || isDesigning}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isDesigning ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                设计中...
              </>
            ) : (
              <>
                <span>✨</span> 生成音色
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">✨</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">音色设计完成!</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              音色 ID: <code className="font-mono text-primary-600">{result.voiceId}</code>
            </p>
          </div>

          {/* Trial Audio */}
          {result.trialAudio && (
            <div>
              <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">试听预览：</p>
              <button
                onClick={() => {
                  try {
                    const url = hexToAudioUrl(result.trialAudio);
                    new Audio(url).play().catch(() => {});
                  } catch {}
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <span>▶</span> 播放试听音频
              </button>
            </div>
          )}

          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300">
            ✅ 音色已保存。在语音合成页面可通过音色 ID 使用此音色。请在 7 天内使用以保持有效。
          </div>

          <button onClick={handleReset} className="btn-primary w-full">
            设计另一个音色
          </button>
        </div>
      )}

      {/* Designed Voices List */}
      {designedVoices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">
            已设计的音色 ({designedVoices.length})
          </h3>
          <div className="space-y-2">
            {designedVoices.map((voice) => (
              <div key={voice.voiceId} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-[rgb(var(--foreground))] font-mono">{voice.voiceId}</div>
                  <span className="text-xs text-[rgb(var(--muted-foreground))]">
                    {new Date(voice.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2 line-clamp-2">
                  描述: {voice.prompt}
                </p>
                <div className="flex gap-2">
                  {voice.trialAudio && (
                    <button
                      onClick={() => {
                        try {
                          const url = hexToAudioUrl(voice.trialAudio!);
                          new Audio(url).play().catch(() => {});
                        } catch {}
                      }}
                      className="btn-ghost text-xs"
                    >
                      ▶ 试听
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const updated = designedVoices.filter(v => v.voiceId !== voice.voiceId);
                      saveDesignedVoices(updated);
                    }}
                    className="btn-ghost text-xs text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
