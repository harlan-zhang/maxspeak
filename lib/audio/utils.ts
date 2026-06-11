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
export function hexAudioToBlob(hex: string, format: string, sampleRate: number = 32000, numChannels: number = 1): Blob {
  const buffer = hexToArrayBuffer(hex);

  switch (format) {
    case 'pcm':
      return pcmToWav(buffer, sampleRate, numChannels);
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
 * Smart hex→Blob with optional format override.
 *
 * MiniMax hex data respects the requested format — MP3/WAV/FLAC are
 * already valid containers. Only PCM needs a WAV wrapper added.
 * Magic-byte detection is unreliable (ID3 tags, OGG headers, etc.)
 * so we trust the format parameter from MiniMax's response.
 */
export function smartHexToBlob(
  hex: string,
  audioFormat: string,
  sampleRate: number = 32000,
  numChannels: number = 1,
): Blob {
  return hexAudioToBlob(hex, audioFormat, sampleRate, numChannels);
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
