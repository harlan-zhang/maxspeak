import type { PlannerInput } from './core';
import { parsePlannerSuggestions, requestChatPlanner } from './transport-chat';
import {
  parsePlannerApiKey,
  parsePlannerInput,
  parsePlannerModel,
  plannerRelayError,
  PlannerTransportError,
  readPlannerJson,
  withPlannerDeadline,
} from './transport-protocol';

export const PLANNER_PROVIDERS = {
  minimax: { label: 'MiniMax 国际站', model: 'MiniMax-M3.1-Flash' },
  'minimax-cn': { label: 'MiniMax 国内站', model: 'MiniMax-M3.1-Flash' },
  openai: { label: 'OpenAI', model: 'gpt-6.1-terra' },
  deepseek: { label: 'DeepSeek', model: 'deepseek-flash' },
  openrouter: { label: 'OpenRouter', model: 'openai/gpt-6.1-terra' },
} as const satisfies Record<string, { label: string; model: string }>;

type PlannerPresetProvider = keyof typeof PLANNER_PROVIDERS;

export type PlannerProvider = PlannerPresetProvider | 'custom';

export interface PlannerConnection {
  provider: PlannerProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
}

const MAX_BASE_URL_LENGTH = 2048;
const RELAY_TIMEOUT_MS = 50_000;

export function isPlannerPreset(value: unknown): value is PlannerPresetProvider {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLANNER_PROVIDERS, value);
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.replace(/\.$/, '');
  if (host === 'localhost' || host === '[::1]') return true;
  if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+local$/.test(host)) return true;
  if (/^\[(?:f[cd][0-9a-f]{2}|fe[89ab][0-9a-f]):/.test(host)) return true;

  // URL has already canonicalized and validated any IPv4 literal.
  const ipv4 = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(host);
  if (!ipv4) return false;
  const first = Number(ipv4[1]);
  const second = Number(ipv4[2]);
  return first === 127 || first === 10 || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168) || (first === 169 && second === 254);
}

function parseCustomUrl(value: unknown) {
  const invalid = () => new PlannerTransportError('invalid_url');
  if (typeof value !== 'string' || value.length > MAX_BASE_URL_LENGTH
    || !/^https?:\/\//i.test(value.trim()) || /[?#\\\x00-\x1f\x7f]/.test(value.trim())) throw invalid();

  // Parse before checking the host so IPv4 aliases and bracketed IPv6 use the browser's canonical form.
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw invalid();
  }
  const local = isLocalHostname(url.hostname);
  if (url.username || url.password || (url.protocol === 'http:' && !local)) {
    throw invalid();
  }

  const path = url.pathname.replace(/\/+$/, '');
  url.pathname = path.endsWith('/chat/completions') ? path : path + '/chat/completions';
  return { endpoint: url.toString(), local };
}

export async function requestPlanner(
  input: PlannerInput | null,
  connection: PlannerConnection,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const checkedInput = parsePlannerInput(input);
  const { provider } = connection;
  if (provider === 'custom') {
    const { endpoint, local } = parseCustomUrl(connection.baseUrl);
    const model = parsePlannerModel(connection.model);
    const apiKey = parsePlannerApiKey(connection.apiKey, local);
    return requestChatPlanner(endpoint, provider, model, apiKey, checkedInput, signal);
  }

  if (!isPlannerPreset(provider)) throw new PlannerTransportError('invalid_provider');
  const model = parsePlannerModel(connection.model, PLANNER_PROVIDERS[provider].model);
  const apiKey = parsePlannerApiKey(connection.apiKey);
  return withPlannerDeadline(signal, RELAY_TIMEOUT_MS, async (requestSignal) => {
    const response = await fetch('/api/tts/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ provider, model, input: checkedInput }),
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      signal: requestSignal,
    });
    const result = await readPlannerJson(response, requestSignal, 'response').catch((error: unknown) => {
      if (response.ok) throw error;
      return undefined;
    });
    if (!response.ok) throw plannerRelayError(response.status, result);
    return parsePlannerSuggestions(result);
  });
}
