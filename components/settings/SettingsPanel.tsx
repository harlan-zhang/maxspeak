'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { MINIMAX_API_BASE, MINIMAX_API_BASE_CN, MODELS, AUDIO_FORMATS, SAMPLE_RATES, BITRATES, CHANNELS } from '@/lib/minimax/constants';
import { LANGUAGE_OPTIONS } from '@/lib/voices/languages';
import { cn } from '@/lib/utils';
import type { MiniMaxModel, AudioFormat, SampleRate, AudioChannel, LanguageBoost } from '@/lib/minimax/types';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = useSettingsStore();
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin m-4 animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">设置</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <svg className="w-5 h-5 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <section>
            <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">API 配置</h3>

            <div className="space-y-4">
              <div>
                <label className="label">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) => settings.setApiKey(e.target.value)}
                    placeholder="输入你的 MiniMax API Key..."
                    className="input-field pr-10 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[rgb(var(--muted))]"
                    title={showKey ? '隐藏' : '显示'}
                  >
                    <svg className="w-4 h-4 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showKey ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M15 12a3 3 0 00-3-3" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                  在 <a href={settings.baseUrl.includes('minimaxi.com') ? 'https://platform.minimaxi.com' : 'https://platform.minimax.io'} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{settings.baseUrl.includes('minimaxi.com') ? 'platform.minimaxi.com' : 'platform.minimax.io'}</a> 获取 API Key
                </p>
              </div>

              <div>
                <label className="label">API 服务器</label>
                <select
                  value={settings.baseUrl}
                  onChange={(e) => settings.setBaseUrl(e.target.value)}
                  className="input-field"
                >
                  <option value={MINIMAX_API_BASE}>国际 (api.minimax.io)</option>
                  <option value={MINIMAX_API_BASE_CN}>国内 (api.minimaxi.com)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.directConnect}
                  onChange={(e) => settings.setDirectConnect(e.target.checked)}
                  className="rounded border-[rgb(var(--border))]"
                />
                <span className="text-sm text-[rgb(var(--foreground))]">直连模式</span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ 浏览器直连 MiniMax API（不安全，仅用于静态部署）
                </span>
              </label>
            </div>
          </section>

          {/* Default TTS Preferences */}
          <section>
            <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">默认合成参数</h3>

            <div className="space-y-3">
              <SelectField
                label="默认模型"
                value={settings.defaultModel}
                onChange={(v) => settings.setDefaultModel(v as MiniMaxModel)}
                options={MODELS.map(m => ({ value: m.value, label: m.label }))}
              />

              <SelectField
                label="默认格式"
                value={settings.defaultFormat}
                onChange={(v) => settings.setDefaultFormat(v as AudioFormat)}
                options={AUDIO_FORMATS.map(f => ({ value: f.value, label: f.label }))}
              />

              <SelectField
                label="默认采样率"
                value={String(settings.defaultSampleRate)}
                onChange={(v) => settings.setDefaultSampleRate(Number(v) as SampleRate)}
                options={SAMPLE_RATES.map(s => ({ value: String(s.value), label: s.label }))}
              />

              <SelectField
                label="默认码率"
                value={String(settings.defaultBitrate)}
                onChange={(v) => settings.setDefaultBitrate(Number(v))}
                options={BITRATES.map(b => ({ value: String(b.value), label: b.label }))}
              />

              <SelectField
                label="默认声道"
                value={String(settings.defaultChannel)}
                onChange={(v) => settings.setDefaultChannel(Number(v) as AudioChannel)}
                options={CHANNELS.map(c => ({ value: String(c.value), label: c.label }))}
              />

              <SelectField
                label="默认语言"
                value={settings.defaultLanguage}
                onChange={(v) => settings.setDefaultLanguage(v as LanguageBoost)}
                options={LANGUAGE_OPTIONS.map(l => ({ value: l.value, label: `${l.flag || ''} ${l.label}` }))}
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => settings.setAutoPlay(e.target.checked)}
                  className="rounded border-[rgb(var(--border))]"
                />
                <span className="text-sm">合成后自动播放</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStream}
                  onChange={(e) => settings.setAutoStream(e.target.checked)}
                  className="rounded border-[rgb(var(--border))]"
                />
                <span className="text-sm">长文本自动使用流式合成</span>
              </label>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">数据管理</h3>
            <button
              onClick={() => {
                if (confirm('确定要清除所有本地数据（包括 API Key、历史记录）吗？')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              清除所有本地数据
            </button>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-2">
              API Key 仅存储在浏览器本地，不会上传到任何服务器
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
