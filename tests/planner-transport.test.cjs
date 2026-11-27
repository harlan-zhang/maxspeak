const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { test } = require('node:test');
const loadTypeScript = require('./load-typescript.cjs');

const timeout = { timeout: 60_000 };
const input = {
  segments: [{ id: 'segment-1', text: '独家稿件，今天出发。' }],
  style: 'story',
  speechModel: 'speech-2.8-hd',
  allowFillers: true,
};
const preset = { provider: 'openai', model: '', baseUrl: '', apiKey: 'planner-secret' };
const custom = {
  provider: 'custom',
  model: 'test/model',
  baseUrl: 'https://gateway.example/api/v1/',
  apiKey: 'custom-secret',
};
const suggestions = [{ segmentId: 'segment-1', extra: ['runtime validation'] }, null];

test('synchronous preview and streaming synthesis forbid upstream redirects', timeout, async () => {
  for (const route of ['synthesize', 'stream']) {
    let outbound;
    const { POST } = loadTypeScript('app/api/tts/' + route + '/route.ts', {
      setTimeout: (...args) => setTimeout(...args).unref(),
      fetch: async (url, options) => {
        outbound = { url, redirect: options.redirect };
        return Response.json({ data: { audio: '00'.repeat(100) }, base_resp: { status_code: 0 } });
      },
    });
    const response = await POST(new Request('http://localhost/api/tts/' + route, {
      method: 'POST',
      headers: { 'x-api-key': 'synthesis-test-key' },
      body: JSON.stringify({ text: 'Sample excerpt.' }),
    }));
    await response.arrayBuffer();
    assert.equal(response.ok, true);
    assert.deepEqual(outbound, { url: 'https://api.minimax.io/v1/t2a_v2', redirect: 'error' });
  }
});

function fixtures(fetch, globals = {}) {
  const modules = new Map();
  const runtime = { fetch, ...globals };
  return {
    transport: () => loadTypeScript('lib/planner/transport.ts', runtime, modules),
    route: () => loadTypeScript('app/api/tts/plan/route.ts', runtime, modules),
  };
}

function completion(content, extra = {}) {
  return Response.json({ choices: [{ message: { content } }], ...extra });
}

function relayRequest(body, headerOverrides = {}) {
  return new Request('http://localhost/api/tts/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': preset.apiKey, ...headerOverrides },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('browser uses the same-origin relay for a preset and forwards only the separate planner key', timeout, async () => {
  const { transport } = fixtures(async (url, options) => {
    assert.equal(String(url), '/api/tts/plan');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    const headers = new Headers(options.headers);
    assert.equal(headers.get('x-api-key'), preset.apiKey);
    assert.equal(headers.has('authorization'), false);
    assert.deepEqual(JSON.parse(options.body), { provider: 'openai', model: 'override-model', input });
    return Response.json({ suggestions });
  });
  const { requestPlanner } = transport();
  const connection = { ...preset, model: 'override-model', baseUrl: custom.baseUrl };
  assert.deepEqual(await requestPlanner(input, connection), suggestions);
});

test('custom chat goes directly to the gateway with no ambient credentials or redirects', timeout, async () => {
  const { transport } = fixtures(async (url, options) => {
    assert.equal(String(url), 'https://gateway.example/api/v1/chat/completions');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    const headers = new Headers(options.headers);
    assert.equal(headers.get('authorization'), 'Bearer custom-secret');
    assert.equal(headers.has('x-api-key'), false);
    const { messages, model, stream } = JSON.parse(options.body);
    assert.equal(stream, false);
    assert.equal(model, 'test/model');
    assert.deepEqual(JSON.parse(messages[1].content), input);
    assert.match(messages[0].content, /chong2 qing4/);
    assert.match(messages[0].content, /ˈnaɪki/);
    assert.match(messages[0].content, /segmentId/);
    assert.match(messages[0].content, /chuckle/);
    assert.match(messages[0].content, /hmm/);
    return completion('<think>reasoning</think>\n' + String.fromCharCode(96).repeat(3) +
      'json\n' + JSON.stringify({ suggestions }) + '\n' + String.fromCharCode(96).repeat(3));
  });
  assert.deepEqual(await transport().requestPlanner(input, custom), suggestions);
});

test('custom connection test uses fixed text and takes a full local endpoint without a key', timeout, async () => {
  let probe;
  const { transport } = fixtures(async (url, options) => {
    assert.equal(String(url), 'http://[::1]:11434/v1/chat/completions');
    assert.equal(new Headers(options.headers).has('authorization'), false);
    const body = JSON.parse(options.body);
    assert.equal(body.messages.length, 1);
    assert.equal(body.messages[0].role, 'user');
    probe = body.messages[0].content;
    return completion('OK');
  });
  assert.deepEqual(await transport().requestPlanner(null, {
    ...custom, baseUrl: 'http://[::1]:11434/v1/chat/completions/', apiKey: '',
  }), []);
  assert.equal(probe, 'Reply with exactly OK.');
});

test('custom rejects insecure or credential-bearing URLs, remote missing keys and missing model IDs', timeout, async () => {
  let calls = 0;
  const { transport } = fixtures(() => { calls++; });
  const { requestPlanner } = transport();
  for (const baseUrl of [
    'http://example.com/v1', 'http://localhost.example.com/v1', 'https://user:pass@example.com/v1',
    'https://example.com/v1?token=private', 'https://example.com/v1#fragment', 'file:///v1',
  ]) {
    await assert.rejects(requestPlanner(null, { ...custom, baseUrl }));
  }
  await assert.rejects(requestPlanner(null, { ...custom, apiKey: '' }));
  await assert.rejects(requestPlanner(null, { ...custom, model: ' ' }));
  assert.equal(calls, 0);
});

test('accepts explicit private LAN destinations without a key in the browser', timeout, async () => {
  const received = [];
  const { transport } = fixtures(async (url, options) => {
    received.push(String(url));
    assert.equal(new Headers(options.headers).has('authorization'), false);
    return completion('OK');
  });
  const hosts = [
    'localhost', '127.0.0.2', '10.1.2.3', '172.16.0.1', '172.31.255.254',
    '192.168.0.14', '169.254.6.7', 'voice.lab.local', 'voice.local.',
    '[::1]', '[fd12::2]', '[fe80::1]', '[febf::1]',
  ];
  for (const host of hosts) {
    assert.deepEqual(await transport().requestPlanner(null, {
      ...custom, baseUrl: 'http://' + host + ':1234/v1', apiKey: '',
    }), []);
  }
  assert.deepEqual(received, hosts.map((host) => 'http://' + host + ':1234/v1/chat/completions'));
});

test('rejects public HTTP hosts even when a key is present', timeout, async () => {
  let calls = 0;
  const { transport } = fixtures(() => { calls++; });
  const publicHosts = [
    '8.8.8.8', '172.15.255.254', '172.32.0.1', '192.169.1.1', '169.253.1.1',
    'router.local.example', 'intranet', '[2001:db8::1]', '[fec0::1]',
  ];
  for (const host of publicHosts) {
    await assert.rejects(transport().requestPlanner(null, {
      ...custom, baseUrl: 'http://' + host + '/v1',
    }), { code: 'invalid_url' });
  }
  assert.equal(calls, 0);
});

test('accepts an HTTPS LAN gateway without a key', timeout, async () => {
  const { transport } = fixtures(async (url, options) => {
    assert.equal(String(url), 'https://192.168.1.7/v1/chat/completions');
    assert.equal(new Headers(options.headers).has('authorization'), false);
    return completion('OK');
  });
  await transport().requestPlanner(null, { ...custom, baseUrl: 'https://192.168.1.7/v1', apiKey: '' });
});

test('relay calls only fixed official endpoints and defaults to each preset model', timeout, async () => {
  const urls = {
    minimax: 'https://api.minimax.io/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  };
  const models = {
    minimax: 'MiniMax-M3.1-Flash',
    openai: 'gpt-6.1-terra',
    deepseek: 'deepseek-flash',
    openrouter: 'openai/gpt-6.1-terra',
  };
  let call;
  const { route, transport } = fixtures(async (url, options) => {
    call = { url: String(url), options, body: JSON.parse(options.body) };
    return completion('{"suggestions":[]}');
  });
  for (const [provider, url] of Object.entries(urls)) {
    const response = await route().POST(relayRequest({ provider, input }, {
      'x-base-url': 'https://elsewhere.example', 'authorization': 'Bearer other-secret',
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { suggestions: [] });
    assert.equal(call.url, url);
    assert.equal(call.options.redirect, 'error');
    assert.equal(new Headers(call.options.headers).get('authorization'), 'Bearer planner-secret');
    assert.equal(transport().PLANNER_PROVIDERS[provider].model, models[provider]);
    assert.equal(call.body.model, models[provider]);
    if (provider === 'minimax') {
      assert.equal(call.body.reasoning_split, true);
      assert.equal(call.body.reasoning_effort, 'low');
      assert.notEqual(call.body.thinking?.type, 'disabled');
    }
  }
});

test('relay null input uses the same fixed connection probe as custom', timeout, async () => {
  const { route } = fixtures(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.messages, [{ role: 'user', content: 'Reply with exactly OK.' }]);
    return completion('OK');
  });
  const response = await route().POST(relayRequest({ provider: 'deepseek', input: null }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { suggestions: [] });
});

test('relay rejects custom providers, prototype keys, supplied base URLs, absent keys and invalid bodies', timeout, async () => {
  let calls = 0;
  const { route } = fixtures(() => { calls++; });
  const { POST } = route();
  for (const body of [
    { provider: 'custom', input: null },
    { provider: '__proto__', input: null },
    { provider: 'openai', baseUrl: custom.baseUrl, input },
    { provider: 'openai' },
    { provider: 'openai', input: { ...input, allowFillers: 'false' } },
    { provider: 'openai', input: { ...input, segments: [...input.segments, ...input.segments] } },
    '{broken',
  ]) {
    assert.equal((await POST(relayRequest(body))).status, 400);
  }
  assert.equal((await POST(relayRequest({ provider: 'openai', input }, { 'x-api-key': '' }))).status, 401);
  assert.equal(calls, 0);
});

test('both paths enforce the text limit and the relay bounds the actual request body', timeout, async () => {
  let calls = 0;
  const { route, transport } = fixtures(() => { calls++; });
  const overLimit = { ...input, segments: [{ id: 'a', text: '字'.repeat(10_000) }] };
  await assert.rejects(transport().requestPlanner(overLimit, custom));
  assert.equal((await route().POST(relayRequest({ provider: 'openai', input: overLimit }))).status, 413);
  const largeBody = JSON.stringify({ provider: 'openai', input, additional: 'x'.repeat(150_000) });
  assert.equal((await route().POST(relayRequest(largeBody))).status, 413);
  assert.equal(calls, 0);
});

test('limits upstream response bytes even without a declared length', timeout, async () => {
  let canceled = false;
  const { transport } = fixtures(async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(257 * 1024)); },
    cancel() { canceled = true; },
  })));
  await assert.rejects(transport().requestPlanner(input, custom), /过大/);
  assert.equal(canceled, true);
});

test('sanitizes upstream HTTP errors, MiniMax business errors, malformed JSON and relay errors', timeout, async () => {
  const sensitive = 'private-key-or-manuscript';
  for (const response of [
    () => new Response(sensitive, { status: 401 }),
    () => completion('OK', { base_resp: { status_code: 1004, status_msg: sensitive } }),
    () => completion('{"suggestions": [' + sensitive),
    () => completion(JSON.stringify({ suggestions: Array(61).fill(null) })),
  ]) {
    const { route } = fixtures(async () => response());
    const result = await route().POST(relayRequest({ provider: 'minimax', input }));
    assert.ok([401, 502].includes(result.status));
    assert.doesNotMatch(await result.text(), new RegExp(sensitive));
  }
  const { transport } = fixtures(async () => Response.json({ error: sensitive }, { status: 502 }));
  await assert.rejects(transport().requestPlanner(input, preset), (error) => {
    assert.doesNotMatch(error.message, new RegExp(sensitive));
    return true;
  });
});

test('cancels after response headers if the body stalls and keeps timeout distinct from user cancellation', timeout, async () => {
  const { transport } = fixtures(async () => new Response(new ReadableStream({})), {
    setTimeout: (callback) => setTimeout(callback, 10),
  });
  const { requestPlanner } = transport();
  await assert.rejects(requestPlanner(input, custom), /超时/);
  const controller = new AbortController();
  const pending = requestPlanner(input, custom, controller.signal);
  controller.abort(new Error('private abort reason'));
  await assert.rejects(pending, { name: 'AbortError' });
});

test('custom does not retry when the browser rejects a redirect or CORS', timeout, async () => {
  let calls = 0;
  const { transport } = fixtures(async (_url, options) => {
    calls++;
    assert.equal(options.redirect, 'error');
    throw new TypeError('do not disclose custom-secret');
  });
  await assert.rejects(transport().requestPlanner(input, custom), /CORS/);
  assert.equal(calls, 1);
});

test('the real Fetch API refuses to forward a planner key across a redirect', timeout, async (context) => {
  const calls = [];
  const server = createServer((request, response) => {
    calls.push({ path: request.url, authorization: request.headers.authorization });
    if (request.url === '/v1/chat/completions') {
      response.writeHead(307, { Location: '/redirect-target' });
    }
    response.end();
  });
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { transport } = fixtures(fetch);
  await assert.rejects(transport().requestPlanner(null, {
    ...custom, baseUrl: 'http://127.0.0.1:' + server.address().port + '/v1',
  }), { code: 'custom_unreachable' });
  assert.deepEqual(calls, [{ path: '/v1/chat/completions', authorization: 'Bearer custom-secret' }]);
});
