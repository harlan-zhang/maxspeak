import { NextRequest, NextResponse } from 'next/server';

function hexToBuffer(hex: string): Buffer {
  const clean = hex.replace(/\s/g, '');
  return Buffer.from(clean, 'hex');
}

/** Build a valid WAV container around raw PCM samples */
function buildWav(pcm: Buffer, sampleRate: number, numChannels: number, bitsPerSample: number = 16): Buffer {
  const dataLen = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  return Buffer.concat([header, pcm]);
}

/** Determine actual format from first bytes */
function detectFormat(buf: Buffer, declared: string): { mime: string; fmt: string } {
  // ID3v2 tag → MP3
  if (buf.length >= 3 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    return { mime: 'audio/mpeg', fmt: 'mp3' };
  }
  // RIFF header → WAV
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'RIFF') {
    return { mime: 'audio/wav', fmt: 'wav' };
  }
  // fLaC → FLAC
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'fLaC') {
    return { mime: 'audio/flac', fmt: 'flac' };
  }
  // OggS → OGG
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'OggS') {
    return { mime: 'audio/ogg', fmt: 'ogg' };
  }
  // MPEG sync (FF E0-FF) → MP3/AAC
  if (buf.length >= 2 && buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) {
    return { mime: 'audio/mpeg', fmt: 'mp3' };
  }

  // Nothing matched → raw PCM → need WAV wrapper
  return { mime: 'audio/wav', fmt: 'pcm' };
}

/**
 * POST /api/tts/synthesize
 *
 * Always returns binary audio with correct Content-Type.
 *  - CDN URL  → server downloads and streams back
 *  - Hex data → server converts to proper binary audio
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const baseUrl = request.headers.get('x-base-url') || 'https://api.minimax.io';

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    const body = await request.json();
    const requestedFormat: string = body.audio_setting?.format || 'mp3';
    const sampleRate: number = body.audio_setting?.sample_rate || 32000;
    const channels: number = body.audio_setting?.channel || 1;

    const logBody = { ...body, text: (body.text || '').slice(0, 40) };
    console.log('[synthesize] → MiniMax', JSON.stringify(logBody));

    // Use hex mode — we always get raw bytes, no CDN expiry issues
    const ttsRes = await fetch(`${baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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

    const hex = ttsData.data?.audio;
    if (!hex || typeof hex !== 'string' || hex.length < 200) {
      console.error('[synthesize] No hex audio data');
      return NextResponse.json({ error: 'MiniMax returned no audio data.' }, { status: 502 });
    }

    const rawBuf = hexToBuffer(hex);
    const declaredFmt = ttsData.extra_info?.audio_format || requestedFormat;
    const actualSr = ttsData.extra_info?.audio_sample_rate || sampleRate;
    const actualCh = ttsData.extra_info?.audio_channel || channels;

    const { mime, fmt } = detectFormat(rawBuf, declaredFmt);
    console.log(`[synthesize] ${rawBuf.length}B, declared=${declaredFmt}, detected=${fmt}, mime=${mime}`);

    let outBuf: Buffer;
    if (fmt === 'pcm') {
      // Raw PCM → wrap in WAV container
      outBuf = buildWav(rawBuf, actualSr, actualCh);
      console.log(`[synthesize] PCM→WAV: ${rawBuf.length} → ${outBuf.length}B`);
    } else {
      outBuf = rawBuf;
    }

    return new NextResponse(new Uint8Array(outBuf), {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(outBuf.length),
        'X-Audio-Duration': String(ttsData.extra_info?.audio_length || 0),
        'X-Audio-Format': fmt === 'pcm' ? 'wav' : fmt,
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
