'use client';

import { useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { validateVoiceId } from '@/lib/utils';
import { MODELS } from '@/lib/minimax/constants';
import type { ClonedVoice, MiniMaxModel } from '@/lib/minimax/types';
import { cn } from '@/lib/utils';
import { Mic, Upload, Check, Info } from 'lucide-react';

export function VoiceClonePanel() {
  const settings = useSettingsStore();
  const [step, setStep] = useState<'upload' | 'configure' | 'result'>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [promptFile, setPromptFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<number | null>(null);
  const [promptFileId, setPromptFileId] = useState<number | null>(null);
  const [voiceId, setVoiceId] = useState('');
  const [previewText, setPreviewText] = useState('一阵微风拂过柔软的草地，带来了远处花香的味道。');
  const [model, setModel] = useState<MiniMaxModel>('speech-2.8-hd');
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [volumeNormalization, setVolumeNormalization] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAudio, setDemoAudio] = useState<string | null>(null);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('tts-cloned-voices') || '[]');
      } catch { return []; }
    }
    return [];
  });

  const saveClonedVoices = (voices: ClonedVoice[]) => {
    setClonedVoices(voices);
    localStorage.setItem('tts-cloned-voices', JSON.stringify(voices));
  };

  const handleUpload = async () => {
    if (!audioFile) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('purpose', 'voice_clone');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-api-key': settings.apiKey,
          ...(settings.baseUrl !== 'https://api.minimax.io' ? { 'x-base-url': settings.baseUrl } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setFileId(data.file_id);

      // Upload prompt audio if provided
      if (promptFile) {
        const promptForm = new FormData();
        promptForm.append('file', promptFile);
        promptForm.append('purpose', 'prompt_audio');

        const promptRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-api-key': settings.apiKey,
            ...(settings.baseUrl !== 'https://api.minimax.io' ? { 'x-base-url': settings.baseUrl } : {}),
          },
          body: promptForm,
        });

        if (promptRes.ok) {
          const promptData = await promptRes.json();
          setPromptFileId(promptData.file_id);
        }
      }

      setStep('configure');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClone = async () => {
    if (!fileId || !voiceId.trim()) return;

    const validation = validateVoiceId(voiceId);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError(null);
    setIsCloning(true);

    try {
      const body = {
        file_id: fileId,
        voice_id: voiceId,
        text: previewText,
        model,
        need_noise_reduction: noiseReduction,
        need_volume_normalization: volumeNormalization,
        ...(promptFileId ? { clone_prompt: { prompt_audio: promptFileId } } : {}),
      };

      const res = await fetch('/api/voices/clone', {
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
        throw new Error(err.error || 'Clone failed');
      }

      const data = await res.json();
      setDemoAudio(data.demo_audio || null);

      // Save to local list
      const newVoice: ClonedVoice = {
        voiceId: data.voice_id || voiceId,
        name: voiceId,
        createdAt: Date.now(),
        demoAudio: data.demo_audio,
        fileId,
      };
      saveClonedVoices([newVoice, ...clonedVoices]);

      setStep('result');

      // Auto-play preview if available
      if (data.demo_audio) {
        try {
          const a = new Audio(data.demo_audio);
        a.play().catch(() => {});
        } catch { /* preview playback failure is non-critical */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone error');
    } finally {
      setIsCloning(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setAudioFile(null);
    setPromptFile(null);
    setFileId(null);
    setPromptFileId(null);
    setVoiceId('');
    setDemoAudio(null);
    setError(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(var(--foreground))] tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center">
            <Mic size={16} className="text-cyan-500" />
          </div>
          Voice Clone
        </h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">
          上传一段音频样本，复刻您想要的音色。费用 ¥9.9/音色（首次使用时扣费）。
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

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="card p-6 space-y-4">
          {/* Main audio upload */}
          <div>
            <label className="label">音频样本（必选）</label>
            <AudioUploadArea
              file={audioFile}
              onFileSelect={setAudioFile}
              accept="audio/mp3,audio/m4a,audio/wav,.mp3,.m4a,.wav"
              description="拖拽或点击上传 mp3 / m4a / wav 文件，10秒~5分钟，最大 20MB"
            />
            {audioFile && (
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                已选择: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>

          {/* Prompt audio upload (optional) */}
          <div>
            <label className="label">提示音频（可选）</label>
            <AudioUploadArea
              file={promptFile}
              onFileSelect={setPromptFile}
              accept="audio/mp3,audio/m4a,audio/wav,.mp3,.m4a,.wav"
              description="上传一段 8 秒以内的参考音频以获得更好的复刻质量"
            />
            {promptFile && (
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                已选择: {promptFile.name}
              </p>
            )}
          </div>

          {/* Requirements note */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-medium">📋 音频要求：</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>格式：mp3 / m4a / wav</li>
              <li>时长：10秒 ~ 5分钟（建议 30秒以上）</li>
              <li>大小：不超过 20MB</li>
              <li>内容：清晰的语音，背景噪音尽量少</li>
            </ul>
          </div>

          <button
            onClick={handleUpload}
            disabled={!audioFile || isUploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                上传中...
              </>
            ) : (
              <>
                <span>📤</span> 上传音频
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 'configure' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <span>✅</span> 音频上传成功 (File ID: {fileId})
            {promptFileId && <span className="text-xs">, 提示音频 ID: {promptFileId}</span>}
          </div>

          <div>
            <label className="label">自定义音色 ID</label>
            <input
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="例如: MyCustomVoice001"
              className="input-field font-mono text-sm"
            />
            <p className="text-[10px] text-[rgb(var(--muted-foreground))] mt-1">
              8-256个字符，以字母开头，只能包含字母、数字、连字符和下划线
            </p>
          </div>

          <div>
            <label className="label">预览文本</label>
            <input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">模型</label>
            <select value={model} onChange={(e) => setModel(e.target.value as MiniMaxModel)} className="input-field">
              {MODELS.filter(m => m.tier === 'latest').map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={noiseReduction}
                onChange={(e) => setNoiseReduction(e.target.checked)}
                className="rounded"
              />
              降噪
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={volumeNormalization}
                onChange={(e) => setVolumeNormalization(e.target.checked)}
                className="rounded"
              />
              音量归一化
            </label>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-xs text-amber-700 dark:text-amber-300">
            💰 此音色首次使用时将扣费 ¥9.9。预览音频按标准 TTS 费率计费。音色闲置 7 天后将过期。
          </div>

          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-secondary flex-1">
              返回
            </button>
            <button
              onClick={handleClone}
              disabled={!voiceId.trim() || isCloning}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isCloning ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  复刻中...
                </>
              ) : (
                <>
                  <span>🎙️</span> 创建音色复刻
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && (
        <div className="card p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">音色复刻成功!</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              音色 ID: <code className="font-mono text-primary-600">{voiceId}</code>
            </p>
          </div>

          {demoAudio && (
            <div>
              <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">试听预览：</p>
              <audio controls className="w-full h-10" src={demoAudio}>
                您的浏览器不支持音频播放
              </audio>
            </div>
          )}

          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300">
            ✅ 音色已保存。在语音合成页面选择音色时可在自定义音色中找到它。请在 7 天内使用以保持有效。
          </div>

          <button onClick={handleReset} className="btn-primary w-full">
            复刻另一个音色
          </button>
        </div>
      )}

      {/* Cloned Voices List */}
      {clonedVoices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">
            已复刻的音色 ({clonedVoices.length})
          </h3>
          <div className="space-y-2">
            {clonedVoices.map((voice) => (
              <div key={voice.voiceId} className="card p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[rgb(var(--foreground))] font-mono">{voice.voiceId}</div>
                  <div className="text-xs text-[rgb(var(--muted-foreground))]">
                    创建于 {new Date(voice.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="flex gap-2">
                  {voice.demoAudio && (
                    <button
                      onClick={() => {
                        try {
                          new Audio(voice.demoAudio).play().catch(() => {});
                        } catch {}
                      }}
                      className="btn-ghost text-xs"
                    >
                      ▶ 试听
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const updated = clonedVoices.filter(v => v.voiceId !== voice.voiceId);
                      saveClonedVoices(updated);
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

function AudioUploadArea({
  file,
  onFileSelect,
  accept,
  description,
}: {
  file: File | null;
  onFileSelect: (f: File) => void;
  accept: string;
  description: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFileSelect(f);
      }}
      className={cn(
        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-primary-400 bg-primary-50 dark:bg-primary-950'
          : 'border-[rgb(var(--border))] hover:border-primary-300 hover:bg-[rgb(var(--muted))]'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
        }}
      />
      <div className="text-2xl mb-2">{file ? '✅' : '📁'}</div>
      <p className="text-sm text-[rgb(var(--foreground))] font-medium">
        {file ? file.name : '点击或拖拽上传音频文件'}
      </p>
      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{description}</p>
    </div>
  );
}
