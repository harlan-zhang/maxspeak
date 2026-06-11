import type {
  TTSRequest,
  TTSResponse,
  GetVoiceRequest,
  GetVoiceResponse,
  VoiceCloneRequest,
  VoiceCloneResponse,
  VoiceDesignRequest,
  VoiceDesignResponse,
  FileUploadResponse,
} from './types';
import { MINIMAX_API_BASE, ENDPOINTS } from './constants';

class MiniMaxClient {
  private baseUrl: string;

  constructor(baseUrl: string = MINIMAX_API_BASE) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /** Synthesize text to speech (synchronous, returns URL) */
  async synthesize(apiKey: string, request: TTSRequest): Promise<TTSResponse> {
    const response = await fetch(`${this.baseUrl}${ENDPOINTS.TTS}`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${err}`);
    }

    return response.json();
  }

  /** Stream TTS - returns the raw fetch response for SSE reading */
  async synthesizeStream(apiKey: string, request: TTSRequest): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${ENDPOINTS.TTS}`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${err}`);
    }

    return response;
  }

  /** Get voices list from MiniMax */
  async getVoices(apiKey: string, request: GetVoiceRequest): Promise<GetVoiceResponse> {
    const response = await fetch(`${this.baseUrl}${ENDPOINTS.GET_VOICE}`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${err}`);
    }

    return response.json();
  }

  /** Upload a file for voice cloning */
  async uploadFile(apiKey: string, file: File, purpose: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    const response = await fetch(`${this.baseUrl}${ENDPOINTS.FILE_UPLOAD}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${err}`);
    }

    return response.json();
  }

  /** Create a voice clone */
  async cloneVoice(apiKey: string, request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const response = await fetch(`${this.baseUrl}${ENDPOINTS.VOICE_CLONE}`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${err}`);
    }

    return response.json();
  }

  /** Design a voice from text description */
  async designVoice(apiKey: string, request: VoiceDesignRequest): Promise<VoiceDesignResponse> {
    const response = await fetch(`${this.baseUrl}${ENDPOINTS.VOICE_DESIGN}`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${err}`);
    }

    return response.json();
  }
}

// Singleton
export const minimaxClient = new MiniMaxClient();
