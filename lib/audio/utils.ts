/**
 * Audio utility functions for TTS workbench
 */

/** Convert hex-encoded audio string to ArrayBuffer */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const cleanHex = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/** Convert ArrayBuffer to WAV Blob (for PCM audio data) */
export function pcmToWav(pcmData: ArrayBuffer, sampleRate: number, numChannels: number = 1, bitsPerSample: number = 16): Blob {
  const dataLength = pcmData.byteLength;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // block align
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM data
  const pcmView = new Uint8Array(pcmData);
  const outView = new Uint8Array(buffer, headerLength);
  outView.set(pcmView);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Download audio from URL and return as Blob */
export async function fetchAudioAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  return response.blob();
}

/** Get audio duration from a Blob */
export function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    audio.addEventListener('error', (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    });
  });
}

/** Create a downloadable Blob from hex audio data + format info */
export function hexAudioToBlob(hex: string, format: string, sampleRate: number = 32000): Blob {
  const buffer = hexToArrayBuffer(hex);

  switch (format) {
    case 'pcm':
      return pcmToWav(buffer, sampleRate);
    case 'mp3':
      return new Blob([buffer], { type: 'audio/mpeg' });
    case 'wav':
      return new Blob([buffer], { type: 'audio/wav' });
    case 'flac':
      return new Blob([buffer], { type: 'audio/flac' });
    default:
      return new Blob([buffer], { type: 'audio/mpeg' });
  }
}

/**
 * Smart hex→Blob: detects actual format from magic bytes.
 *
 * MiniMax in url-fallback mode sometimes returns raw PCM regardless of
 * the requested format. Using the REQUESTED format as MIME type on raw
 * PCM bytes produces DEMUXER_ERROR. This function inspects the data
 * and wraps bare PCM in a WAV container when needed.
 */
export function smartHexToBlob(
  hex: string,
  fallbackFormat: string,
  sampleRate: number = 32000,
  numChannels: number = 1,
): Blob {
  const buffer = hexToArrayBuffer(hex);
  const view = new DataView(buffer);

  // Check magic bytes to determine actual container format
  if (buffer.byteLength >= 4) {
    // RIFF....WAVE = WAV container
    if (view.getUint8(0) === 0x52 && view.getUint8(1) === 0x49 &&
        view.getUint8(2) === 0x46 && view.getUint8(3) === 0x46) {
      return new Blob([buffer], { type: 'audio/wav' });
    }
    // fLaC = FLAC container
    if (view.getUint8(0) === 0x66 && view.getUint8(1) === 0x4C &&
        view.getUint8(2) === 0x61 && view.getUint8(3) === 0x43) {
      return new Blob([buffer], { type: 'audio/flac' });
    }
    // FF FB / FF F3 / FF FA / FF F2 = MPEG audio (MP3)
    if (view.getUint8(0) === 0xFF && (view.getUint8(1) & 0xE0) === 0xE0) {
      return new Blob([buffer], { type: 'audio/mpeg' });
    }
  }

  // No known container → assume raw PCM → wrap in WAV
  return pcmToWav(buffer, sampleRate, numChannels);
}

/** Get file extension from format */
export function formatToExtension(format: string): string {
  switch (format) {
    case 'mp3': return 'mp3';
    case 'wav': return 'wav';
    case 'pcm': return 'wav'; // PCM converted to WAV for playback
    case 'flac': return 'flac';
    default: return 'mp3';
  }
}

/** Get MIME type from format */
export function formatToMimeType(format: string): string {
  switch (format) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'pcm': return 'audio/wav'; // PCM → WAV
    case 'flac': return 'audio/flac';
    default: return 'audio/mpeg';
  }
}
