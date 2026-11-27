const assert = require('node:assert/strict');
const { test } = require('node:test');
const loadTypeScript = require('./load-typescript.cjs');

function fixture(text, options = {}) {
  const core = loadTypeScript('lib/planner/core.ts');
  const draft = {
    text,
    model: options.model ?? 'speech-2.8-hd',
    pronunciationEntries: options.entries ?? [],
  };
  const run = core.createPlannerRun(draft, options.selection ?? null, options.style ?? 'natural', options.fillers ?? false, options.revisions);
  const suggest = (anchor, options = {}) => ({
    segmentId: run.input.segments.find((segment) => segment.text.includes(anchor))?.id,
    anchor,
    kind: 'pause',
    position: 'after',
    value: '0.50',
    reason: '给下一句留出停顿',
    ...options,
  });
  return { core, draft, run, suggest };
}

test('applies reviewed Chinese pinyin, English IPA and a pause without rewriting the draft', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('欢迎来到重庆。接下来介绍 Nike 和 GPU。');
  const { suggestions, rejected } = core.validatePlannerSuggestions(run, [
    suggest('欢迎来到重庆。'),
    suggest('重庆', { kind: 'pronunciation', format: 'pinyin', value: 'chong2 qing4' }),
    suggest('Nike', { kind: 'pronunciation', format: 'ipa', value: 'ˈnaɪki' }),
    suggest('GPU', { kind: 'pronunciation', format: 'alias', value: 'G P U' }),
  ]);
  assert.equal(rejected, 0);
  const applied = core.applyPlannerSuggestions(run, suggestions);
  assert.equal(applied.text, '欢迎来到重庆。<#0.5#>接下来介绍 Nike 和 GPU。');
  assert.deepEqual(applied.pronunciationEntries, [
    { original: '重庆', pronunciation: '(chong2)(qing4)' },
    { original: 'Nike', pronunciation: '(ˈnaɪki)' },
    { original: 'GPU', pronunciation: 'G P U' },
  ]);
  const preview = core.previewPlannerSuggestion(run, suggestions[2]);
  assert.equal(preview.before.text, preview.after.text);
  assert.deepEqual(preview.after.pronunciationEntries, [applied.pronunciationEntries[1]]);
  assert.equal(core.samePlannerDraft(run.draft, applied), false);
});

test('honors selection offsets and keeps pause previews inside pronounceable context', { timeout: 60_000 }, () => {
  const text = '序言。第一句，第二句。后记。';
  const { core, run, suggest } = fixture(text, { selection: { start: 3, end: 11 } });
  assert.deepEqual(run.input.segments.map((segment) => segment.text), ['第一句，第二句。']);
  const { suggestions } = core.validatePlannerSuggestions(run, [suggest('第一句，')]);
  assert.equal(suggestions[0].start, 3);
  const applied = core.applyPlannerSuggestions(run, suggestions);
  assert.equal(applied.text, '序言。第一句，<#0.5#>第二句。后记。');
  const { before, after } = core.previewPlannerSuggestion(run, suggestions[0]);
  assert.equal(after.text.replace('<#0.5#>', ''), before.text);
  assert.equal(after.text, '第一句，<#0.5#>第二句。');
});

test('keeps preview text and dictionary entries inside the selected excerpt', { timeout: 60_000 }, () => {
  const text = 'Private Client. Start. Continue.';
  const { core, run, suggest } = fixture(text, {
    selection: { start: 16, end: text.length },
    entries: [{ original: 'Private Client', pronunciation: 'internal' }],
  });
  const { suggestions } = core.validatePlannerSuggestions(run, [suggest('Start.')]);
  const { before, after } = core.previewPlannerSuggestion(run, suggestions[0]);
  assert.equal(before.text, 'Start. Continue.');
  assert.equal(after.text, 'Start.<#0.5#> Continue.');
  assert.equal(before.pronunciationEntries.length, 0);
  assert.equal(after.pronunciationEntries.length, 0);
});

test('preserves words and decimal numbers and distinguishes ordinary parentheses from tags', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('总价 12.50 元。Москва 在这里。');
  assert.equal(core.validatePlannerSuggestions(run, [suggest('12.'), suggest('Мос')]).rejected, 2);
  assert.equal(fixture('(Call Alice.)', { selection: { start: 6, end: 11 } }).run.input.segments[0].text, 'Alice');
  for (const marker of ['(breath)', '(chong2)', '(ˈnaɪki)']) {
    assert.throws(() => fixture('读' + marker + '。', { selection: { start: 3, end: 5 } }), /标记/);
  }
});

test('offers the same spoken price at both explicit occurrences and keeps pause tags in the exported text', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('天呐<#0.3#>只需要9.9<#0.25#>全场只需9.9', { revisions: true });
  const { suggestions, rejected } = core.validatePlannerSuggestions(run, [
    suggest('9.9', { kind: 'price' }),
    suggest('9.9', { kind: 'price', occurrence: 1 }),
    suggest('9.9', { kind: 'price', occurrence: 2 }),
    suggest('9.9', { kind: 'price', occurrence: 3 }),
    suggest('9', { kind: 'price', occurrence: 1 }),
  ]);
  assert.equal(rejected, 3);
  assert.deepEqual(suggestions.map(({ value }) => value), ['九块九', '九块九']);
  assert.equal(core.applyPlannerSuggestions(run, suggestions).text, '天呐<#0.3#>只需要九块九<#0.25#>全场只需九块九');
  assert.equal(core.previewPlannerSuggestion(run, suggestions[1]).after.text, '天呐<#0.3#>只需要9.9<#0.25#>全场只需九块九');
});

test('reads a full RMB amount but rejects discounts, percentages and foreign currencies', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('仅需12.05元，另有9.9折、9.9%和9.9美元的说明。', { revisions: true });
  const { suggestions, rejected } = core.validatePlannerSuggestions(run, [
    suggest('12.05元', { kind: 'price', value: '十四块' }),
    ...[1, 2, 3].map((occurrence) => suggest('9.9', { kind: 'price', occurrence })),
  ]);
  assert.equal(rejected, 3);
  assert.deepEqual(suggestions.map(({ value }) => value), ['十二块零五分']);
});

test('counts only eligible price locations and keeps non-price numbers out of rewrites', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('原价19.9，现价9.9，会员价9.9。软件版本 9.9 已上线。折扣9.9%。', { revisions: true });
  const { suggestions, rejected } = core.validatePlannerSuggestions(run, [
    ...[1, 2, 3].map((occurrence) => suggest('9.9', { kind: 'price', occurrence })),
    suggest('折扣9.9%', { kind: 'rewrite', value: '折扣9.9元' }),
  ]);
  assert.equal(rejected, 2);
  assert.equal(core.applyPlannerSuggestions(run, suggestions).text, '原价19.9，现价九块九，会员价九块九。软件版本 9.9 已上线。折扣9.9%。');
});

test('does not create a voice marker with surrounding text or offer edits that depend on another edit shrinking the draft', { timeout: 60_000 }, () => {
  const tag = fixture('Please (sigh) and continue.', { revisions: true });
  assert.equal(tag.core.validatePlannerSuggestions(tag.run, [tag.suggest('sigh', { kind: 'rewrite', value: 'sighs' })]).rejected, 1);

  const head = '这段话可以再短一点。现在购买。';
  const { core, run, suggest } = fixture(head + '字'.repeat(9999 - head.length), {
    revisions: true, selection: { start: 0, end: head.length },
  });
  const result = core.validatePlannerSuggestions(run, [
    suggest('这段话可以再短一点。', { kind: 'rewrite', value: '请精简。' }),
    suggest('现在购买。', { kind: 'rewrite', value: '请立即购买。' }),
  ]);
  assert.equal(result.rejected, 1);
  assert.equal(result.suggestions[0].value, '请精简。');
});

test('gives 行洪 a pronunciation entry and keeps the source text for the A/B comparison', { timeout: 60_000 }, () => {
  const text = '行洪，特大洪水时弃守滩上圩堤和民埝，使大洪水在两岸大堤间畅行的措施。';
  const { core, run, suggest } = fixture(text);
  const { suggestions } = core.validatePlannerSuggestions(run, [
    suggest('行洪', { kind: 'pronunciation', format: 'pinyin', value: 'xing2 hong2' }),
  ]);
  const { before, after } = core.previewPlannerSuggestion(run, suggestions[0]);
  assert.equal(before.text, after.text);
  assert.deepEqual(after.pronunciationEntries, [{ original: '行洪', pronunciation: '(xing2)(hong2)' }]);
});

test('applies reviewed promotional copy and preserves tags, amounts and existing pronunciation entries', { timeout: 60_000 }, () => {
  const text = '山河相连。<#0.4#>城市新貌\n这里有12座桥。明天继续。';
  const { core, run, suggest } = fixture(text, {
    revisions: true, style: 'promo', entries: [{ original: '山河', pronunciation: '(shan1)(he2)' }],
  });
  const cards = [
    suggest('山河相连。', { kind: 'rewrite', focus: 'opening', value: '山河展卷。' }),
    suggest('这里有12座桥。', { kind: 'rewrite', value: '这里有13座桥。' }),
    suggest('城市新貌', { kind: 'rewrite', value: '城市(breath)新貌' }),
    suggest('城市新貌', { kind: 'rewrite', value: '山河与城市' }),
    suggest('城市新貌', { kind: 'filler', value: '哇' }),
    suggest('城市新貌', { kind: 'rewrite', focus: 'title', value: '城市建设新篇章' }),
    suggest('明天继续。', { kind: 'rewrite', focus: 'ending', value: '新的篇章，明天继续。' }),
  ];
  const { suggestions, rejected } = core.validatePlannerSuggestions(run, cards);
  assert.equal(rejected, 5);
  assert.deepEqual(suggestions.map(({ focus }) => focus), ['title', 'ending']);
  assert.equal(core.applyPlannerSuggestions(run, suggestions).text, '山河相连。<#0.4#>城市建设新篇章\n这里有12座桥。新的篇章，明天继续。');
  const withoutOptIn = fixture(text, { style: 'promo' });
  assert.equal(withoutOptIn.core.validatePlannerSuggestions(withoutOptIn.run, cards.slice(-2)).rejected, 2);
});

test('rejects combinations that expand an AI pronunciation rule to newly inserted speech', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('I am well. Continue now.', { fillers: true });
  const ambiguous = [
    suggest('well', { kind: 'pronunciation', format: 'alias', value: 'welcome' }),
    suggest('Continue', { kind: 'filler', position: 'before', value: 'well' }),
  ];
  assert.equal(core.validatePlannerSuggestions(run, ambiguous).suggestions.length, 1);
  assert.equal(core.validatePlannerSuggestions(run, ambiguous.reverse()).suggestions.length, 1);
});

test('filters unsafe anchors, hand-written rules, conflicting insertions and unavailable effects', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('来来，来来。<#1#>重庆有 Nike 和 ABC。(breath)结尾。', {
    model: 'speech-2.6-hd',
    entries: [{ original: '重庆', pronunciation: '(chong2)(qing4)' }],
  });
  const { suggestions, rejected } = core.validatePlannerSuggestions(run, [
    suggest('来来'),
    suggest('来来。'),
    suggest('breath', { kind: 'pronunciation', format: 'alias', value: 'breathes' }),
    suggest('重', { kind: 'pronunciation', format: 'pinyin', value: 'chong2' }),
    suggest('Nike', { kind: 'effect', value: 'chuckle' }),
    suggest('ABC', { kind: 'effect', value: 'crying' }),
    suggest('Nike'),
    suggest('Nike', { value: '0.8' }),
    suggest('BC', { kind: 'pronunciation', format: 'alias', value: 'B C' }),
  ]);
  assert.deepEqual(suggestions.map(({ kind, value }) => [kind, value]), [['pause', '<#0.5#>']]);
  assert.equal(rejected, 8);
  assert.throws(() => core.createPlannerRun(run.draft, { start: 9, end: 24 }, 'natural', false), /标记/);
});

test('blocks filler output by default and applies only whitelisted fillers after opt-in', { timeout: 60_000 }, () => {
  for (const fillers of [false, true]) {
    const { core, run, suggest } = fixture('你好。欢迎光临！', { fillers });
    const result = core.validatePlannerSuggestions(run, [
      suggest('你好。', { kind: 'filler', value: '嗯' }),
      suggest('欢迎', { kind: 'filler', value: '特别推荐' }),
      suggest('欢迎', { kind: 'effect', value: 'whistles' }),
      suggest('光临', { kind: 'effect', value: 'chuckle' }),
    ]);
    assert.deepEqual(result.suggestions.map((item) => item.kind), fillers ? ['filler', 'effect'] : ['effect']);
    assert.equal(core.applyPlannerSuggestions(run, result.suggestions).text,
      fillers ? '你好。嗯，欢迎光临(chuckle)！' : '你好。欢迎光临(chuckle)！');
  }
});

test('blocks globally ambiguous dictionary anchors and checks the rendered text limit', { timeout: 60_000 }, () => {
  const { core, run, suggest } = fixture('今日重庆。明日重庆。', { selection: { start: 0, end: 5 } });
  assert.equal(core.validatePlannerSuggestions(run, [
    suggest('重庆', { kind: 'pronunciation', format: 'pinyin', value: 'chong2 qing4' }),
  ]).rejected, 1);
  const overlap = fixture('哈哈哈，你好。', { selection: { start: 0, end: 2 } });
  assert.equal(overlap.core.validatePlannerSuggestions(overlap.run, [
    overlap.suggest('哈哈', { kind: 'pronunciation', format: 'pinyin', value: 'ha1 ha1' }),
  ]).rejected, 1);
  const almostFull = fixture('开始。' + '字'.repeat(9994) + '结束');
  assert.equal(almostFull.core.validatePlannerSuggestions(almostFull.run, [
    almostFull.suggest('开始。'),
  ]).rejected, 1);
});

test('applies and undoes an atomic text and dictionary change without clobbering later edits', { timeout: 60_000 }, () => {
  const { core, draft, run, suggest } = fixture('欢迎重庆。下面继续。');
  const { useTTSStore } = loadTypeScript('lib/store/useTTSStore.ts');
  const { suggestions } = core.validatePlannerSuggestions(run, [
    suggest('欢迎重庆。'),
    suggest('重庆', { kind: 'pronunciation', format: 'pinyin', value: 'chong2 qing4' }),
  ]);
  const after = core.applyPlannerSuggestions(run, suggestions);
  useTTSStore.setState(draft);
  const notifications = [];
  const unsubscribe = useTTSStore.subscribe((state) => notifications.push(state));
  try {
    assert.equal(useTTSStore.getState().applyPlannerDraft(draft, after), true);
    assert.equal(notifications.length, 1);
    assert.equal(core.samePlannerDraft(notifications[0], after), true);
    assert.equal(useTTSStore.getState().undoPlannerDraft(), true);
    assert.equal(core.samePlannerDraft(useTTSStore.getState(), draft), true);
    assert.equal(useTTSStore.getState().applyPlannerDraft(draft, after), true);
    useTTSStore.getState().setText('新稿');
    assert.equal(useTTSStore.getState().undoPlannerDraft(), false);
    assert.equal(useTTSStore.getState().applyPlannerDraft(draft, after), false);
    assert.equal(useTTSStore.getState().text, '新稿');
    const previousRevision = useTTSStore.getState().plannerDraftRevision;
    useTTSStore.getState().setText(draft.text);
    useTTSStore.setState({ pronunciationEntries: draft.pronunciationEntries });
    assert.equal(useTTSStore.getState().applyPlannerDraft(draft, after, previousRevision), false);
  } finally {
    unsubscribe();
  }
});
