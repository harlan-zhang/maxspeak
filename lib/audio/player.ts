/**
 * Web Audio API based audio player for TTS playback
 *
 * Key design decisions:
 * - For URL-based audio: use native <audio> element (no CORS issues, better codec support)
 * - For hex/blobs: create Blob URL → set on <audio>
 * - Web Audio API (AudioContext) used only for: streaming playback, waveform visualization
 * - decodeAudio now has a fallback to native audio if decodeAudioData fails
 */

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let gainNode: GainNode | null = null;
let onEndedCallback: (() => void) | null = null;
let onTimeUpdateCallback: ((time: number) => void) | null = null;
let startTime = 0;
let pausedAt = 0;
let animationFrameId: number | null = null;

// Reference to the native <audio> element for URL-based playback
let nativeAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/** Register the native <audio> element for sync */
export function setNativeAudioElement(el: HTMLAudioElement | null) {
  nativeAudio = el;
  if (el) {
    el.ontimeupdate = () => {
      if (onTimeUpdateCallback) {
        onTimeUpdateCallback(el.currentTime);
      }
    };
    el.onended = () => {
      stopTimeUpdates();
      onEndedCallback?.();
      onEndedCallback = null;
    };
  }
}

/** Play audio from a URL using the native <audio> element (most robust approach) */
export function playFromUrl(
  url: string,
  options: {
    onEnded?: () => void;
    onTimeUpdate?: (time: number) => void;
    onError?: (error: Error) => void;
  } = {}
): void {
  stopCurrent();

  if (!nativeAudio) {
    // Fallback: try Web Audio API decode
    decodeAudio(url)
      .then((audioBuffer) => {
        playAudioBuffer(audioBuffer, {
          onEnded: options.onEnded,
          onTimeUpdate: options.onTimeUpdate,
        });
      })
      .catch((err) => {
        console.error('Fallback decode failed:', err);
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    return;
  }

  onEndedCallback = options.onEnded || null;
  onTimeUpdateCallback = options.onTimeUpdate || null;

  nativeAudio.src = url;
  nativeAudio.load();
  nativeAudio.play().catch((err) => {
    console.warn('Audio play failed:', err);
    // User interaction might be needed
    options.onError?.(new Error('请先与页面交互（点击任意位置）后再试'));
  });

  startTime = nativeAudio.currentTime;
  pausedAt = 0;
  startTimeUpdates();
}

/**
 * Decode audio from a URL or ArrayBuffer.
 * For URLs: prefers proxying through download API to avoid CORS.
 */
export async function decodeAudio(source: string | ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioContext();

  let buffer: ArrayBuffer;

  if (typeof source === 'string') {
    try {
      // Try direct fetch first
      const response = await fetch(source, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      buffer = await response.arrayBuffer();
    } catch (fetchError) {
      // CORS likely blocked — try proxy through our API
      console.warn('Direct fetch failed (likely CORS), trying proxy...');
      try {
        const proxyRes = await fetch('/api/tts/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source }),
        });
        if (!proxyRes.ok) {
          throw new Error(`Proxy download failed: ${proxyRes.status}`);
        }
        buffer = await proxyRes.arrayBuffer();
      } catch (proxyError) {
        throw new Error(
          `无法获取音频数据。CDN 跨域且代理下载失败。请尝试切换 output_format 为 hex 模式。`
        );
      }
    }
  } else {
    buffer = source;
  }

  // Try Web Audio API decode
  try {
    return await ctx.decodeAudioData(buffer.slice(0));
  } catch (decodeError) {
    // decodeAudioData failed — the file format might not be supported by Web Audio API
    // Fallback: create a Blob and play via native <audio>
    console.warn('decodeAudioData failed, creating blob fallback:', decodeError);

    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    const blobUrl = URL.createObjectURL(blob);

    // Try fetching the blob URL (same-origin, no CORS)
    const blobResponse = await fetch(blobUrl);
    const blobBuffer = await blobResponse.arrayBuffer();

    try {
      return await ctx.decodeAudioData(blobBuffer.slice(0));
    } catch (finalError) {
      URL.revokeObjectURL(blobUrl);
      throw new Error(`音频解码失败。请尝试切换到 MP3 格式或使用流式合成。`);
    }
  }
}

/** Play an AudioBuffer with optional time tracking */
export function playAudioBuffer(
  audioBuffer: AudioBuffer,
  options: {
    onEnded?: () => void;
    onTimeUpdate?: (time: number) => void;
    offset?: number;
  } = {}
): void {
  const ctx = getAudioContext();
  stopCurrent();

  // Create nodes
  gainNode = ctx.createGain();
  gainNode.gain.value = 1.0;

  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 256;

  currentSource = ctx.createBufferSource();
  currentSource.buffer = audioBuffer;
  currentSource.connect(gainNode);
  gainNode.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  onEndedCallback = options.onEnded || null;
  onTimeUpdateCallback = options.onTimeUpdate || null;

  currentSource.onended = () => {
    stopTimeUpdates();
    onEndedCallback?.();
    onEndedCallback = null;
  };

  const offset = options.offset || 0;
  startTime = ctx.currentTime - offset;
  pausedAt = 0;
  currentSource.start(0, offset);

  startTimeUpdates();
}

/** Get the current playback time */
export function getCurrentTime(): number {
  if (nativeAudio && nativeAudio.src && !nativeAudio.paused) {
    return nativeAudio.currentTime;
  }
  const ctx = getAudioContext();
  if (!currentSource) return pausedAt;
  return ctx.currentTime - startTime;
}

/** Stop current playback */
export function stopCurrent(): void {
  try {
    currentSource?.stop();
  } catch {
    // Already stopped
  }
  currentSource = null;

  if (nativeAudio) {
    nativeAudio.pause();
    nativeAudio.currentTime = 0;
    nativeAudio.src = '';
  }

  stopTimeUpdates();
}

/** Pause playback */
export function pausePlayback(): void {
  if (nativeAudio && nativeAudio.src && !nativeAudio.paused) {
    nativeAudio.pause();
    pausedAt = nativeAudio.currentTime;
    return;
  }
  if (!currentSource) return;
  pausedAt = getCurrentTime();
  stopCurrent();
}

/** Resume from pause point */
export function resumePlayback(
  audioBuffer: AudioBuffer,
  onEnded?: () => void,
  onTimeUpdate?: (time: number) => void
): void {
  if (nativeAudio && nativeAudio.src) {
    nativeAudio.currentTime = pausedAt;
    nativeAudio.play().catch(() => {});
    startTimeUpdates();
    return;
  }
  playAudioBuffer(audioBuffer, {
    onEnded,
    onTimeUpdate,
    offset: pausedAt,
  });
}

/** Get frequency data for waveform visualization */
export function getFrequencyData(): Uint8Array | null {
  if (!analyserNode) return null;
  const data = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(data);
  return data;
}

/** Get waveform data (time domain) */
export function getWaveformData(): Uint8Array | null {
  if (!analyserNode) return null;
  const data = new Uint8Array(analyserNode.fftSize);
  analyserNode.getByteTimeDomainData(data);
  return data;
}

/** Clean up audio resources */
export function disposeAudio(): void {
  stopCurrent();
  gainNode = null;
  analyserNode = null;
  onEndedCallback = null;
  onTimeUpdateCallback = null;
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}

export function isNativeAudioActive(): boolean {
  return !!(nativeAudio && nativeAudio.src && !nativeAudio.paused);
}

function startTimeUpdates(): void {
  stopTimeUpdates();
  const update = () => {
    if (onTimeUpdateCallback) {
      if (nativeAudio && nativeAudio.src && !nativeAudio.paused) {
        onTimeUpdateCallback(nativeAudio.currentTime);
      } else if (currentSource) {
        onTimeUpdateCallback(getCurrentTime());
      }
    }
    animationFrameId = requestAnimationFrame(update);
  };
  animationFrameId = requestAnimationFrame(update);
}

function stopTimeUpdates(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
