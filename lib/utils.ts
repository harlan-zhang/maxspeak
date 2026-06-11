import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind CSS classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number to 1 decimal place */
export function fmt1(n: number): string {
  return n.toFixed(1);
}

/** Format bytes to human readable */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/** Format duration in seconds to mm:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Generate a unique ID */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Hash a string for caching keys */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** Estimate cost in CNY for TTS request */
export function estimateCost(text: string, model: string, pricing: Record<string, number>): string {
  // MiniMax counts: 1 Chinese char = 2 chars, English letters/punctuation/spaces = 1 char
  let charCount = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0x4e00 && code <= 0x9fff) {
      charCount += 2; // CJK
    } else {
      charCount += 1;
    }
  }
  const price = pricing[model] || 3.5;
  const cost = (charCount / 10000) * price;
  return `¥${cost.toFixed(4)}`;
}

/** Validate voice_id format */
export function validateVoiceId(id: string): { valid: boolean; message: string } {
  if (id.length < 8 || id.length > 256) {
    return { valid: false, message: '长度必须在 8-256 个字符之间' };
  }
  if (!/^[a-zA-Z]/.test(id)) {
    return { valid: false, message: '必须以字母开头' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: false, message: '只能包含字母、数字、连字符和下划线' };
  }
  if (/[-_]$/.test(id)) {
    return { valid: false, message: '不能以连字符或下划线结尾' };
  }
  return { valid: true, message: '' };
}

/** Convert a hex string to ArrayBuffer */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/** Sleep for ms */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Download a blob as a file */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
