'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { useShallow } from 'zustand/shallow';
import { Headphones, LoaderCircle, Sparkles } from 'lucide-react';
import { PlannerConnectionSettings } from '@/components/settings/PlannerConnectionSettings';
import { buildSynthesisRequest } from '@/lib/minimax/synthesis';
import {
  applyPlannerSuggestions,
  createPlannerRun,
  PLANNER_STYLES,
  previewPlannerSuggestion,
  samePlannerDraft,
  validatePlannerSuggestions,
  type PlannerDraft,
  type PlannerRun,
  type PlannerStyle,
  type PlannerSuggestion,
} from '@/lib/planner/core';
import { requestPlanner } from '@/lib/planner/transport';
import { usePlannerSettingsStore } from '@/lib/store/usePlannerSettingsStore';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useTTSStore } from '@/lib/store/useTTSStore';

const STYLE_LABELS: Record<PlannerStyle, string> = {
  natural: '自然',
  'short-video': '短视频口播',
  story: '讲故事',
  promo: '宣传片旁白',
};

const KIND_LABELS: Record<PlannerSuggestion['kind'], string> = {
  pause: '停顿',
  effect: '副语言',
  filler: '语气词',
  pronunciation: '发音',
  price: '价格读法',
  rewrite: '口播润色',
};

const PROMO_LABELS = { opening: '宏大开场', title: '正式标题', ending: '片尾收束' };

const STALE_MESSAGE = '稿件、发音词典或合成模型已变更，请重新分析。';
const MUTED_TEXT = 'text-xs text-[rgb(var(--muted-foreground))]';
const DISABLED_BUTTON = 'disabled:cursor-not-allowed disabled:opacity-40';

type PlanSnapshot = { run: PlannerRun; revision: number; scope: string };
type TTSState = ReturnType<typeof useTTSStore.getState>;
type Analysis = PlanSnapshot & (
  | { status: 'pending' | 'stale' }
  | ({ status: 'ready' } & ReturnType<typeof validatePlannerSuggestions>)
);

function isCurrentDraft({ run, revision }: PlanSnapshot, tts: PlannerDraft & Pick<TTSState, 'plannerDraftRevision'>) {
  return tts.plannerDraftRevision === revision && samePlannerDraft(run.draft, tts);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function fetchPreview(
  tts: TTSState,
  draft: PlannerDraft,
  { apiKey, baseUrl }: { apiKey: string; baseUrl: string },
  signal: AbortSignal,
) {
  const response = await fetch('/api/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'x-base-url': baseUrl },
    body: JSON.stringify(buildSynthesisRequest(tts, draft)),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(typeof data?.error === 'string' ? data.error : `试听合成失败（HTTP ${response.status}）。`);
  }
  const blob = await response.blob();
  if (!blob.size || !blob.type.startsWith('audio/')) throw new Error('合成服务未返回有效的试听音频。');
  return blob;
}

function SuggestionPreview({ plan, suggestion }: { plan: PlanSnapshot; suggestion: PlannerSuggestion }) {
  const pendingRef = useRef<AbortController | null>(null);
  const ownedUrls = useRef<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    pendingRef.current?.abort();
    pendingRef.current = null;
    ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrls.current = [];
  }, []);

  async function generatePreview() {
    const tts = useTTSStore.getState();
    if (!isCurrentDraft(plan, tts)) {
      setError(STALE_MESSAGE);
      return;
    }
    const { apiKey, baseUrl } = useSettingsStore.getState();
    if (!apiKey.trim()) {
      setError('请先在设置中填写 MiniMax 合成 API Key。');
      return;
    }

    pendingRef.current?.abort();
    ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrls.current = [];
    setUrls([]);
    setError('');
    setPending(true);

    const controller = new AbortController();
    const { signal } = controller;
    pendingRef.current = controller;
    const unsubscribe = useTTSStore.subscribe((next) => {
      if (!isCurrentDraft(plan, next)) controller.abort();
    });

    try {
      const { before, after } = previewPlannerSuggestion(plan.run, suggestion);
      const blobs = await Promise.all(
        [before, after].map((draft) => fetchPreview(tts, draft, { apiKey, baseUrl }, signal)),
      );
      if (signal.aborted || !isCurrentDraft(plan, useTTSStore.getState())) return;

      for (const blob of blobs) ownedUrls.current.push(URL.createObjectURL(blob));
      setUrls(ownedUrls.current);
    } catch (error) {
      if (signal.aborted) return;
      ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedUrls.current = [];
      setError(errorMessage(error, '试听合成失败，请重试。'));
      controller.abort();
    } finally {
      unsubscribe();
      if (pendingRef.current === controller) {
        pendingRef.current = null;
        setPending(false);
      }
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-label={`A/B 试听「${suggestion.anchor}」的${KIND_LABELS[suggestion.kind]}建议`}
        onClick={generatePreview}
        disabled={pending}
        className={`btn-secondary ${DISABLED_BUTTON}`}
      >
        {pending ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <Headphones size={14} aria-hidden />}
        {pending ? '生成试听中…' : 'A/B 试听'}
      </button>
      {pending && <span role="status" className="sr-only">正在生成 A/B 试听。</span>}
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {urls.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {['A · 原稿', 'B · 应用此建议'].map((label, index) => (
            <div key={label} className="min-w-0 space-y-1">
              <p className={MUTED_TEXT}>{label}</p>
              <audio
                className="w-full"
                aria-label={`${label}，「${suggestion.anchor}」`}
                controls
                preload="none"
                src={urls[index]}
                onError={() => setError(`${label}的试听音频无法播放。`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function suggestionLocation(suggestion: PlannerSuggestion) {
  const position = suggestion.kind === 'pronunciation'
    ? '的发音'
    : 'offset' in suggestion ? (suggestion.offset === suggestion.start ? '之前' : '之后') : '';
  return `第 ${suggestion.segmentId} 段 ·「${suggestion.anchor}」${position}（原稿第 ${suggestion.start + 1}–${suggestion.end} 字符）`;
}

export function AIPlanner({ textareaRef }: { textareaRef: RefObject<HTMLTextAreaElement> }) {
  const tts = useTTSStore(useShallow(({ text, model, pronunciationEntries, plannerDraftRevision, plannerUndo }) => ({
    text, model, pronunciationEntries, plannerDraftRevision, plannerUndo,
  })));
  const [style, setStyle] = useState<PlannerStyle>('natural');
  const [allowFillers, setAllowFillers] = useState(false);
  const [allowRewrites, setAllowRewrites] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const analysisRef = useRef<AbortController | null>(null);
  const connectionDetails = useRef<HTMLDetailsElement>(null);
  const headingId = useId();
  const scopeId = useId();

  const isStale = analysis !== null && (analysis.status === 'stale' || !isCurrentDraft(analysis, tts));
  const isAnalyzing = analysis?.status === 'pending' && !isStale;
  const ready = analysis?.status === 'ready' ? analysis : null;
  const selected = ready?.suggestions.filter(({ id }) => checked.has(id)) ?? [];

  useEffect(() => () => {
    analysisRef.current?.abort();
    analysisRef.current = null;
  }, []);

  function clearAnalysis() {
    analysisRef.current?.abort();
    analysisRef.current = null;
    setAnalysis(null);
    setChecked(new Set());
    setError('');
    setNotice('');
  }

  async function analyze() {
    clearAnalysis();

    const { text, model, pronunciationEntries, plannerDraftRevision: revision } = useTTSStore.getState();
    const textarea = textareaRef.current;
    const selection = textarea && textarea.selectionStart !== textarea.selectionEnd
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : null;
    const { connection } = usePlannerSettingsStore.getState();
    const { provider, baseUrl, apiKey, model: plannerModel } = connection;

    let run: PlannerRun;
    try {
      run = createPlannerRun({ text, model, pronunciationEntries }, selection, style, allowFillers, allowRewrites);
    } catch (error) {
      setError(errorMessage(error, '无法分析稿件，请检查文本后重试。'));
      return;
    }

    if (provider === 'custom' ? !baseUrl.trim() || !plannerModel.trim() : !apiKey.trim()) {
      if (connectionDetails.current) connectionDetails.current.open = true;
      setError(provider === 'custom' ? '请填写自定义 AI 服务的 API 地址和模型。' : '请先填写 AI API Key。');
      return;
    }

    const scope = selection ? `选区（${selection.end - selection.start} 字符）` : `整稿（${text.length} 字符）`;
    const plan = { run, revision, scope };
    const controller = new AbortController();
    const { signal } = controller;
    analysisRef.current = controller;
    setAnalysis({ ...plan, status: 'pending' });

    const markStale = () => {
      controller.abort();
      setAnalysis({ ...plan, status: 'stale' });
    };
    const unsubscribeDraft = useTTSStore.subscribe((next) => {
      if (!signal.aborted && !isCurrentDraft(plan, next)) markStale();
    });
    const unsubscribeConnection = usePlannerSettingsStore.subscribe(() => {
      if (signal.aborted) return;
      controller.abort();
      setAnalysis(null);
      setError('AI 连接配置已变更，请重新分析。');
    });

    try {
      const raw = await requestPlanner(run.input, connection, signal);
      if (signal.aborted) return;
      if (!isCurrentDraft(plan, useTTSStore.getState())) {
        markStale();
        return;
      }
      setAnalysis({ ...plan, status: 'ready', ...validatePlannerSuggestions(run, raw) });
    } catch (error) {
      if (signal.aborted) return;
      setAnalysis(null);
      setError(errorMessage(error, 'AI 分析失败，请重试。'));
    } finally {
      unsubscribeDraft();
      unsubscribeConnection();
      if (analysisRef.current === controller) analysisRef.current = null;
    }
  }

  function toggleSuggestion(id: string, enabled: boolean) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function applySelected() {
    if (!ready || selected.length === 0) return;
    setError('');
    setNotice('');
    const current = useTTSStore.getState();
    if (!isCurrentDraft(ready, current)) {
      setError(STALE_MESSAGE);
      return;
    }

    try {
      const next = applyPlannerSuggestions(ready.run, selected);
      if (!current.applyPlannerDraft(ready.run.draft, next, ready.revision)) {
        setError(STALE_MESSAGE);
        return;
      }
      setAnalysis(null);
      setChecked(new Set());
      setNotice(`已应用 ${selected.length} 条建议。`);
    } catch (error) {
      setError(errorMessage(error, '无法应用建议，请重试。'));
    }
  }

  function undo() {
    setError('');
    setNotice('');
    if (useTTSStore.getState().undoPlannerDraft()) {
      setNotice('已撤销上次应用。');
    } else {
      setError('稿件已变更，无法撤销上次应用。');
    }
  }

  return (
    <section aria-labelledby={headingId} className="card space-y-4 p-4">
      <h3 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} className="text-violet-600 dark:text-violet-400" aria-hidden />
        AI 配音编排
      </h3>

      <details ref={connectionDetails} className="rounded-xl border border-[rgb(var(--border))] px-3">
        <summary className="cursor-pointer py-2.5 text-sm font-medium">AI 连接配置</summary>
        <div className="pb-3">
          <PlannerConnectionSettings showHeading={false} />
        </div>
      </details>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="block min-w-32">
          <span className="label block">分析风格</span>
          <select
            className="input-field"
            value={style}
            disabled={isAnalyzing}
            onChange={(event) => {
              setStyle(event.target.value as PlannerStyle);
              clearAnalysis();
            }}
          >
            {PLANNER_STYLES.map((option) => (
              <option key={option} value={option}>{STYLE_LABELS[option]}</option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 self-center text-sm sm:self-end sm:pb-2.5">
          <input
            type="checkbox"
            checked={allowFillers}
            disabled={isAnalyzing}
            onChange={(event) => {
              setAllowFillers(event.target.checked);
              clearAnalysis();
            }}
            className="rounded accent-violet-600"
          />
          允许建议语气词
        </label>
        <label className="flex cursor-pointer items-center gap-2 self-center text-sm sm:self-end sm:pb-2.5">
          <input
            type="checkbox"
            checked={allowRewrites}
            disabled={isAnalyzing}
            onChange={(event) => {
              setAllowRewrites(event.target.checked);
              clearAnalysis();
            }}
            className="rounded accent-violet-600"
          />
          口播润色与价格读法
        </label>
        <button
          type="button"
          onClick={analyze}
          disabled={isAnalyzing || !tts.text.trim()}
          aria-describedby={scopeId}
          className="btn-primary"
        >
          {isAnalyzing && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          {isAnalyzing ? '分析中…' : analysis ? '重新分析' : '分析稿件'}
        </button>
        {tts.plannerUndo && (
          <button
            type="button"
            onClick={undo}
            disabled={!samePlannerDraft(tts.plannerUndo.after, tts)}
            className={`btn-secondary ${DISABLED_BUTTON}`}
          >
            撤销上次应用
          </button>
        )}
      </div>
      <p id={scopeId} className={MUTED_TEXT}>
        分析编辑器中的选区。没有选区时分析整稿。
        {style === 'promo' && !allowRewrites && ' 勾选口播润色与价格读法可获得开场、标题和片尾的措辞建议。'}
      </p>

      <div role="status" className={MUTED_TEXT}>
        {isAnalyzing && `正在分析${analysis.scope}…`}
        {isStale && STALE_MESSAGE}
        {notice}
        {ready && !isStale && (
          <>
            已分析{ready.scope}。{ready.suggestions.length > 0 ? `找到 ${ready.suggestions.length} 条建议。` : '没有可应用的建议。'}
            {ready.rejected > 0 && ` 已过滤 ${ready.rejected} 条无效或冲突的建议。`}
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {ready && !isStale && ready.suggestions.length > 0 && (
        <>
          <ul className="space-y-2">
            {ready.suggestions.map((suggestion) => (
              <li key={suggestion.id} className="min-w-0 space-y-2 rounded-xl border border-[rgb(var(--border))] p-3">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checked.has(suggestion.id)}
                    onChange={(event) => toggleSuggestion(suggestion.id, event.target.checked)}
                    className="mt-1 rounded accent-violet-600"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold">
                        {suggestion.kind === 'rewrite' && suggestion.focus ? PROMO_LABELS[suggestion.focus] : KIND_LABELS[suggestion.kind]}
                      </span>
                      <span className="whitespace-pre-wrap break-all font-mono">{suggestion.value}</span>
                    </span>
                    <span className={`block break-words ${MUTED_TEXT}`}>{suggestionLocation(suggestion)}</span>
                  </span>
                </label>
                <p className="break-words text-sm">{suggestion.reason}</p>
                <SuggestionPreview plan={ready} suggestion={suggestion} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-primary"
            disabled={selected.length === 0}
            onClick={applySelected}
          >
            应用所选建议{selected.length > 0 && `（${selected.length}）`}
          </button>
        </>
      )}
    </section>
  );
}
