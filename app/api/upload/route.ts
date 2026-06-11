import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/upload
 * Upload audio file for voice cloning
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const baseUrl = request.headers.get('x-base-url') || 'https://api.minimax.io';

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const purpose = (formData.get('purpose') as string) || 'voice_clone';

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload mp3, m4a, or wav files.' },
        { status: 400 }
      );
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 20MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Create new FormData for the MiniMax request
    const minimaxForm = new FormData();
    minimaxForm.append('file', file);
    minimaxForm.append('purpose', purpose);

    const response = await fetch(`${baseUrl}/v1/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: minimaxForm,
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Upload error ${response.status}: ${err}` }, { status: response.status });
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'File upload failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload error' },
      { status: 500 }
    );
  }
}
