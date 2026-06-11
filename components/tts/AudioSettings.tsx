'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { AUDIO_FORMATS, SAMPLE_RATES, BITRATES, CHANNELS } from '@/lib/minimax/constants';
import type { AudioFormat, SampleRate, AudioChannel } from '@/lib/minimax/types';

export function AudioSettings() {
  const audioFormat = useTTSStore((s) => s.audioFormat);
  const sampleRate = useTTSStore((s) => s.sampleRate);
  const bitrate = useTTSStore((s) => s.bitrate);
  const channel = useTTSStore((s) => s.channel);
  const setAudioFormat = useTTSStore((s) => s.setAudioFormat);
  const setSampleRate = useTTSStore((s) => s.setSampleRate);
  const setBitrate = useTTSStore((s) => s.setBitrate);
  const setChannel = useTTSStore((s) => s.setChannel);

  return (
    <div className="card p-3 space-y-3">
      <label className="label">音频格式设置</label>

      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">输出格式</span>
        <div className="flex gap-1">
          {AUDIO_FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setAudioFormat(fmt.value as AudioFormat)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                audioFormat === fmt.value
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300'
                  : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
        {audioFormat === 'wav' && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
            WAV 格式不支持流式输出
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">采样率</span>
          <select
            value={sampleRate}
            onChange={(e) => setSampleRate(Number(e.target.value) as SampleRate)}
            className="input-field text-xs"
          >
            {SAMPLE_RATES.map((sr) => (
              <option key={sr.value} value={sr.value}>{sr.label}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">码率</span>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(Number(e.target.value))}
            className="input-field text-xs"
          >
            {BITRATES.map((br) => (
              <option key={br.value} value={br.value}>{br.label}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">声道</span>
          <select
            value={channel}
            onChange={(e) => setChannel(Number(e.target.value) as AudioChannel)}
            className="input-field text-xs"
          >
            {CHANNELS.map((ch) => (
              <option key={ch.value} value={ch.value}>{ch.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
