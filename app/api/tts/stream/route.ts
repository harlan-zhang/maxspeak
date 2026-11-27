import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  getMiniMaxBaseUrl,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  readTextLimited,
  STREAM_TIMEOUT_MS,
} from '@/lib/server/security';

/**
 * POST /api/tts/stream
 * Proxy streaming SSE TTS requests to MiniMax API
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is required.' },
        { status: 401 }
      );
    }

    let baseUrl: string;
    try {
      baseUrl = getMiniMaxBaseUrl(request);
    } catch {
      return NextResponse.json({ error: 'Invalid x-base-url' }, { status: 400 });
    }

    const body = await request.json();
    const audioFormat = body.audio_setting?.format || 'mp3';
    const sampleRate = body.audio_setting?.sample_rate || 32000;

    const response = await fetchWithTimeout(`${baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, stream: true }),
    }, STREAM_TIMEOUT_MS);

    if (!response.ok) {
      const errorText = await readTextLimited(response, MAX_UPSTREAM_ERROR_BYTES);
      return NextResponse.json(
        { error: `MiniMax API error ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    // Forward the SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream read error:', error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Audio-Format': String(audioFormat),
        'X-Audio-Sample-Rate': String(sampleRate),
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    if (isAbortError(error)) {
      return NextResponse.json({ error: 'MiniMax API request timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message === 'Response too large') {
      return NextResponse.json({ error: 'MiniMax response too large' }, { status: 502 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stream error' },
      { status: 500 }
    );
  }
}
