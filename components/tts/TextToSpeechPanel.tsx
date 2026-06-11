'use client';

import { useState, useCallback } from 'react';
import { TextInput } from './TextInput';
import { VoiceSelector } from './VoiceSelector';
import { ModelSelector } from './ModelSelector';
import { EmotionTags } from './EmotionTags';
import { ParalinguisticTagInserter } from './ParalinguisticTagInserter';
import { SpeedPitchControls } from './SpeedPitchControls';
import { VoiceModifyControls } from './VoiceModifyControls';
import { AudioSettings } from './AudioSettings';
import { LanguageBoostSelect } from './LanguageBoostSelect';
import { PronunciationEditor } from './PronunciationEditor';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { estimateCost } from '@/lib/utils';
import { hexAudioToBlob, formatToExtension } from '@/lib/audio/utils';
import { stopCurrent } from '@/lib/audio/player';
import { streamAndPlay } from '@/lib/audio/stream-decoder';
import { PRICING, PARAM_RANGES } from '@/lib/minimax/constants';
import { AudioLines, Radio, AlertCircle, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRESET_VOICES } from '@/lib/voices/preset-voices';

export function TextToSpeechPanel() {
  const tts = useTTSStore();
  const player = usePlayerStore();
  const settings = useSettingsStore();
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const shouldStream = tts.stream || (settings.autoStream && tts.text.length > PARAM_RANGES.streamingTextThreshold);

  // Preview voice from selector
  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    if (!settings.apiKey) return;
    setPreviewLoading(voiceId);
    try {
      const voice = PRESET_VOICES.find(v => v.id === voiceId);
      const langMap: Record<string, string> = { 'Chinese': 'Chinese', 'English': 'English', 'Japanese': 'Japanese', 'Korean': 'Korean', 'Cantonese': 'Chinese,Yue', 'Spanish': 'Spanish', 'French': 'French', 'Portuguese': 'Portuguese', 'German': 'German', 'Russian': 'Russian', 'Arabic': 'Arabic', 'Italian': 'Italian' };
      const languageBoost = voice ? (langMap[voice.language] || 'auto') : 'auto';
      const sampleText = voice?.sampleText || 'Hello, voice preview.';
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': settings.apiKey, 'x-base-url': settings.baseUrl },
        body: JSON.stringify({ model: 'speech-2.8-turbo', text: sampleText, voice_setting: { voice_id: voiceId }, audio_setting: { sample_rate: 24000, bitrate: 64000, format: 'mp3', channel: 1 }, language_boost: languageBoost, output_format: 'url' }),
      });
      if (!res.ok) return;
      const ct = res.headers.get('content-type') || '';
      const audioUrl = ct.startsWith('audio/') ? URL.createObjectURL(await res.blob()) : (await res.json()).audio_file;
      if (audioUrl) { const a = new Audio(audioUrl); a.play().catch(() => {}); }
    } catch {} finally { setPreviewLoading(null); }
  }, [settings]);

  const handleSynthesize = useCallback(async () => {
    if (!tts.text.trim()) {
      setError('请输入需要合成的文本');
      return;
    }

    setError(null);
    setIsSynthesizing(true);
    player.setLoading(true);
    stopCurrent();

    const requestBody = {
      model: tts.model,
      text: tts.text,
      voice_setting: {
        voice_id: tts.voiceId,
        speed: tts.speed,
        vol: tts.volume,
        pitch: tts.pitch,
        ...(tts.emotion ? { emotion: tts.emotion } : {}),
      },
      audio_setting: {
        sample_rate: tts.sampleRate,
        bitrate: tts.bitrate,
        format: tts.audioFormat,
        channel: tts.channel,
      },
      language_boost: tts.languageBoost,
      ...(tts.voiceModify && Object.keys(tts.voiceModify).length > 0
        ? { voice_modify: tts.voiceModify }
        : {}
      ),
      ...(tts.pronunciationEntries.length > 0
        ? {
            pronunciation_dict: {
              tone: tts.pronunciationEntries.map(
                (e) => `${e.original}/${e.pronunciation}`
              ),
            },
          }
        : {}
      ),
      output_format: 'url' as const, // URL mode respects audio_setting.format
    };

    try {
      if (shouldStream) {
        // -------- STREAMING PATH --------
        player.setStreaming(true);

        const response = await fetch('/api/tts/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'x-base-url': settings.baseUrl,
          },
          body: JSON.stringify({ ...requestBody, stream: true }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Stream request failed' }));
          throw new Error(err.error || `Stream error: ${response.status}`);
        }

        // Check if response is actually SSE or JSON error
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errData = await response.json();
          throw new Error(errData.error || 'Stream API returned JSON instead of SSE');
        }

        await streamAndPlay(
          response,
          () => {
            player.setStreaming(false);
            player.setLoading(false);
          },
          (err) => {
            setError(err.message);
            player.setStreaming(false);
            player.setLoading(false);
          }
        );
      } else {
        // -------- SYNCHRONOUS PATH --------
        const res = await fetch('/api/tts/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'x-base-url': settings.baseUrl,
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `API error: ${res.status}` }));
          throw new Error(err.error || `API error: ${res.status}`);
        }

        const resContentType = res.headers.get('content-type') || '';

        if (resContentType.startsWith('audio/')) {
          // ── Server returned raw audio bytes (proxied CDN download) ──
          const audioBlob = await res.blob();
          const actualType = resContentType;
          const actualExt = actualType.includes('wav') ? 'wav'
            : actualType.includes('flac') ? 'flac'
            : actualType.includes('mpeg') ? 'mp3'
            : formatToExtension(tts.audioFormat);
          const fileName = `tts-${Date.now()}.${actualExt}`;

          // Parse metadata from custom headers
          const audioLength = res.headers.get('X-Audio-Duration');

          const blobUrl = URL.createObjectURL(audioBlob);
          player.setAudioUrl(blobUrl);
          player.setLastGeneratedAudio({
            url: blobUrl,
            format: tts.audioFormat,
            fileName,
          });

          if (audioLength) {
            player.setDuration(Number(audioLength) / 1000);
          }

          if (settings.autoPlay) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                (window as any).__audioPlayerPlay?.();
              });
            });
          }
        } else {
          // ── JSON response (fallback: CDN URL or hex data) ──
          const data = await res.json();

          if (data.audio_file) {
            const fileName = `tts-${Date.now()}.${formatToExtension(tts.audioFormat)}`;
            player.setAudioUrl(data.audio_file);
            player.setLastGeneratedAudio({ url: data.audio_file, format: tts.audioFormat, fileName });
            if (data.extra_info?.audio_length) {
              player.setDuration(data.extra_info.audio_length / 1000);
            }
            if (settings.autoPlay) {
              requestAnimationFrame(() => requestAnimationFrame(() => {
                (window as any).__audioPlayerPlay?.();
              }));
            }
          } else if (data.data?.audio) {
            const blob = hexAudioToBlob(data.data.audio, tts.audioFormat, tts.sampleRate);
            const blobUrl = URL.createObjectURL(blob);
            const fileName = `tts-${Date.now()}.${formatToExtension(tts.audioFormat)}`;
            player.setAudioUrl(blobUrl);
            player.setLastGeneratedAudio({ hex: data.data.audio, format: tts.audioFormat, fileName });
            if (settings.autoPlay) {
              requestAnimationFrame(() => requestAnimationFrame(() => {
                (window as any).__audioPlayerPlay?.();
              }));
            }
          } else {
            throw new Error('API 未返回音频数据。请检查 API Key 和音色 ID 是否正确。');
          }
        }

        player.setLoading(false);
      }

      // Log cost estimate
      const cost = estimateCost(tts.text, tts.model, PRICING);
      console.log(`TTS cost: ${cost}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '发生未知错误，请重试';
      setError(message);
      player.setLoading(false);
      player.setStreaming(false);
    } finally {
      setIsSynthesizing(false);
    }
  }, [tts.text, tts.model, tts.voiceId, tts.speed, tts.volume, tts.pitch, tts.emotion, tts.audioFormat, tts.sampleRate, tts.bitrate, tts.channel, tts.languageBoost, tts.voiceModify, tts.pronunciationEntries, shouldStream, settings, player]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Text Input & Core Controls */}
        <div className="lg:col-span-2 space-y-4">
          <TextInput />

          {/* Paralinguistic Tags */}
          <ParalinguisticTagInserter />

          {/* Synthesize Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !tts.text.trim()}
              className={cn(
                'btn-primary flex items-center gap-2 px-6 py-2.5 text-base',
                isSynthesizing && 'animate-pulse'
              )}
            >
              {isSynthesizing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {shouldStream ? '流式合成中...' : '合成中...'}
                </>
              ) : (
                <>
                  <span className="text-lg">{shouldStream ? <Radio size={18} /> : <AudioLines size={18} />}</span>
                  {shouldStream ? '流式合成并播放' : '合成并播放'}
                </>
              )}
            </button>

            {/* Cost Estimate */}
            {tts.text.trim() && !isSynthesizing && (
              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                预估费用: {estimateCost(tts.text, tts.model, PRICING)}
              </span>
            )}

            {/* Stream toggle */}
            <label className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] cursor-pointer">
              <input
                type="checkbox"
                checked={tts.stream}
                onChange={(e) => tts.setStream(e.target.checked)}
                className="rounded"
              />
              流式
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="whitespace-pre-wrap">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs underline mt-1 hover:no-underline"
                >
                  关闭
                </button>
              </div>
            </div>
          )}

          {/* Status tips */}
          {player.audioUrl && !isSynthesizing && !player.isStreaming && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300">
              <CircleCheck size={14} className="text-emerald-500 inline mr-1" />音频已就绪，点击下方播放按钮试听或下载
            </div>
          )}
        </div>

        {/* Right: Voice & Audio Settings */}
        <div className="space-y-4">
          <ModelSelector />
          <VoiceSelector onPreviewVoice={handlePreviewVoice} previewLoading={previewLoading} />
          <EmotionTags />
          <SpeedPitchControls />

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors w-full"
          >
            <svg
              className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-90')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            高级设置
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-slide-up">
              <VoiceModifyControls />
              <AudioSettings />
              <LanguageBoostSelect />
              <PronunciationEditor />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
