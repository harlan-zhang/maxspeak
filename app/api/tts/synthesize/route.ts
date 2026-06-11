import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts/synthesize
 *
 * Transparent proxy: calls MiniMax API, then fetches the CDN audio file
 * server-side and returns the RAW audio bytes with correct Content-Type.
 *
 * The browser receives same-origin binary audio — no CORS, no CDN issues.
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

    // Step 1: call MiniMax TTS API
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

    const audioFile = ttsData.audio_file;
    if (!audioFile) {
      // hex mode fallback — return JSON as-is
      if (ttsData.data?.audio) {
        return NextResponse.json(ttsData);
      }
      return NextResponse.json({ error: 'No audio in response' }, { status: 502 });
    }

    console.log('[synthesize] CDN URL:', audioFile.slice(0, 100));

    // Step 2: - download the audio from CDN server-side
    const audioRes = await fetch(audioFile, {
      headers: {
        'Accept': 'audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/*,*/*',
      },
    });

    if (!audioRes.ok) {
      console.error('[synthesize] CDN download failed:', audioRes.status, audioRes.statusText);
      // Fallback: return the CDN URL and let client try directly
      return NextResponse.json({
        audio_file: audioFile,
        extra_info: ttsData.extra_info,
        base_resp: ttsData.base_resp,
        trace_id: ttsData.trace_id,
      });
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';

    console.log('[synthesize] CDN download OK:',
      audioBuffer.byteLength, 'bytes, type:', contentType);

    // Reject if CDN returned HTML/text instead of audio
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      console.error('[synthesize] CDN returned non-audio content-type:', contentType);
      return NextResponse.json({
        audio_file: audioFile,
        extra_info: ttsData.extra_info,
        base_resp: ttsData.base_resp,
        trace_id: ttsData.trace_id,
        _fallback: true,
      });
    }

    // Step 3: return raw audio bytes + metadata via custom headers
    const res = new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'no-cache',
        'X-Audio-Duration': String(ttsData.extra_info?.audio_length || ''),
        'X-Audio-Sample-Rate': String(ttsData.extra_info?.audio_sample_rate || ''),
        'X-Audio-Format': String(ttsData.extra_info?.audio_format || body.audio_setting?.format || 'mp3'),
      },
    });

    return res;
  } catch (error) {
    console.error('[synthesize] Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
