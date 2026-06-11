import { NextRequest, NextResponse } from 'next/server';

/** Convert hex string → Uint8Array (server-safe, no DOM) */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Build a valid WAV file container around raw PCM samples */
function buildWav(pcmSamples: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Buffer {
  const dataLen = pcmSamples.byteLength;
  const headerLen = 44;
  const totalLen = headerLen + dataLen;
  const buf = Buffer.alloc(totalLen);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(totalLen - 8, 4);
  buf.write('WAVE', 8);

  // fmt  chunk
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);                        // subchunk size (PCM)
  buf.writeUInt16LE(1, 20);                         // audio format (1 = PCM)
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  buf.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);              // block align
  buf.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);
  Buffer.from(pcmSamples).copy(buf, headerLen);

  return buf;
}

/**
 * POST /api/tts/synthesize
 *
 * Proxy for MiniMax TTS API. Always uses output_format=hex (more reliable
 * than URL mode — no CDN expiry, no CORS, no HTML error pages).
 *
 * Returns binary audio with correct MIME type. PCM is wrapped in a valid
 * WAV container (browsers can't play raw PCM).
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const baseUrl = request.headers.get('x-base-url') || 'https://api.minimax.io';

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    const body = await request.json();
    const audioFormat: string = body.audio_setting?.format || 'mp3';
    const sampleRate: number = body.audio_setting?.sample_rate || 32000;
    const channels: number = body.audio_setting?.channel || 1;
    const logBody = { ...body, text: (body.text || '').slice(0, 40) };
    console.log('[synthesize] → MiniMax (hex mode)', JSON.stringify(logBody));

    const ttsRes = await fetch(`${baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Always force hex — self-contained, no CDN expiry, no CORS issues
      body: JSON.stringify({ ...body, output_format: 'hex', stream: false }),
    });

    const ttsText = await ttsRes.text();

    if (!ttsRes.ok) {
      console.error('[synthesize] MiniMax error:', ttsRes.status, ttsText.slice(0, 400));
      return NextResponse.json(
        { error: `MiniMax API ${ttsRes.status}: ${ttsText.slice(0, 200)}` },
        { status: ttsRes.status }
      );
    }

    let ttsData: any;
    try {
      ttsData = JSON.parse(ttsText);
    } catch {
      return NextResponse.json({ error: 'MiniMax returned non-JSON' }, { status: 502 });
    }

    if (ttsData.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: ttsData.base_resp?.status_msg || 'TTS failed' },
        { status: 400 }
      );
    }

    if (!ttsData.data?.audio) {
      console.error('[synthesize] ✗ No hex data, keys:', Object.keys(ttsData));
      return NextResponse.json(
        { error: 'MiniMax returned no audio data.' },
        { status: 502 }
      );
    }

    const hex = String(ttsData.data.audio);
    console.log(`[synthesize] Hex: ${hex.length / 2} bytes, fmt=${audioFormat}, sr=${sampleRate}`);

    if (hex.length < 200) {
      console.error('[synthesize] ✗ Hex payload too small');
      return NextResponse.json(
        { error: 'MiniMax returned empty audio data.' },
        { status: 502 }
      );
    }

    const rawBytes = hexToBytes(hex);
    let audioBuffer: Buffer;
    let mimeType: string;

    if (audioFormat === 'pcm') {
      // Raw PCM → WAV container (browsers can't play bare PCM)
      const wavBuf = buildWav(rawBytes, sampleRate, channels, 16);
      audioBuffer = Buffer.from(wavBuf);
      mimeType = 'audio/wav';
      console.log(`[synthesize] PCM→WAV: ${rawBytes.byteLength}→${audioBuffer.byteLength}B`);
    } else {
      audioBuffer = Buffer.from(rawBytes);
      mimeType = audioFormat === 'mp3' ? 'audio/mpeg'
               : audioFormat === 'flac' ? 'audio/flac'
               : 'audio/wav';
    }

    console.log(`[synthesize] ✓ ${audioBuffer.byteLength}B ${mimeType}`);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(audioBuffer.byteLength),
        'X-Audio-Duration': String(ttsData.extra_info?.audio_length || 0),
        'X-Audio-Format': audioFormat,
      },
    });
  } catch (error) {
    console.error('[synthesize] Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
