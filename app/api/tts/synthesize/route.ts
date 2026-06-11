import { NextRequest, NextResponse } from 'next/server';

/** Convert hex string to Uint8Array (server-safe, no DOM) */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Get MIME type from audio format string */
function formatToMime(fmt: string): string {
  switch (fmt) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'flac': return 'audio/flac';
    case 'pcm': return 'audio/wav'; // PCM → WAV container via client
    default: return 'audio/mpeg';
  }
}

/**
 * POST /api/tts/synthesize
 *
 * Calls MiniMax TTS API. Two return modes:
 *  1. CDN URL  → returned as JSON `{ audio_file: "https://..." }`
 *  2. Hex data → converted to binary audio on the server and returned
 *     as a raw audio response (Content-Type: audio/mpeg etc.)
 *
 * We intentionally do NOT download CDN audio server-side because:
 *  - Vercel serverless functions have ~4.5 MB response body limits
 *  - <audio> element playback is NOT subject to CORS
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
    const logBody = { ...body, text: (body.text || '').slice(0, 40) };
    console.log('[synthesize] → MiniMax', JSON.stringify(logBody));

    const ttsRes = await fetch(`${baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, stream: false }),
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

    // ── CDN URL path (preferred) ─────────────────────────────
    if (ttsData.audio_file) {
      console.log('[synthesize] CDN URL:', String(ttsData.audio_file).slice(0, 100));
      return NextResponse.json(ttsData);
    }

    // ── Hex data path (fallback — MiniMax sometimes returns hex) ──
    if (ttsData.data?.audio) {
      const hexLen = String(ttsData.data.audio).length;
      console.log(`[synthesize] Hex data: ${hexLen} chars, format=${audioFormat}`);

      // Edge case: hex payload is suspiciously small (< 200 chars = < 100 bytes)
      // MiniMax sometimes returns a tiny placeholder instead of real audio
      if (hexLen < 200) {
        console.error('[synthesize] Hex payload too small — likely MiniMax error');
        return NextResponse.json(
          { error: 'MiniMax returned empty audio data. Try a different model or format.' },
          { status: 502 }
        );
      }

      const audioBytes = hexToBytes(ttsData.data.audio);
      const mimeType = formatToMime(audioFormat);

      console.log(`[synthesize] Returning binary audio: ${audioBytes.byteLength} bytes, type=${mimeType}`);

      return new NextResponse(Buffer.from(audioBytes), {
        headers: {
          'Content-Type': mimeType,
          'Content-Length': String(audioBytes.byteLength),
          'X-Audio-Duration': String(ttsData.extra_info?.audio_length || 0),
          'X-Audio-Format': audioFormat,
        },
      });
    }

    // Neither CDN URL nor hex data — shouldn't happen but handle gracefully
    console.error('[synthesize] No audio data in response:', Object.keys(ttsData));
    return NextResponse.json(
      { error: 'MiniMax returned no audio data. Check model/format compatibility.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[synthesize] Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
