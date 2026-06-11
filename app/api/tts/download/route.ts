import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts/download
 * Proxy audio download from MiniMax CDN to avoid:
 *  - CORS blocking (browser fetch to cross-origin CDN)
 *  - MEDIA_ERR_SRC_NOT_SUPPORTED (CDN rejecting localhost requests)
 *
 * The server fetches the CDN URL and streams the audio bytes back
 * with proper Content-Type so the browser can create a blob URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('[download-proxy] Fetching:', url.slice(0, 120));

    const response = await fetch(url, {
      headers: {
        'Accept': 'audio/mpeg,audio/wav,audio/flac,audio/*,*/*',
      },
      // The CDN may reject requests without a plausible User-Agent
      // (Next.js server default User-Agent may not be blocked)
    });

    if (!response.ok) {
      console.error('[download-proxy] CDN returned', response.status, response.statusText);
      return NextResponse.json(
        { error: `CDN returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const buffer = await response.arrayBuffer();

    console.log(`[download-proxy] OK — ${buffer.byteLength} bytes, type=${contentType}`);

    // If the CDN returned HTML (error page) instead of audio,
    // the content-type will be text/html — detect and reject
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      const text = new TextDecoder().decode(buffer.slice(0, 200));
      console.error('[download-proxy] CDN returned non-audio:', contentType, text);
      return NextResponse.json(
        { error: `CDN returned ${contentType} instead of audio` },
        { status: 502 }
      );
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[download-proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download error' },
      { status: 500 }
    );
  }
}
