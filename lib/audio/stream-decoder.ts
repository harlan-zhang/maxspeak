import { hexToArrayBuffer } from './utils';

/**
 * SSE Stream decoder for MiniMax streaming TTS
 *
 * MiniMax SSE format (one event per line, separated by double newlines):
 *   data: {"data":{"audio":"<hex>"},"base_resp":{"status_code":0},...}
 *
 * The "audio" hex field contains a chunk of encoded audio in the format
 * specified by audio_setting.format (mp3, pcm, flac, etc.)
 */

export interface StreamCallbacks {
  onChunk?: (audioBuffer: AudioBuffer, index: number) => void;
  onProgress?: (received: number) => void;
  onComplete?: (totalChunks: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Parse SSE text — MiniMax sends one JSON object per event
 * Format: "data: {json}\n\n"
 */
export function parseSSEEvents(text: string): string[] {
  const results: string[] = [];
  // Split by double newline (SSE event separator)
  const blocks = text.split('\n\n');
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    // Extract JSON from "data: {...}" line
    const lines = trimmed.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6).trim();
        if (json) results.push(json);
      } else if (line.startsWith('data:')) {
        const json = line.slice(5).trim();
        if (json) results.push(json);
      }
    }
  }
  return results;
}

/**
 * Convert AudioBuffer to WAV for formats that browsers can't decode natively
 */
function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const data = audioBuffer.getChannelData(0);
  const dataLength = data.length * (bitsPerSample / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const pcmData = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const byteView = new Uint8Array(buffer, headerLength);
  const pcmBytes = new Uint8Array(pcmData.buffer);
  byteView.set(pcmBytes);

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

async function tryDecodeChunk(
  audioHex: string,
  audioFormat: string,
  sampleRate: number,
  audioContext: AudioContext
): Promise<AudioBuffer | null> {
  const arrayBuffer = hexToArrayBuffer(audioHex);

  if (audioFormat === 'pcm') {
    // Raw PCM — need to wrap in a WAV container
    try {
      // Create offline context for PCM decoding or try direct
      // For 16-bit mono/stereo PCM at known sample rate, construct WAV header
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      return audioBuffer;
    } catch {
      // decodeAudioData failed on PCM — wrap manually
      try {
        // Interpret as 16-bit signed PCM mono
        const pcmData = new Int16Array(arrayBuffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768;
        }
        const numChannels = 1;
        const audioBuffer = audioContext.createBuffer(numChannels, floatData.length, sampleRate);
        audioBuffer.getChannelData(0).set(floatData);
        return audioBuffer;
      } catch {
        return null;
      }
    }
  }

  // MP3, FLAC etc — decodeAudioData should handle these
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer;
  } catch {
    console.warn(`decodeAudioData failed for ${audioFormat} chunk`);
    return null;
  }
}

/**
 * Process a streaming SSE response
 */
export async function processStreamResponse(
  response: Response,
  callbacks: StreamCallbacks,
  audioContext: AudioContext,
  audioFormat: string = 'mp3',
  sampleRate: number = 32000
): Promise<AudioBuffer[]> {
  if (!response.body) {
    throw new Error('Response body is not readable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const audioChunks: AudioBuffer[] = [];
  let buffer = '';
  let chunkIndex = 0;
  let completed = false;

  try {
    while (!completed) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: !done });
      }

      // Find complete SSE events (separated by \n\n)
      let doubleNewline = buffer.indexOf('\n\n');

      while (doubleNewline >= 0) {
        const block = buffer.slice(0, doubleNewline);
        buffer = buffer.slice(doubleNewline + 2);

        // Process this block
        const events = parseSSEEvents(block);
        for (const jsonStr of events) {
          try {
            const parsed = JSON.parse(jsonStr);

            // Check for error
            if (parsed.base_resp && parsed.base_resp.status_code !== 0) {
              const msg = parsed.base_resp?.status_msg || 'Stream error';
              console.error('SSE event error:', msg, parsed);
              // Don't throw — some chunks may succeed after errors
              continue;
            }

            // Extract audio data
            if (parsed.data?.audio) {
              const audioBuffer = await tryDecodeChunk(
                parsed.data.audio,
                audioFormat,
                sampleRate,
                audioContext
              );

              if (audioBuffer) {
                audioChunks.push(audioBuffer);
                callbacks.onChunk?.(audioBuffer, chunkIndex++);
                callbacks.onProgress?.(chunkIndex);
              }
            }
          } catch (e) {
            // Malformed JSON — skip
            console.warn('Failed to parse SSE event:', e);
          }
        }

        // Find next double newline
        doubleNewline = buffer.indexOf('\n\n');
      }

      if (done) {
        // Process remaining buffer
        const remaining = buffer.trim();
        if (remaining) {
          const events = parseSSEEvents(remaining);
          for (const jsonStr of events) {
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.data?.audio) {
                const audioBuffer = await tryDecodeChunk(
                  parsed.data.audio,
                  audioFormat,
                  sampleRate,
                  audioContext
                );
                if (audioBuffer) {
                  audioChunks.push(audioBuffer);
                  callbacks.onChunk?.(audioBuffer, chunkIndex++);
                }
              }
            } catch {
              // Skip
            }
          }
        }
        completed = true;
      }
    }

    callbacks.onComplete?.(audioChunks.length);
  } catch (error) {
    console.error('Stream processing error:', error);
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
  } finally {
    reader.releaseLock();
  }

  return audioChunks;
}

/**
 * Start streaming playback — schedules chunks sequentially
 * Returns the AudioContext being used (caller should close it when done)
 */
export async function streamAndPlay(
  response: Response,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<AudioContext> {
  const audioContext = new AudioContext();
  let scheduledTime = audioContext.currentTime + 0.05; // Small buffer
  const scheduledSources: AudioBufferSourceNode[] = [];

  const scheduleNext = (audioBuffer: AudioBuffer) => {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(scheduledTime);
    scheduledTime += audioBuffer.duration;
    scheduledSources.push(source);
  };

  await processStreamResponse(
    response,
    {
      onChunk: (audioBuffer) => {
        scheduleNext(audioBuffer);
      },
      onComplete: (total) => {
        // All chunks scheduled — wait for playback to finish
        const totalDuration = scheduledTime - audioContext.currentTime;
        setTimeout(() => {
          onComplete?.();
        }, Math.max(totalDuration * 1000, 100));
      },
      onError: (err) => {
        // Stop all scheduled sources
        for (const source of scheduledSources) {
          try { source.stop(); } catch {}
        }
        onError?.(err);
      },
    },
    audioContext
  );

  return audioContext;
}
