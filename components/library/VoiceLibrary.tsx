'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { PRESET_VOICES, VOICE_LANGUAGES, filterVoices, groupVoicesByLanguage } from '@/lib/voices/preset-voices';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { cn } from '@/lib/utils';
import { Search, Library, RefreshCw } from 'lucide-react';

type VoiceSource = 'system' | 'cloned' | 'designed';

export function VoiceLibrary() {
  const settings = useSettingsStore();
  const setVoiceId = useTTSStore((s) => s.setVoiceId);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [source, setSource] = useState<VoiceSource>('system');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Load custom voices
  const clonedVoices = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('tts-cloned-voices') || '[]'); }
    catch { return []; }
  }, []);

  const designedVoices = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('tts-designed-voices') || '[]'); }
    catch { return []; }
  }, []);

  // Filter system voices
  const filteredSystem = useMemo(
    () => filterVoices(PRESET_VOICES, language || undefined, search || undefined, gender || undefined),
    [language, search, gender]
  );

  const groupedSystem = useMemo(() => groupVoicesByLanguage(filteredSystem), [filteredSystem]);

  // Sync from API
  const handleSyncFromAPI = async () => {
    if (!settings.apiKey) {
      setSyncMessage('请先设置 API Key');
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch('/api/voices/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          ...(settings.baseUrl !== 'https://api.minimax.io' ? { 'x-base-url': settings.baseUrl } : {}),
        },
        body: JSON.stringify({ voice_type: 'all', page_size: 500 }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await res.json();
      const count = data.voice_list?.length || 0;
      setSyncMessage(`✅ 成功获取 ${count} 个音色（系统 + 自定义）。已合并到本地库。`);
    } catch (err) {
      setSyncMessage(`❌ 同步失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lazy-create preview audio that's DOM-attached (autoplay policy requires DOM connection)
  const ensurePreviewAudio = useCallback(() => {
    if (!previewAudioRef.current || !document.body.contains(previewAudioRef.current)) {
      const a = new Audio();
      a.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(a);
      previewAudioRef.current = a;
    }
    return previewAudioRef.current;
  }, []);

  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    if (!settings.apiKey) return;

    setPreviewLoading(voiceId);
    setPreviewError(null);

    try {
      const voice = PRESET_VOICES.find(v => v.id === voiceId);
      const sampleText = voice?.sampleText || '你好，这是音色试听。Hello, this is a voice preview.';

      // Map voice language to language_boost
      const langMap: Record<string, string> = {
        'Chinese': 'Chinese', 'English': 'English', 'Japanese': 'Japanese',
        'Korean': 'Korean', 'Cantonese': 'Chinese,Yue', 'Spanish': 'Spanish',
        'French': 'French', 'Portuguese': 'Portuguese', 'German': 'German',
        'Russian': 'Russian', 'Arabic': 'Arabic', 'Italian': 'Italian',
        'Turkish': 'Turkish', 'Dutch': 'Dutch', 'Ukrainian': 'Ukrainian',
        'Vietnamese': 'Vietnamese', 'Indonesian': 'Indonesian',
        'Thai': 'Thai', 'Polish': 'Polish', 'Hindi': 'Hindi',
      };
      const languageBoost = voice ? (langMap[voice.language] || 'auto') : 'auto';

      const body = {
        model: 'speech-2.8-turbo' as const,
        text: sampleText,
        voice_setting: { voice_id: voiceId },
        audio_setting: {
          sample_rate: 24000 as const,
          bitrate: 64000,
          format: 'mp3' as const,
          channel: 1 as const,
        },
        language_boost: languageBoost,
        output_format: 'url' as const,
      };

      console.log('[preview] Requesting TTS for voice:', voiceId);

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'x-base-url': settings.baseUrl,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[preview] API error:', res.status, errText.slice(0, 200));
        setPreviewError(`API ${res.status}: ${errText.slice(0, 100)}`);
        return;
      }

      const ct = res.headers.get('content-type') || '';
      let audioUrl: string;

      if (ct.startsWith('audio/')) {
        const blob = await res.blob();
        console.log('[preview] Got audio blob:', blob.size, 'bytes, type:', blob.type);
        audioUrl = URL.createObjectURL(blob);
      } else {
        const data = await res.json();
        console.log('[preview] JSON, audio_file:', data.audio_file?.slice(0, 80) || 'none');
        if (!data.audio_file) {
          setPreviewError('No audio in response');
          return;
        }
        audioUrl = data.audio_file;
      }

      // Play: try DOM-attached element first, fallback to main player's audio
      const playAudio = (url: string) => {
        const a = ensurePreviewAudio();
        a.src = url;
        const p = a.play();
        if (p) p.catch(() => {
          // DOM audio failed — try main player audio (already visible in DOM)
          const mainAudio = document.querySelector('#main-player-audio') as HTMLAudioElement | null;
          if (mainAudio) { mainAudio.src = url; mainAudio.play().catch(() => {}); }
        });
      };
      playAudio(audioUrl);
    } catch (err) {
      console.error('[preview] Exception:', err);
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewLoading(null);
    }
  }, [settings, ensurePreviewAudio]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-[rgb(var(--foreground))] tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
              <Library size={16} className="text-purple-500" />
            </div>
            Voice Library
          </h2>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1.5 ml-[42px]">
            Browse system voices, cloned voices, and designed voices
          </p>
        </div>

        <button
          onClick={handleSyncFromAPI}
          disabled={isSyncing}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              同步中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              从 API 同步
            </>
          )}
        </button>
      </div>

      {syncMessage && (
        <div className={cn(
          'mb-4 p-3 rounded-lg text-sm',
          syncMessage.startsWith('✅') ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
        )}>
          {syncMessage}
        </div>
      )}

      {/* Source Tabs */}
      <div className="flex gap-1 mb-4 p-0.5 bg-[rgb(var(--muted))] rounded-lg w-fit">
        {[
          { id: 'system' as VoiceSource, label: '系统音色', count: PRESET_VOICES.length },
          { id: 'cloned' as VoiceSource, label: '复刻音色', count: clonedVoices.length },
          { id: 'designed' as VoiceSource, label: '设计音色', count: designedVoices.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSource(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              source === tab.id
                ? 'bg-white dark:bg-slate-600 shadow-sm text-[rgb(var(--foreground))]'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filters (for system voices only) */}
      {source === 'system' && (
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 搜索音色..."
              className="input-field pl-8 text-sm"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field text-sm w-40">
            <option value="">全部语言</option>
            {VOICE_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field text-sm w-24">
            <option value="">全部</option>
            <option value="male">男声</option>
            <option value="female">女声</option>
            <option value="neutral">中性</option>
          </select>
        </div>
      )}

      {/* Voice Display */}
      {source === 'system' && (
        <div className="space-y-6">
          {Array.from(groupedSystem.entries()).map(([languageLabel, voices]) => (
            <div key={languageLabel}>
              <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-2 flex items-center gap-2">
                {languageLabel}
                <span className="text-xs font-normal text-[rgb(var(--muted-foreground))]">({voices.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {voices.map((voice) => (
                  <div key={voice.id} className="card p-3 group hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {voice.gender === 'female' ? '👩' : voice.gender === 'male' ? '👨' : '🤖'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[rgb(var(--foreground))] truncate">
                          {voice.name}
                        </div>
                        <div className="text-[10px] text-[rgb(var(--muted-foreground))] truncate">
                          {voice.description}
                        </div>
                        {voice.tags && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {voice.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 pt-2 border-t border-[rgb(var(--border))]">
                      <button
                        onClick={() => handlePreviewVoice(voice.id)}
                        className="flex-1 text-[10px] py-1 rounded-md bg-[rgb(var(--muted))] hover:bg-primary-100 dark:hover:bg-primary-900 text-[rgb(var(--muted-foreground))] hover:text-primary-600 transition-colors"
                      >
                        ▶ 试听
                      </button>
                      <button
                        onClick={() => setVoiceId(voice.id)}
                        className="flex-1 text-[10px] py-1 rounded-md bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 dark:hover:bg-primary-900 text-primary-600 transition-colors"
                      >
                        使用
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredSystem.length === 0 && (
            <p className="text-center py-8 text-[rgb(var(--muted-foreground))]">
              未找到匹配的音色
            </p>
          )}
        </div>
      )}

      {/* Cloned Voices */}
      {source === 'cloned' && (
        <div>
          {clonedVoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎙️</div>
              <p className="text-[rgb(var(--muted-foreground))]">暂无复刻音色</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                前往「音色复刻」页面创建您的自定义音色
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {clonedVoices.map((voice: { voiceId: string; name: string; createdAt: number; demoAudio?: string; fileId: number }) => (
                <div key={voice.voiceId} className="card p-3">
                  <div className="font-mono text-sm font-medium text-[rgb(var(--foreground))] truncate">
                    {voice.voiceId}
                  </div>
                  <div className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                    {new Date(voice.createdAt).toLocaleString('zh-CN')}
                  </div>
                  <div className="flex gap-1 mt-2 pt-2 border-t border-[rgb(var(--border))]">
                    {voice.demoAudio && (
                      <button
                        onClick={() => {
                          try {
                            const a = new Audio(voice.demoAudio);
                            a.play().catch(() => {});
                          } catch {}
                        }}
                        className="flex-1 text-[10px] py-1 rounded-md bg-[rgb(var(--muted))] hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
                      >
                        ▶ 试听
                      </button>
                    )}
                    <button
                      onClick={() => setVoiceId(voice.voiceId)}
                      className="flex-1 text-[10px] py-1 rounded-md bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 dark:hover:bg-primary-900 text-primary-600 transition-colors"
                    >
                      使用
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Designed Voices */}
      {source === 'designed' && (
        <div>
          {designedVoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-[rgb(var(--muted-foreground))]">暂无设计音色</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                前往「音色设计」页面通过文字描述创造新音色
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {designedVoices.map((voice: { voiceId: string; prompt: string; previewText: string; createdAt: number; trialAudio?: string }) => (
                <div key={voice.voiceId} className="card p-3">
                  <div className="font-mono text-sm font-medium text-[rgb(var(--foreground))] truncate">
                    {voice.voiceId}
                  </div>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1 line-clamp-2">
                    {voice.prompt}
                  </p>
                  <div className="text-[10px] text-[rgb(var(--muted-foreground))] mt-1">
                    {new Date(voice.createdAt).toLocaleString('zh-CN')}
                  </div>
                  <div className="flex gap-1 mt-2 pt-2 border-t border-[rgb(var(--border))]">
                    {voice.trialAudio && (
                      <button
                        onClick={() => {
                          try {
                            const audio = voice.trialAudio!;
                            // trial_audio is hex-encoded MP3
                            const bytes = new Uint8Array(audio.length / 2);
                            for (let i = 0; i < audio.length; i += 2) {
                              bytes[i / 2] = parseInt(audio.substring(i, i + 2), 16);
                            }
                            const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
                            const url = URL.createObjectURL(blob);
                            const a = new Audio(url);
                            a.play().catch(() => {});
                          } catch {}
                        }}
                        className="flex-1 text-[10px] py-1 rounded-md bg-[rgb(var(--muted))] hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
                      >
                        ▶ 试听
                      </button>
                    )}
                    <button
                      onClick={() => setVoiceId(voice.voiceId)}
                      className="flex-1 text-[10px] py-1 rounded-md bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 dark:hover:bg-primary-900 text-primary-600 transition-colors"
                    >
                      使用
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
