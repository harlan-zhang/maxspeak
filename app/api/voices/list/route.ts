import { NextRequest, NextResponse } from 'next/server';

type RawVoice = Record<string, unknown>;

function isRecord(value: unknown): value is RawVoice {
  return typeof value === 'object' && value !== null;
}

function asVoiceArray(value: unknown): RawVoice[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (!isRecord(value)) {
    return [];
  }

  const grouped = Object.values(value).flatMap((item) => Array.isArray(item) ? item : []);
  return grouped.filter(isRecord);
}

function withVoiceType(voices: RawVoice[], voiceType: string): RawVoice[] {
  return voices.map((voice) => ({
    ...voice,
    voice_type: voice.voice_type ?? voiceType,
  }));
}

/**
 * POST /api/voices/list
 * Get voice list from MiniMax
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const baseUrl = request.headers.get('x-base-url') || 'https://api.minimax.io';

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    const body = await request.json();

    // MiniMax get_voice only requires voice_type; the current docs do not define pagination.
    const payload = {
      voice_type: body.voice_type || 'all',
    };

    console.log('[get_voice] Request:', JSON.stringify(payload));
    console.log('[get_voice] Base URL:', baseUrl);

    const response = await fetch(`${baseUrl}/v1/get_voice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error('[get_voice] Error:', response.status, rawText.slice(0, 500));
      return NextResponse.json(
        { error: `Error ${response.status}: ${rawText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[get_voice] Non-JSON:', rawText.slice(0, 300));
      return NextResponse.json({ error: 'Non-JSON response' }, { status: 502 });
    }

    const responseData = isRecord(data.data) ? data.data : data;

    // Log response structure to debug
    const keys = Object.keys(responseData);
    console.log('[get_voice] Response keys:', keys);

    // MiniMax returns voices under top-level keys:
    // - system_voice (array or object keyed by language)
    // - voice_cloning (array)
    // - voice_generation (array)
    const systemVoices = withVoiceType(
      asVoiceArray(responseData.system_voice ?? responseData.system_voices),
      'system'
    );
    const clonedVoices = withVoiceType(asVoiceArray(responseData.voice_cloning), 'voice_cloning');
    const generatedVoices = withVoiceType(asVoiceArray(responseData.voice_generation), 'voice_generation');

    let voices = [...systemVoices, ...clonedVoices, ...generatedVoices];

    if (voices.length === 0) {
      voices = asVoiceArray(responseData.voice_list ?? responseData.voices);
    }

    console.log('[get_voice] Found', voices.length, 'voices');
    if (voices.length > 0) {
      console.log('[get_voice] Sample:', JSON.stringify(voices[0]).slice(0, 200));
    }

    return NextResponse.json({
      voice_list: voices,
      system_voice: systemVoices.length > 0
        ? systemVoices
        : voices.filter((voice) => voice.voice_type === 'system' || voice.voice_type === 'system_voice'),
      voice_cloning: clonedVoices.length > 0
        ? clonedVoices
        : voices.filter((voice) => voice.voice_type === 'voice_cloning'),
      voice_generation: generatedVoices.length > 0
        ? generatedVoices
        : voices.filter((voice) => voice.voice_type === 'voice_generation'),
      total_count: data.total_count || voices.length,
      base_resp: data.base_resp,
    });
  } catch (error) {
    console.error('[get_voice] Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
