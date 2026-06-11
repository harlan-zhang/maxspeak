'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatDuration, downloadBlob } from '@/lib/utils';
import { hexAudioToBlob } from '@/lib/audio/utils';
import { cn } from '@/lib/utils';
import { Play, Pause, Download, Loader2 } from 'lucide-react';

/**
 * AudioPlayer — fixed bottom bar.
 *
 * Key design: uses a native <audio> element (NOT display:none) for reliable
 * cross-browser playback. MiniMax CDN URLs are set directly on <audio>.src,
 * which bypasses CORS since <audio> element playback is not subject to CORS.
 */
export function AudioPlayer() {
  const player = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  // ── Sync audio.src from store ──────────────────────────────
  // When a new URL arrives, set it on the <audio> element immediately.
  useEffect(() => {
    const audio = audioRef.current;
    const url = player.audioUrl;
    if (!audio || !url) return;
    if (urlRef.current === url) return; // already loaded
    urlRef.current = url;
    setAudioError(null);

    audio.src = url;
    audio.load();
  }, [player.audioUrl]);

  // ── Auto-play when TTS finishes ────────────────────────────
  // Called imperatively from TextToSpeechPanel after synthesis completes.
  const tryAutoPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src || audio.src === window.location.href) return;

    audio.play()
      .then(() => player.setPlaying(true))
      .catch((err) => {
        // Browser policy: user hasn't interacted yet
        console.warn('Auto-play deferred (click play button):', err.message);
      });
  }, [player]);

  // Expose auto-play trigger globally so TextToSpeechPanel can call it
  useEffect(() => {
    (window as any).__audioPlayerPlay = tryAutoPlay;
    return () => { delete (window as any).__audioPlayerPlay; };
  }, [tryAutoPlay]);

  // ── Visibility ─────────────────────────────────────────────
  const hasContent =
    (player.audioUrl && player.audioUrl !== window.location.href) ||
    player.isStreaming ||
    player.isLoading;

  if (!hasContent) {
    // Never rendered → audioUrl hasn't been set yet
    return null;
  }

  // ── Handlers ───────────────────────────────────────────────
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      player.setPlaying(false);
    } else {
      // Ensure src is set (should already be via useEffect)
      if (!audio.src || audio.src === window.location.href) {
        // Fallback: if somehow src is empty, try setting it again
        const storedUrl = urlRef.current || player.audioUrl;
        if (storedUrl) {
          audio.src = storedUrl;
          audio.load();
        } else {
          console.error('No audio URL to play');
          return;
        }
      }

      audio.play()
        .then(() => player.setPlaying(true))
        .catch((err) => {
          console.error('Play failed:', err);
          setAudioError('播放失败，请重试');
        });
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) player.setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio && isFinite(audio.duration)) {
      player.setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    player.setPlaying(false);
    player.setCurrentTime(0);
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = audioRef.current;
    const code = audio?.error?.code;
    const msg = audio?.error?.message || 'unknown';
    console.error('Audio error:', code, msg, 'src:', audio?.src?.slice(0, 80));
    setAudioError(`音频加载失败 (${code || 'unknown'})`);
    player.setPlaying(false);
  };

  const handleDownload = async () => {
    const lastAudio = player.lastGeneratedAudio;
    if (!lastAudio) return;

    try {
      // Strategy 1: try direct browser fetch (may work if CDN has CORS headers)
      if (lastAudio.url) {
        try {
          const directRes = await fetch(lastAudio.url, { mode: 'cors' });
          if (directRes.ok) {
            const blob = await directRes.blob();
            downloadBlob(blob, lastAudio.fileName);
            return;
          }
        } catch {
          // CORS blocked — fall through to proxy
        }
      }

      // Strategy 2: proxy through server (works around CORS but may hit body size limits on serverless)
      if (lastAudio.url) {
        try {
          const res = await fetch('/api/tts/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: lastAudio.url }),
          });
          if (res.ok) {
            const blob = await res.blob();
            downloadBlob(blob, lastAudio.fileName);
            return;
          }
        } catch {
          // Proxy failed — fall through
        }
      }

      // Strategy 3: hex data → local blob
      if (lastAudio.hex) {
        const blob = hexAudioToBlob(lastAudio.hex, lastAudio.format);
        downloadBlob(blob, lastAudio.fileName);
        return;
      }

      // Strategy 4: open CDN URL in new tab (browser will play/download)
      if (lastAudio.url) {
        window.open(lastAudio.url, '_blank');
      }
    } catch {
      // Last resort
      if (lastAudio.url) window.open(lastAudio.url, '_blank');
    }
  };

  // ── Render ─────────────────────────────────────────────────
  const isLoading = player.isLoading || player.isStreaming;
  const isActive = player.isPlaying && !player.isStreaming;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 backdrop-blur-sm px-4 py-2 flex-shrink-0 shadow-lg">
      {/* === Native audio element — positioned off-screen, not display:none === */}
      <audio
        id="main-player-audio"
        ref={audioRef}
        preload="auto"
        controls={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => player.setPlaying(true)}
        onPause={() => player.setPlaying(false)}
        onError={handleAudioError}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      />

      <div className="flex items-center gap-3">
        {/* --- Play / Pause --- */}
        <button
          onClick={handlePlayPause}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
            isLoading
              ? 'bg-violet-100 dark:bg-violet-500/10 cursor-default'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 active:scale-95'
          )}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-violet-600 dark:text-violet-400" />
          ) : isActive ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* --- Progress & info --- */}
        <div className="flex-1 min-w-0">
          {player.isStreaming ? (
            <div className="space-y-1">
              <div className="h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(player.streamingProgress, 2)}%` }}
                />
              </div>
              <p className="text-[10px] text-[rgb(var(--muted-foreground))]">
                流式接收中... {player.streamingReceivedChunks} chunks
              </p>
            </div>
          ) : audioError ? (
            <div className="space-y-1">
              <p className="text-xs text-red-500">{audioError}</p>
              <button
                onClick={() => {
                  setAudioError(null);
                  const audio = audioRef.current;
                  if (audio && player.audioUrl) {
                    audio.src = player.audioUrl;
                    audio.load();
                  }
                }}
                className="text-[10px] text-primary-600 hover:underline"
              >
                点击重试
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Clickable progress bar */}
              <div
                className="relative h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden cursor-pointer group"
                title="点击跳转播放位置"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const audio = audioRef.current;
                  if (audio && player.duration > 0) {
                    audio.currentTime = ratio * player.duration;
                  }
                }}
              >
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{
                    width: `${player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[rgb(var(--muted-foreground))]">
                <span>{formatDuration(player.currentTime)}</span>
                <span>{player.isStreaming ? '...' : formatDuration(player.duration)}</span>
              </div>
            </div>
          )}
        </div>

        {/* --- Download --- */}
        {player.lastGeneratedAudio && (
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors flex-shrink-0"
            title="下载音频"
          >
            <Download size={18} className="text-[rgb(var(--muted-foreground))]" />
          </button>
        )}
      </div>
    </div>
  );
}
