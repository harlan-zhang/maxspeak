import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  getMiniMaxBaseUrl,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  readTextLimited,
  UPSTREAM_TIMEOUT_MS,
} from '@/lib/server/security';
import { isVoiceRecord, normalizeVoiceList, voiceText } from '@/lib/voices/voice-list';

/**
 * POST /api/voices/list
 * Get voice list from MiniMax
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    let baseUrl: string;
    try {
      baseUrl = getMiniMaxBaseUrl(request);
    } catch {
      return NextResponse.json({ error: 'Invalid x-base-url' }, { status: 400 });
    }

    const body = await request.json();

    const payload = { voice_type: body.voice_type || 'all' };

    const response = await fetchWithTimeout(`${baseUrl}/v1/get_voice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, UPSTREAM_TIMEOUT_MS);

    const rawText = await readTextLimited(
      response,
      response.ok ? undefined : MAX_UPSTREAM_ERROR_BYTES
    );

    if (!response.ok) {
      console.error('[get_voice] Error:', response.status, rawText.slice(0, 500));
      return NextResponse.json(
        { error: `Error ${response.status}: ${rawText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[get_voice] Non-JSON:', rawText.slice(0, 300));
      return NextResponse.json({ error: 'Non-JSON response' }, { status: 502 });
    }

    if (!isVoiceRecord(data)) {
      return NextResponse.json({ error: 'Invalid MiniMax voice list' }, { status: 502 });
    }

    const nested = isVoiceRecord(data.data) ? data.data : undefined;
    const baseResponse = data.base_resp ?? nested?.base_resp;
    if (baseResponse !== undefined && (!isVoiceRecord(baseResponse) || baseResponse.status_code !== 0)) {
      const message = isVoiceRecord(baseResponse) ? voiceText(baseResponse.status_msg) : undefined;
      return NextResponse.json({ error: message ?? 'MiniMax voice list failed' }, { status: 502 });
    }

    const voices = normalizeVoiceList(data);
    return NextResponse.json({
      voice_list: voices,
      total_count: data.total_count ?? nested?.total_count ?? voices.length,
      base_resp: baseResponse,
    });
  } catch (error) {
    console.error('[get_voice] Exception:', error);
    if (isAbortError(error)) {
      return NextResponse.json({ error: 'MiniMax API request timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message === 'Response too large') {
      return NextResponse.json({ error: 'MiniMax response too large' }, { status: 502 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
