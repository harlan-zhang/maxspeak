import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts/synthesize
 *
 * Lightweight proxy: calls MiniMax API and returns the CDN audio URL.
 *
 * We intentionally do NOT download the CDN audio server-side because:
 *  - Vercel serverless functions have ~4.5 MB response body limits
 *  - <audio> element playback is NOT subject to CORS — the browser can
 *    play cross-origin CDN URLs directly without any issue
 *  - Download is handled by the /api/tts/download proxy (which streams
 *    CDN → browser and sets Content-Disposition for save-as)
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const baseUrl = request.headers.get('x-base-url') || 'https://api.minimax.io';

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    const body = await request.json();
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

    // Return the MiniMax response as JSON — the CDN URL will be played
    // directly by the browser <audio> element (no CORS restrictions).
    return NextResponse.json(ttsData);
  } catch (error) {
    console.error('[synthesize] Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
