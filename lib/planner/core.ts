import { PARAM_RANGES } from '../minimax/constants';
import { formatPauseSeconds, MAX_PAUSE_SECONDS, MIN_PAUSE_SECONDS } from '../text/pause';
import { PARALINGUISTIC_SUPPORTED_MODELS, PARALINGUISTIC_TAGS } from '../voices/paralinguistic';

export const PLANNER_STYLES = ['natural', 'short-video', 'story', 'promo'] as const;
export const PROMO_FOCUSES = ['opening', 'title', 'ending'] as const;
export const AI_EFFECT_TAGS = [
  'laughs', 'chuckle', 'coughs', 'clear-throat', 'groans', 'breath', 'pant', 'inhale',
  'exhale', 'gasps', 'sniffs', 'sighs', 'snorts', 'burps', 'lip-smacking', 'humming',
  'hissing', 'emm', 'sneezes',
] as const;
export const PLANNER_FILLERS = ['嗯', '啊', '呃', '哦', '欸', '哎', '呵', '唔', '诶', '哇', '哎呀', 'um', 'uh', 'oh', 'ah', 'hmm', 'well'] as const;
export const MAX_PLANNER_SUGGESTIONS = 60;
const MAX_FILLERS = 3;
const SEGMENT_SIZE = 500;
const PREVIEW_CONTEXT = 100;
const MAX_TEXT_LENGTH = PARAM_RANGES.textMaxLength - 1;
const SPEAKABLE = /[\p{L}\p{N}]/u;
const PUNCTUATION_OR_SPACE = /^[\p{P}\p{Z}\s]*$/u;
const MARKER_CANDIDATE = /<#[^<>\r\n]*#>|\(([^()\r\n]+)\)/g;
const IPA = /^[\p{Script=Latin}\p{M}ˈˌːˑ.‿ -]+$/u;
const IPA_SYMBOL = /[\u0250-\u02ff\u0300-\u036f\u1d00-\u1dff‿]/u;
const PRICE_CUE = /(?:原价|现价|售价|标价|价格|到手价?|活动价|会员价|优惠价|秒杀价|促销价|团购价|特价|只需要?|仅需要?|仅售|只要|只卖|低至|立减|直降)\s*(?:为|是)?[\s:：]*$/u;

export type PlannerStyle = typeof PLANNER_STYLES[number];
type PromoFocus = typeof PROMO_FOCUSES[number];
export type PronunciationEntry = { original: string; pronunciation: string };

export interface PlannerDraft {
  text: string;
  model: string;
  pronunciationEntries: PronunciationEntry[];
}

export interface PlannerInput {
  segments: { id: string; text: string }[];
  style: PlannerStyle;
  speechModel: string;
  allowFillers: boolean;
  allowRewrites?: boolean;
}

interface Range {
  start: number;
  end: number;
}

interface Marker extends Range {
  pause: boolean;
}

interface PlannerSegment extends Range {
  id: string;
  text: string;
}

export interface PlannerRun {
  draft: PlannerDraft;
  input: PlannerInput;
  scope: Range;
  segments: PlannerSegment[];
  markers: Marker[];
  dictionaryRanges: Range[];
  wordRanges: Range[];
}

interface SuggestionBase extends Range {
  id: string;
  segmentId: string;
  anchor: string;
  reason: string;
}
export type PlannerSuggestion = SuggestionBase & { value: string } & (
  | { kind: 'pause' | 'effect' | 'filler'; offset: number }
  | { kind: 'pronunciation'; format: 'pinyin' | 'ipa' | 'alias' }
  | { kind: 'price' }
  | { kind: 'rewrite'; focus?: PromoFocus }
);

function isExistingMarker(parenthetical: string | undefined) {
  return parenthetical === undefined
    || PARALINGUISTIC_TAGS.some(({ value }) => value === parenthetical)
    || /^[a-züv]{1,6}[1-6]$/iu.test(parenthetical)
    || (IPA.test(parenthetical) && IPA_SYMBOL.test(parenthetical));
}

function findMarkers(text: string): Marker[] {
  const matches = Array.from(text.matchAll(MARKER_CANDIDATE)).filter((match) => isExistingMarker(match[1]));
  return matches.map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    pause: match[0].startsWith('<#'),
  }));
}

function findOccurrences(text: string, term: string): Range[] {
  if (!term) return [];
  const escaped = term.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
  // Include overlapping matches, such as two occurrences of “哈哈” in “哈哈哈”.
  return Array.from(text.matchAll(new RegExp('(?=(' + escaped + '))', 'giu')), (match) => ({
    start: match.index,
    end: match.index + match[1].length,
  }));
}

function crossesPoint(range: Range, offset: number) {
  return range.start < offset && offset < range.end;
}

function overlaps(a: Range, b: Range) {
  return a.start < b.end && b.start < a.end;
}

function splitsSurrogate(text: string, offset: number) {
  const preceding = text.charCodeAt(offset - 1);
  const following = text.charCodeAt(offset);
  return preceding >= 0xd800 && preceding <= 0xdbff && following >= 0xdc00 && following <= 0xdfff;
}

function findWords(text: string) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  const words: Range[] = [];
  for (const { index, isWordLike, segment } of segmenter.segment(text)) {
    if (isWordLike) words.push({ start: index, end: index + segment.length });
  }
  for (const match of text.matchAll(/[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*/gu)) {
    if (/[-_]/u.test(match[0])) words.push({ start: match.index, end: match.index + match[0].length });
  }
  return words;
}

function moveToRangeEdge(offset: number, ranges: Range[], edge: keyof Range) {
  let range = ranges.find((candidate) => crossesPoint(candidate, offset));
  while (range) {
    offset = range[edge];
    range = ranges.find((candidate) => crossesPoint(candidate, offset));
  }
  return offset;
}

function speakableText(text: string) {
  return text.replace(MARKER_CANDIDATE, (match, parenthetical) => isExistingMarker(parenthetical) ? '' : match);
}

function segmentText(text: string, { start, end }: Range, protectedRanges: Range[]): PlannerSegment[] {
  const segments: PlannerSegment[] = [];
  for (let offset = start; offset < end;) {
    let cut = Math.min(offset + SEGMENT_SIZE, end);
    if (cut < end) {
      const boundaries = text.slice(offset, cut).matchAll(/[。！？!?；;\n]|\.(?=\s)/g);
      const preferred = Array.from(boundaries).at(-1);
      if (preferred && preferred.index >= SEGMENT_SIZE / 2) {
        cut = offset + preferred.index + 1;
      }

      const safeCut = moveToRangeEdge(cut, protectedRanges, 'start');
      cut = safeCut > offset ? safeCut : Math.min(end, moveToRangeEdge(cut, protectedRanges, 'end'));
      if (splitsSurrogate(text, cut)) cut--;
    }
    const fragment = text.slice(offset, cut);
    if (SPEAKABLE.test(speakableText(fragment))) {
      segments.push({ id: String(segments.length + 1), text: fragment, start: offset, end: cut });
    }
    offset = cut;
  }
  return segments;
}

export function createPlannerRun(
  draft: PlannerDraft,
  selection: Range | null,
  style: PlannerStyle,
  allowFillers: boolean,
  allowRewrites = false,
): PlannerRun {
  if (draft.text.length > MAX_TEXT_LENGTH) {
    throw new Error('配音编排的原稿需少于 10,000 字符。');
  }
  const snapshot = { text: draft.text, model: draft.model, pronunciationEntries: draft.pronunciationEntries };
  const markers = findMarkers(snapshot.text);
  const wordRanges = findWords(snapshot.text);
  const range = selection && selection.start !== selection.end
    ? selection
    : { start: 0, end: snapshot.text.length };
  if (range.start < 0 || range.end > snapshot.text.length || range.start > range.end
    || splitsSurrogate(snapshot.text, range.start) || splitsSurrogate(snapshot.text, range.end)
    || markers.some((marker) => crossesPoint(marker, range.start) || crossesPoint(marker, range.end))) {
    throw new Error('选区切断了字符或已有标记，请重新选择。');
  }
  const segments = segmentText(snapshot.text, range, [...markers, ...wordRanges]);
  if (segments.length === 0) throw new Error('请输入或选中可朗读的文本。');

  return {
    draft: snapshot,
    scope: range,
    input: {
      segments: segments.map(({ id, text }) => ({ id, text })),
      style,
      speechModel: snapshot.model,
      allowFillers,
      allowRewrites,
    },
    segments,
    markers,
    wordRanges,
    dictionaryRanges: snapshot.pronunciationEntries.flatMap(({ original }) => findOccurrences(snapshot.text, original)),
  };
}

function hasSpeechAround(text: string, offset: number) {
  return SPEAKABLE.test(speakableText(text.slice(0, offset))) && SPEAKABLE.test(speakableText(text.slice(offset)));
}

function isInternalPause(text: string, markers: Marker[], offset: number) {
  return hasSpeechAround(text, offset) && !markers.some(({ start, end, pause }) => pause && (
    (offset <= start && PUNCTUATION_OR_SPACE.test(text.slice(offset, start)))
    || (offset >= end && PUNCTUATION_OR_SPACE.test(text.slice(end, offset)))
  ));
}

function formatFiller(text: string, value: string, offset: number) {
  const left = text.slice(0, offset).trimEnd();
  const right = text.slice(offset).trimStart();
  if (SPEAKABLE.test(left.slice(-1)) && SPEAKABLE.test(right.charAt(0))) return null;

  const english = /^[a-z]+$/i.test(value);
  const prefix = english ? (offset > 0 && !/\s$/u.test(text.slice(0, offset)) ? ' ' : '') : '';
  const separator = right && !/^\p{P}/u.test(right) ? (english ? ', ' : '，') : '';
  return prefix + value + separator;
}

function formatPronunciation(anchor: string, format: string, value: string) {
  switch (format) {
    case 'pinyin': {
      if (!/^\p{Script=Han}+$/u.test(anchor)) return null;
      const syllables = value.toLowerCase().split(/\s+/u);
      if (syllables.length !== Array.from(anchor).length
        || !syllables.every((syllable) => /^[a-züv]{1,6}[1-5]$/u.test(syllable))) return null;
      return syllables.map((syllable) => '(' + syllable + ')').join('');
    }
    case 'ipa':
      return /\p{Script=Latin}/u.test(anchor) && IPA.test(value)
        && /\p{Script=Latin}/u.test(value) ? '(' + value + ')' : null;
    case 'alias':
      return /\p{Script=Latin}/u.test(anchor) && /^[\p{L}\p{M}\p{N} .,'’&+-]+$/u.test(value)
        && SPEAKABLE.test(value) && anchor.toLowerCase() !== value.toLowerCase() ? value : null;
    default:
      return null;
  }
}

function findAnchorOffset(text: string, anchor: string, occurrence: unknown, eligible?: (offset: number) => boolean) {
  if (occurrence !== undefined && (typeof occurrence !== 'number' || !Number.isSafeInteger(occurrence)
    || occurrence < 1 || occurrence > text.length)) return -1;
  let match = -1;
  let count = 0;
  for (let offset = text.indexOf(anchor); offset >= 0; offset = text.indexOf(anchor, offset + 1)) {
    if (eligible && !eligible(offset)) continue;
    if (++count === occurrence) return offset;
    if (occurrence === undefined && count > 1) return -1;
    match = offset;
  }
  return occurrence === undefined ? match : -1;
}

function formatPrice(text: string, anchor: string, start: number) {
  const amount = /^([1-9]\d?)\.(\d)(\d?)(?: *(元))?$/u.exec(anchor);
  const before = text.slice(Math.max(0, start - 30), start);
  const end = start + anchor.length;
  if (!amount || (!amount[4] && !PRICE_CUE.test(before)) || /(?:[-−＋+\p{Sc}]\s*|[\d.,])$/u.test(before)
    || /^\s*(?:[\d%％]|[.,]\d|元|块|折|版本|美元|美金|港元|港币|日元|欧元|英镑|台币|新台币|加元|澳元)/u.test(text.slice(end))) return null;

  const [, yuan, jiao, fen = ''] = amount;
  const digits = '零一二三四五六七八九';
  const yuanSpoken = yuan.length === 1 ? digits[Number(yuan)]
    : (yuan[0] === '1' ? '' : digits[Number(yuan[0])]) + '十' + (yuan[1] === '0' ? '' : digits[Number(yuan[1])]);
  const cents = Number(fen) ? `${jiao === '0' ? '零' : digits[Number(jiao)] + '毛'}${digits[Number(fen)]}分`
    : jiao === '0' ? '' : digits[Number(jiao)];
  return cents ? yuanSpoken + '块' + cents : yuanSpoken + '块';
}

function normalizeRewrite(run: PlannerRun, base: SuggestionBase, kind: 'price' | 'rewrite', value: unknown, focus: unknown): PlannerSuggestion | null {
  const text = run.draft.text;
  if (!run.input.allowRewrites || run.dictionaryRanges.some((range) => overlaps(range, base))
    || run.wordRanges.some((range) => crossesPoint(range, base.start) || crossesPoint(range, base.end))) return null;
  const id = `replace-${base.start}-${base.end}`;
  if (kind === 'price') {
    const spoken = formatPrice(text, base.anchor, base.start);
    return spoken ? { ...base, id, kind, value: spoken } : null;
  }

  if (typeof value !== 'string') return null;
  const replacement = value.trim();
  if (!SPEAKABLE.test(replacement) || base.anchor.trim() !== base.anchor || /[\r\n]/u.test(base.anchor)
    || replacement === base.anchor || /[<>\p{C}]/u.test(replacement) || findMarkers(replacement).length
    || /\p{N}/u.test(base.anchor) || /\p{N}/u.test(replacement)) return null;

  const promoFocus = PROMO_FOCUSES.find((option) => option === focus);
  if (focus !== undefined && (run.input.style !== 'promo' || !promoFocus)) return null;
  return { ...base, id, kind, value: replacement, focus: promoFocus };
}

function normalizeSuggestion(run: PlannerRun, raw: unknown): PlannerSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const { segmentId, anchor, position, kind, format, value, reason, occurrence, focus } = raw as Record<string, unknown>;
  if (typeof anchor !== 'string' || anchor.length > 120 || !SPEAKABLE.test(anchor)
    || typeof reason !== 'string' || !reason.trim() || reason.length > 240
    || (kind !== 'price' && (typeof value !== 'string' || !value.trim() || value.length > 100))) return null;

  const segment = run.segments.find(({ id }) => id === segmentId);
  if (!segment) return null;
  const text = run.draft.text;
  const eligible = kind === 'price' ? (offset: number) => Boolean(formatPrice(text, anchor, segment.start + offset)) : undefined;
  const localStart = findAnchorOffset(segment.text, anchor, kind === 'price' || kind === 'rewrite' ? occurrence : undefined, eligible);
  if (localStart < 0) return null;
  const start = segment.start + localStart;
  const end = start + anchor.length;
  if (run.markers.some((marker) => overlaps(marker, { start, end }))
    || splitsSurrogate(run.draft.text, start) || splitsSurrogate(run.draft.text, end)) return null;

  const base = { id: '', segmentId: segment.id, start, end, anchor, reason: reason.trim() };
  if (kind === 'price' || kind === 'rewrite') return normalizeRewrite(run, base, kind, value, focus);
  if (typeof value !== 'string') return null;
  if (kind === 'pronunciation') {
    if (format !== 'pinyin' && format !== 'ipa' && format !== 'alias') return null;
    const pronunciation = formatPronunciation(anchor, format, value.trim().normalize('NFC'));
    if (!pronunciation || !/^[\p{L}\p{M}\p{N} .'’&+-]+$/u.test(anchor) || anchor !== anchor.trim()
      || run.wordRanges.some((range) => crossesPoint(range, start) || crossesPoint(range, end))
      || findOccurrences(text, anchor).length !== 1
      || run.dictionaryRanges.some((range) => overlaps(range, { start, end }))) return null;
    return { ...base, id: 'pronunciation-' + start + '-' + end, kind, format, value: pronunciation };
  }

  if (position !== 'before' && position !== 'after') return null;
  const offset = position === 'before' ? start : end;
  if (run.wordRanges.some((range) => crossesPoint(range, offset))
    || run.dictionaryRanges.some((range) => crossesPoint(range, offset))) return null;

  let insertion: string | null = null;
  if (kind === 'pause') {
    const seconds = Number(value);
    if (/^\d{1,2}(?:\.\d{1,2})?$/u.test(value) && seconds >= MIN_PAUSE_SECONDS && seconds <= MAX_PAUSE_SECONDS
      && isInternalPause(text, run.markers, offset)
      && hasSpeechAround(text.slice(run.scope.start, run.scope.end), offset - run.scope.start)) {
      insertion = '<#' + formatPauseSeconds(seconds) + '#>';
    }
  } else if (kind === 'effect') {
    if (!PARALINGUISTIC_SUPPORTED_MODELS.includes(run.draft.model)
      || !AI_EFFECT_TAGS.some((tag) => tag === value)) return null;
    insertion = '(' + value + ')';
    if (text.slice(0, offset).trimEnd().endsWith(insertion) || text.slice(offset).trimStart().startsWith(insertion)) return null;
  } else if (kind === 'filler') {
    if (!run.input.allowFillers || !PLANNER_FILLERS.some((filler) => filler === value.toLowerCase())) return null;
    insertion = formatFiller(text, value, offset);
  } else {
    return null;
  }
  return insertion ? { ...base, id: 'insert-' + offset, kind, offset, value: insertion } : null;
}

function conflicts(text: string, a: PlannerSuggestion, b: PlannerSuggestion) {
  if (!('offset' in a)) return 'offset' in b ? crossesPoint(a, b.offset) : overlaps(a, b);
  if (!('offset' in b)) return crossesPoint(b, a.offset);

  const between = text.slice(Math.min(a.offset, b.offset), Math.max(a.offset, b.offset));
  return a.offset === b.offset
    || (PUNCTUATION_OR_SPACE.test(between) && (
      (a.kind === 'pause' && b.kind === 'pause') || (a.kind === b.kind && a.value === b.value)
    ));
}

export function validatePlannerSuggestions(run: PlannerRun, raw: unknown[]) {
  const suggestions: PlannerSuggestion[] = [];
  let length = run.draft.text.length;
  let fillers = 0;
  for (const item of raw.slice(0, MAX_PLANNER_SUGGESTIONS)) {
    const suggestion = normalizeSuggestion(run, item);
    if (!suggestion || suggestions.some((other) => conflicts(run.draft.text, suggestion, other))) continue;
    if (suggestion.kind === 'filler' && fillers >= MAX_FILLERS) continue;
    const edit = suggestion.kind === 'pronunciation' ? null : textEdit(suggestion);
    // Every visible suggestion can be selected independently of suggestions that shorten the draft.
    const lengthChange = edit ? Math.max(0, edit.value.length - (edit.end - edit.start)) : 0;
    if (length + lengthChange > MAX_TEXT_LENGTH) continue;
    const combined = [...suggestions, suggestion];
    if (!keepsPronunciationsUnique(run.draft, combined) || !keepsMarkers(run, combined)) continue;
    if (suggestions.length && (suggestion.kind === 'rewrite' || suggestion.kind === 'price')
      && (!keepsPronunciationsUnique(run.draft, [suggestion]) || !keepsMarkers(run, [suggestion]))) continue;

    if (suggestion.kind === 'filler') fillers++;
    length += lengthChange;
    suggestions.push(suggestion);
  }
  return { suggestions, rejected: raw.length - suggestions.length };
}

function textEdit(suggestion: Exclude<PlannerSuggestion, { kind: 'pronunciation' }>) {
  const { start, end, value } = suggestion;
  return 'offset' in suggestion ? { start: suggestion.offset, end: suggestion.offset, value } : { start, end, value };
}

function renderSuggestions(draft: PlannerDraft, suggestions: PlannerSuggestion[], rangeStart = 0): PlannerDraft {
  const pronunciationEntries = [...draft.pronunciationEntries];
  const edits: (Range & { value: string })[] = [];
  for (const suggestion of suggestions) {
    if (suggestion.kind === 'pronunciation') {
      pronunciationEntries.push({ original: suggestion.anchor, pronunciation: suggestion.value });
    } else {
      edits.push(textEdit(suggestion));
    }
  }
  let text = draft.text;
  for (const { start, end, value } of edits.sort((a, b) => b.start - a.start || b.end - a.end)) {
    text = text.slice(0, start - rangeStart) + value + text.slice(end - rangeStart);
  }
  return { ...draft, text, pronunciationEntries };
}

function keepsPronunciationsUnique(draft: PlannerDraft, suggestions: PlannerSuggestion[], renderedText?: string) {
  const pronunciations = suggestions.filter(({ kind }) => kind === 'pronunciation');
  const checkManual = draft.pronunciationEntries.length > 0 && suggestions.some(({ kind }) => kind === 'rewrite' || kind === 'price');
  if (!checkManual && (!pronunciations.length || pronunciations.length === suggestions.length)) return true;
  const text = renderedText ?? renderSuggestions(draft, suggestions).text;
  return pronunciations.every(({ anchor }) => findOccurrences(text, anchor).length === 1)
    && (!checkManual || draft.pronunciationEntries.every(({ original }) =>
      findOccurrences(text, original).length === findOccurrences(draft.text, original).length));
}

function keepsMarkers(run: PlannerRun, suggestions: PlannerSuggestion[], renderedText?: string) {
  if (!suggestions.some(({ kind }) => kind === 'rewrite' || kind === 'price')) return true;
  const text = renderedText ?? renderSuggestions(run.draft, suggestions).text;
  const expected = run.markers.map(({ start, end }) => run.draft.text.slice(start, end));
  expected.push(...suggestions.filter(({ kind }) => kind === 'pause' || kind === 'effect').map(({ value }) => value));
  const actual = findMarkers(text).map(({ start, end }) => text.slice(start, end));
  if (expected.length !== actual.length) return false;
  actual.sort();
  return expected.sort().every((marker, index) => marker === actual[index]);
}

export function applyPlannerSuggestions(run: PlannerRun, suggestions: PlannerSuggestion[]): PlannerDraft {
  const updated = renderSuggestions(run.draft, suggestions);
  if (updated.text.length > MAX_TEXT_LENGTH) throw new Error('应用后会超过配音字数限制。');
  if (!keepsPronunciationsUnique(run.draft, suggestions, updated.text)) {
    throw new Error('所选建议改变了发音规则的匹配范围，请取消冲突的建议。');
  }
  if (!keepsMarkers(run, suggestions, updated.text)) throw new Error('所选建议影响了合成标记，请取消冲突的建议。');
  return updated;
}

function filterPreviewDictionary(draft: PlannerDraft): PlannerDraft {
  return {
    ...draft,
    pronunciationEntries: draft.pronunciationEntries.filter(({ original }) => findOccurrences(draft.text, original).length > 0),
  };
}

export function previewPlannerSuggestion(run: PlannerRun, suggestion: PlannerSuggestion) {
  const text = run.draft.text;
  const protectedRanges = [...run.wordRanges, ...run.markers, ...run.dictionaryRanges];
  let start = moveToRangeEdge(suggestion.start - PREVIEW_CONTEXT, protectedRanges, 'start');
  let end = moveToRangeEdge(suggestion.end + PREVIEW_CONTEXT, protectedRanges, 'end');
  if (splitsSurrogate(text, start)) start--;
  if (splitsSurrogate(text, end)) end++;
  start = Math.max(run.scope.start, start);
  end = Math.min(run.scope.end, end);
  const before = { ...run.draft, text: text.slice(start, end) };
  if (suggestion.kind === 'pause' && !isInternalPause(before.text, findMarkers(before.text), suggestion.offset - start)) {
    throw new Error('这个停顿需要更长的上下文，请应用后用整稿合成试听。');
  }
  return {
    before: filterPreviewDictionary(before),
    after: filterPreviewDictionary(renderSuggestions(before, [suggestion], start)),
  };
}

export function samePlannerDraft(a: PlannerDraft, b: PlannerDraft) {
  return a.text === b.text && a.model === b.model && (
    a.pronunciationEntries === b.pronunciationEntries || (
      a.pronunciationEntries.length === b.pronunciationEntries.length
      && a.pronunciationEntries.every((entry, i) => entry.original === b.pronunciationEntries[i].original
        && entry.pronunciation === b.pronunciationEntries[i].pronunciation)
    )
  );
}
