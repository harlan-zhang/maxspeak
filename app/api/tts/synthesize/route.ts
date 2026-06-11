import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts/synthesize
 *
 * Proxies MiniMax TTS API. Returns JSON with either:
 *   { audio_url: "https://cdn..." }  — client plays URL directly on <audio>
 *   { audio_hex: "...", ... }       — client decodes hex → Blob → blob URL
 *
 * Strategy: prefer output_format='url' (CDN), fall back to hex-in-JSON.
 * We intentionally do NOT convert hex→binary on the server because Vercel's
 * serverless runtime may mangle binary response bodies. Client-side
 * hex→ArrayBuffer→Blob is fast, reliable, and uses the browser's native
 * FormData/Blob APIs that have no such transport issues.
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
    console.log('[synthesize] → MiniMax (url mode)', JSON.stringify(logBody));

    const ttsRes = await fetch(`${baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, output_format: 'url', stream: false }),
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

    // ── Path A: CDN URL (MiniMax's primary response format) ────
    if (ttsData.audio_file) {
      console.log('[synthesize] ✓ CDN URL:', String(ttsData.audio_file).slice(0, 100));
      return NextResponse.json({
        audio_url: ttsData.audio_file,
        extra_info: ttsData.extra_info,
      });
    }

    // ── Path B: Hex data (MiniMax falls back to hex for some format/model combos) ──
    if (ttsData.data?.audio) {
      const hex = String(ttsData.data.audio);
      const byteLen = hex.length / 2;
      console.log(`[synthesize] Hex fallback: ${byteLen} bytes, reqFmt=${audioFormat}`);

      if (hex.length < 200) {
        console.error('[synthesize] ✗ Hex payload too small');
        return NextResponse.json({ error: 'MiniMax returned empty audio data.' }, { status: 502 });
      }

      // Return hex as JSON — the client does hex→Blob locally (more reliable
      // than server-side binary body conversion on Vercel's runtime).
      return NextResponse.json({
        audio_hex: hex,
        audio_format: audioFormat,
        audio_sample_rate: sampleRate,
        audio_channels: channels,
        extra_info: ttsData.extra_info,
      });
    }

    console.error('[synthesize] ✗ No audio data, keys:', Object.keys(ttsData));
    return NextResponse.json({ error: 'MiniMax returned no audio data.' }, { status: 502 });
  } catch (error) {
    console.error('[synthesize] Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
