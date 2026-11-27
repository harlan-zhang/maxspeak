const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function loadTypeScript(entry, globals = {}, modules = new Map()) {
  const filename = path.resolve(__dirname, '..', entry);
  if (modules.has(filename)) return modules.get(filename);
  const source = fs.readFileSync(filename, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const exports = {};
  modules.set(filename, exports);
  const load = (id) => {
    if (id.startsWith('@/')) {
      return loadTypeScript(id.slice(2) + '.ts', globals, modules);
    }
    if (id.startsWith('.')) {
      return loadTypeScript(path.resolve(path.dirname(filename), id) + '.ts', globals, modules);
    }
    return require(id);
  };
  new Function('exports', 'require', ...Object.keys(globals), code)(
    exports, load, ...Object.values(globals)
  );
  return exports;
}

function postVoiceList(response, onPayload = () => {}) {
  const { POST } = loadTypeScript('app/api/voices/list/route.ts', {
    fetch: async (_url, options) => {
      onPayload(JSON.parse(options.body));
      return Response.json(response);
    },
    setTimeout: (...args) => setTimeout(...args).unref(),
  });
  return POST(new Request('http://localhost/api/voices/list', {
    method: 'POST',
    headers: { 'x-api-key': 'mock-key' },
    body: JSON.stringify({ voice_type: 'all' }),
  }));
}

test('normalizes grouped and flat MiniMax voices without discarding either', { timeout: 60_000 }, async () => {
  let payload;
  const response = await postVoiceList({
    system_voice: { Chinese: [{ voice_id: 'system-id' }] },
    data: {
      voice_cloning: [{ voice_id: 'clone-id' }, { voice_id: 12 }],
      voice_list: [
        { voice_id: 'clone-id' },
        { voice_id: 'design-id', voice_type: 'voice_generation' },
      ],
    },
    base_resp: { status_code: 0 },
  }, (value) => { payload = value; });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.voice_list.map(({ voice_id, voice_type }) => [voice_id, voice_type]), [
    ['system-id', 'system'],
    ['clone-id', 'voice_cloning'],
    ['design-id', 'voice_generation'],
  ]);
  assert.deepEqual(payload, { voice_type: 'all' });
});

test('surfaces a MiniMax business error returned with HTTP 200', { timeout: 60_000 }, async () => {
  const response = await postVoiceList({
    base_resp: { status_code: 2013, status_msg: 'Invalid input parameters' },
  });
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Invalid input parameters/);
});

function catalogFixture() {
  const values = new Map();
  const events = new EventTarget();
  const browser = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    dispatchEvent: (event) => events.dispatchEvent(event),
  };
  let queue = Promise.resolve();
  const navigator = {
    locks: { request: (_key, update) => {
      const result = queue.then(update);
      queue = result.catch(() => {});
      return result;
    } },
  };
  const catalog = loadTypeScript('lib/voices/custom-voices.ts', {
    window: browser, navigator, crypto: webcrypto,
  });
  return { ...catalog, values, browser };
}

test('sync merges into the latest saved catalog and keeps local audio', async () => {
  const {
    getVoiceStorageKey, readVoiceCatalog, updateVoiceCatalog, mergeSyncedVoices, upsertVoice,
  } = catalogFixture();
  const key = await getVoiceStorageKey({ apiKey: 'account-a', baseUrl: 'https://api.minimax.io' });
  const local = { voiceId: 'local-id', name: 'Local', createdAt: 1, demoAudio: 'https://example.com/demo' };
  const sync = {
    cloned: [{ voiceId: 'synced-id', name: 'Synced' }, { voiceId: 'local-id', name: 'Updated' }],
    designed: [{ voiceId: 'design-id', prompt: 'Design', previewText: '' }],
  };

  await Promise.all([
    updateVoiceCatalog(key, (current) => ({ ...current, cloned: upsertVoice(current.cloned, local) })),
    updateVoiceCatalog(key, (current) => mergeSyncedVoices(current, sync)),
  ]);

  const saved = readVoiceCatalog(key);
  assert.deepEqual(saved.cloned.map(({ voiceId }) => voiceId).sort(), ['local-id', 'synced-id']);
  assert.equal(saved.cloned.find(({ voiceId }) => voiceId === 'local-id').demoAudio, local.demoAudio);
  assert.equal(saved.cloned.find(({ voiceId }) => voiceId === 'local-id').name, 'Updated');
  assert.deepEqual(saved.designed.map(({ voiceId }) => voiceId), ['design-id']);
});

test('account storage is isolated and matching legacy metadata requires opt-in', async () => {
  const { getVoiceStorageKey, readVoiceCatalog, saveSyncedVoices, values } = catalogFixture();
  const international = 'https://api.minimax.io';
  const accountA = await getVoiceStorageKey({ apiKey: 'account-a', baseUrl: international });
  const accountB = await getVoiceStorageKey({ apiKey: 'account-b', baseUrl: international });
  const otherRegion = await getVoiceStorageKey({ apiKey: 'account-a', baseUrl: 'https://api.minimaxi.com' });
  const legacy = JSON.stringify([
    null,
    { voiceId: 'matched', name: 'matched', createdAt: 1, demoAudio: 'https://example.com/legacy' },
    { voiceId: 'unmatched', name: 'unmatched', createdAt: 2 },
  ]);
  values.set('tts-cloned-voices', legacy);

  assert.deepEqual(readVoiceCatalog(accountA).cloned, []);
  await saveSyncedVoices(accountA, { cloned: [{ voiceId: 'matched', name: 'Matched' }], designed: [] });

  assert.deepEqual(readVoiceCatalog(accountA).cloned.map(({ voiceId }) => voiceId), ['matched']);
  assert.equal(readVoiceCatalog(accountA).cloned[0].demoAudio, undefined);
  await saveSyncedVoices(accountA, { cloned: [{ voiceId: 'matched', name: 'Matched' }], designed: [] }, true);
  assert.equal(readVoiceCatalog(accountA).cloned[0].demoAudio, 'https://example.com/legacy');
  assert.deepEqual(readVoiceCatalog(accountB).cloned, []);
  assert.deepEqual(readVoiceCatalog(otherRegion).cloned, []);
  await saveSyncedVoices(accountB, { cloned: [{ voiceId: 'matched', name: 'Same ID' }], designed: [] });
  assert.equal(readVoiceCatalog(accountB).cloned[0].demoAudio, undefined);
  assert.equal(values.get('tts-cloned-voices'), legacy);
});

test('a failed storage write keeps both categories at the previous snapshot', async () => {
  const { getVoiceStorageKey, readVoiceCatalog, saveSyncedVoices, browser } = catalogFixture();
  const key = await getVoiceStorageKey({ apiKey: 'account-a', baseUrl: 'https://api.minimax.io' });
  await saveSyncedVoices(key, { cloned: [{ voiceId: 'old', name: 'Old' }], designed: [] });
  browser.localStorage.setItem = () => { throw new Error('Storage quota'); };

  await assert.rejects(saveSyncedVoices(key, {
    cloned: [{ voiceId: 'new-clone', name: 'New' }],
    designed: [{ voiceId: 'new-design', prompt: 'New', previewText: '' }],
  }), /Storage quota/);

  assert.deepEqual(readVoiceCatalog(key).cloned.map(({ voiceId }) => voiceId), ['old']);
  assert.deepEqual(readVoiceCatalog(key).designed, []);
});

test('changing the API key or server clears an account-bound selection', (context) => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: () => null, setItem: () => {} } },
  });
  context.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  });

  const modules = new Map();
  const globals = {};
  const { useSettingsStore } = loadTypeScript('lib/store/useSettingsStore.ts', globals, modules);
  const { useTTSStore } = loadTypeScript('lib/store/useTTSStore.ts', globals, modules);
  const { setApiKey, setBaseUrl } = useSettingsStore.getState();
  const { setVoiceId } = useTTSStore.getState();

  setApiKey('account-a');
  setVoiceId('custom-id', true);
  setApiKey('account-b');
  assert.equal(useTTSStore.getState().voiceId, 'Chinese (Mandarin)_Reliable_Executive');

  setVoiceId('custom-id', true);
  setBaseUrl('https://api.minimaxi.com');
  assert.equal(useTTSStore.getState().voiceId, 'Chinese (Mandarin)_Reliable_Executive');

  setVoiceId('a-preset-id');
  setApiKey('account-c');
  assert.equal(useTTSStore.getState().voiceId, 'a-preset-id');
});
