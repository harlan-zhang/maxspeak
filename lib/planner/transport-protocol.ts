import { PARAM_RANGES } from '../minimax/constants';
import { PLANNER_STYLES } from './core';
import type { PlannerInput } from './core';

const PLANNER_REQUEST_MAX_BYTES = 128 * 1024;
const PLANNER_RESPONSE_MAX_BYTES = 256 * 1024;
const MAX_SEGMENTS = 100;
const MAX_SEGMENT_ID_LENGTH = 128;
const MAX_MODEL_LENGTH = 200;
const MAX_API_KEY_LENGTH = 4096;
const CONTROL_CHARACTERS = /[\x00-\x1f\x7f]/;

const plannerErrors = {
  invalid_request: { status: 400, message: 'AI 编排请求格式不正确。' },
  invalid_provider: { status: 400, message: '请选择有效的 AI 服务商。' },
  invalid_url: { status: 400, message: 'API 地址须使用 HTTPS 或本机、局域网 HTTP，且地址内不能包含凭据、查询参数或片段。' },
  invalid_model: { status: 400, message: '请输入有效的 AI 模型 ID。' },
  invalid_key: { status: 400, message: 'AI API Key 格式不正确。' },
  missing_key: { status: 401, message: '请输入 AI API Key。' },
  request_too_large: { status: 413, message: 'AI 编排请求过大，原稿需少于 10,000 字符。' },
  unauthorized: { status: 401, message: 'AI 服务拒绝了访问，请检查 API Key 和模型权限。' },
  rate_limited: { status: 429, message: 'AI 服务请求过于频繁，请稍后重试。' },
  unavailable: { status: 502, message: 'AI 服务请求失败，请检查模型与连接配置。' },
  custom_unreachable: { status: 502, message: '浏览器无法连接到自定义 API，请检查地址、CORS 和本地网络访问权限。' },
  invalid_response: { status: 502, message: 'AI 服务返回的内容格式不正确。' },
  response_too_large: { status: 502, message: 'AI 服务返回的内容过大。' },
  timed_out: { status: 504, message: 'AI 编排请求超时，请重试。' },
  canceled: { status: 499, message: 'AI 编排请求已取消。' },
} as const;

type PlannerErrorCode = keyof typeof plannerErrors;

export class PlannerTransportError extends Error {
  readonly status: number;

  constructor(readonly code: PlannerErrorCode) {
    super(plannerErrors[code].message);
    this.name = 'PlannerTransportError';
    this.status = plannerErrors[code].status;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isShortString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length <= maxLength && value.trim().length > 0
    && !CONTROL_CHARACTERS.test(value);
}

export function parsePlannerInput(value: unknown): PlannerInput | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new PlannerTransportError('invalid_request');

  const { segments, style, speechModel, allowFillers } = value;
  const plannerStyle = PLANNER_STYLES.find((candidate) => candidate === style);
  if (!Array.isArray(segments) || segments.length === 0 || !plannerStyle
    || !isShortString(speechModel, MAX_MODEL_LENGTH) || typeof allowFillers !== 'boolean') {
    throw new PlannerTransportError('invalid_request');
  }
  if (segments.length > MAX_SEGMENTS) throw new PlannerTransportError('request_too_large');

  let textLength = 0;
  const ids = new Set<string>();
  const checkedSegments = segments.map((segment: unknown) => {
    if (!isRecord(segment) || !isShortString(segment.id, MAX_SEGMENT_ID_LENGTH) || ids.has(segment.id)
      || typeof segment.text !== 'string' || !segment.text.trim()) {
      throw new PlannerTransportError('invalid_request');
    }
    ids.add(segment.id);
    textLength += segment.text.length;
    if (textLength >= PARAM_RANGES.textMaxLength) throw new PlannerTransportError('request_too_large');
    return { id: segment.id, text: segment.text };
  });

  return { segments: checkedSegments, style: plannerStyle, speechModel, allowFillers };
}

export function parsePlannerModel(value: unknown, defaultModel?: string): string {
  const model = typeof value === 'string' ? value.trim() : value;
  if (defaultModel !== undefined && (model === undefined || model === '')) return defaultModel;
  if (!isShortString(model, MAX_MODEL_LENGTH)) throw new PlannerTransportError('invalid_model');
  return model;
}

export function parsePlannerApiKey(value: unknown, optional = false): string {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    if (optional) return '';
    throw new PlannerTransportError('missing_key');
  }
  if (typeof value !== 'string' || value.length > MAX_API_KEY_LENGTH || !/^[\x21-\x7e]+$/.test(value.trim())) {
    throw new PlannerTransportError('invalid_key');
  }
  return value.trim();
}

export function discardPlannerBody(source: Request | Response): void {
  void source.body?.cancel().catch(() => {});
}

export async function readPlannerJson(
  source: Request | Response,
  signal: AbortSignal,
  direction: 'request' | 'response',
): Promise<unknown> {
  const isRequest = direction === 'request';
  const maxBytes = isRequest ? PLANNER_REQUEST_MAX_BYTES : PLANNER_RESPONSE_MAX_BYTES;
  const tooLarge = isRequest ? 'request_too_large' : 'response_too_large';
  const invalid = isRequest ? 'invalid_request' : 'invalid_response';
  if (Number(source.headers.get('content-length')) > maxBytes) {
    discardPlannerBody(source);
    throw new PlannerTransportError(tooLarge);
  }
  if (!source.body) throw new PlannerTransportError(invalid);

  const reader = source.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const cancel = () => { void reader.cancel().catch(() => {}); };
  let complete = false;
  let size = 0;
  let text = '';

  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (signal.aborted) throw new PlannerTransportError('canceled');
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw new PlannerTransportError('canceled');
      if (done) {
        complete = true;
        return JSON.parse(text + decoder.decode()) as unknown;
      }
      size += value.byteLength;
      if (size > maxBytes) throw new PlannerTransportError(tooLarge);
      text += decoder.decode(value, { stream: true });
    }
  } catch (error) {
    if (error instanceof PlannerTransportError) throw error;
    throw new PlannerTransportError(invalid);
  } finally {
    signal.removeEventListener('abort', cancel);
    if (!complete) cancel();
    reader.releaseLock();
  }
}

function cancellationError(): DOMException {
  return new DOMException('AI 编排请求已取消。', 'AbortError');
}

export async function withPlannerDeadline<T>(
  signal: AbortSignal | undefined,
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
  networkError: PlannerErrorCode = 'unavailable',
): Promise<T> {
  if (signal?.aborted) throw cancellationError();

  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  signal?.addEventListener('abort', abort, { once: true });

  try {
    const result = await operation(controller.signal);
    if (controller.signal.aborted) throw cancellationError();
    return result;
  } catch (error) {
    if (signal?.aborted) throw cancellationError();
    if (controller.signal.aborted) throw new PlannerTransportError('timed_out');
    if (error instanceof PlannerTransportError) throw error;
    throw new PlannerTransportError(networkError);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export function plannerStatusError(status: number): PlannerTransportError {
  if (status === 401 || status === 403) return new PlannerTransportError('unauthorized');
  if (status === 429) return new PlannerTransportError('rate_limited');
  if (status === 408 || status === 504) return new PlannerTransportError('timed_out');
  return new PlannerTransportError('unavailable');
}

export function plannerRelayError(status: number, value: unknown): PlannerTransportError {
  const code = isRecord(value) ? value.code : null;
  if (typeof code === 'string' && Object.prototype.hasOwnProperty.call(plannerErrors, code)) {
    const error = new PlannerTransportError(code as PlannerErrorCode);
    if (error.status === status) return error;
  }
  return plannerStatusError(status);
}
