import { isPlannerPreset, PLANNER_PROVIDERS } from '@/lib/planner/transport';
import { requestChatPlanner } from '@/lib/planner/transport-chat';
import {
  isRecord,
  parsePlannerApiKey,
  parsePlannerInput,
  parsePlannerModel,
  PlannerTransportError,
  readPlannerJson,
  withPlannerDeadline,
} from '@/lib/planner/transport-protocol';

const PRESET_ENDPOINTS: Record<keyof typeof PLANNER_PROVIDERS, string> = {
  minimax: 'https://api.minimax.io/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

const REQUEST_TIMEOUT_MS = 8000;
const headers = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  try {
    const apiKey = parsePlannerApiKey(request.headers.get('x-api-key'));
    const body = await withPlannerDeadline(request.signal, REQUEST_TIMEOUT_MS, (signal) =>
      readPlannerJson(request, signal, 'request'));
    if (!isRecord(body) || 'baseUrl' in body) throw new PlannerTransportError('invalid_request');

    const { provider } = body;
    if (!isPlannerPreset(provider)) throw new PlannerTransportError('invalid_provider');
    const model = parsePlannerModel(body.model, PLANNER_PROVIDERS[provider].model);
    const input = parsePlannerInput(body.input);
    const suggestions = await requestChatPlanner(PRESET_ENDPOINTS[provider], provider, model, apiKey, input, request.signal);
    return Response.json({ suggestions }, { headers });
  } catch (error) {
    const failure = error instanceof PlannerTransportError
      ? error
      : new PlannerTransportError(request.signal.aborted ? 'canceled' : 'unavailable');
    return Response.json({ error: failure.message, code: failure.code }, { status: failure.status, headers });
  }
}
