import { PARAM_RANGES } from '../minimax/constants';
import { formatPauseSeconds, MAX_PAUSE_SECONDS, MIN_PAUSE_SECONDS } from '../text/pause';
import { PARALINGUISTIC_SUPPORTED_MODELS, PARALINGUISTIC_TAGS } from '../voices/paralinguistic';

export const PLANNER_STYLES = ['natural', 'short-video', 'story'] as const;
export const AI_EFFECT_TAGS = [
  'laughs', 'chuckle', 'coughs', 'clear-throat', 'groans', 'breath', 'pant', 'inhale',
  'exhale', 'gasps', 'sniffs', 'sighs', 'snorts', 'burps', 'lip-smacking', 'humming',
  'hissing', 'emm', 'sneezes',
] as const;
export const PLANNER_FILLERS = ['嗯', '啊', '呃', '哦', '欸', '哎', '呵', '唔', '诶', 'um', 'uh', 'oh', 'ah', 'hmm', 'well'] as const;
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

export type PlannerStyle = typeof PLANNER_STYLES[number];
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
  value: string;
  reason: string;
}
export type PlannerSuggestion = SuggestionBase & (
  | { kind: 'pause' | 'effect' | 'filler'; offset: number }
  | { kind: 'pronunciation'; format: 'pinyin' | 'ipa' | 'alias' }
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

function normalizeSuggestion(run: PlannerRun, raw: unknown): PlannerSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const { segmentId, anchor, position, kind, format, value, reason } = raw as Record<string, unknown>;
  if (typeof anchor !== 'string' || anchor.length > 120 || !SPEAKABLE.test(anchor)
    || typeof reason !== 'string' || !reason.trim() || reason.length > 240
    || typeof value !== 'string' || !value.trim() || value.length > 100) return null;

  const segment = run.segments.find(({ id }) => id === segmentId);
  if (!segment) return null;
  const localStart = segment.text.indexOf(anchor);
  if (localStart < 0 || segment.text.indexOf(anchor, localStart + 1) !== -1) return null;
  const start = segment.start + localStart;
  const end = start + anchor.length;
  if (run.markers.some((marker) => overlaps(marker, { start, end }))
    || splitsSurrogate(run.draft.text, start) || splitsSurrogate(run.draft.text, end)) return null;

  const base = { id: '', segmentId: segment.id, start, end, anchor, reason: reason.trim() };
  const text = run.draft.text;
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
  if (a.kind === 'pronunciation' && b.kind === 'pronunciation') return overlaps(a, b);
  if (a.kind === 'pronunciation' && b.kind !== 'pronunciation') return crossesPoint(a, b.offset);
  if (a.kind !== 'pronunciation' && b.kind === 'pronunciation') return crossesPoint(b, a.offset);
  if (a.kind === 'pronunciation' || b.kind === 'pronunciation') return false;

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
    if (suggestion.kind !== 'pronunciation' && length + suggestion.value.length > MAX_TEXT_LENGTH) continue;
    if (!keepsPronunciationsUnique(run.draft, [...suggestions, suggestion])) continue;

    if (suggestion.kind === 'filler') fillers++;
    if (suggestion.kind !== 'pronunciation') length += suggestion.value.length;
    suggestions.push(suggestion);
  }
  return { suggestions, rejected: raw.length - suggestions.length };
}

function renderSuggestions(draft: PlannerDraft, suggestions: PlannerSuggestion[], rangeStart = 0): PlannerDraft {
  const pronunciationEntries = [...draft.pronunciationEntries];
  const insertions: (PlannerSuggestion & { offset: number })[] = [];
  for (const suggestion of suggestions) {
    if (suggestion.kind === 'pronunciation') {
      pronunciationEntries.push({ original: suggestion.anchor, pronunciation: suggestion.value });
    } else {
      insertions.push(suggestion);
    }
  }
  let text = draft.text;
  for (const { offset, value } of insertions.sort((a, b) => b.offset - a.offset)) {
    const index = offset - rangeStart;
    text = text.slice(0, index) + value + text.slice(index);
  }
  return { ...draft, text, pronunciationEntries };
}

function keepsPronunciationsUnique(draft: PlannerDraft, suggestions: PlannerSuggestion[], renderedText?: string) {
  const pronunciations = suggestions.filter(({ kind }) => kind === 'pronunciation');
  if (!pronunciations.length || pronunciations.length === suggestions.length) return true;
  const text = renderedText ?? renderSuggestions(draft, suggestions).text;
  return pronunciations.every(({ anchor }) => findOccurrences(text, anchor).length === 1);
}

export function applyPlannerSuggestions(run: PlannerRun, suggestions: PlannerSuggestion[]): PlannerDraft {
  const updated = renderSuggestions(run.draft, suggestions);
  if (updated.text.length > MAX_TEXT_LENGTH) throw new Error('应用后会超过配音字数限制。');
  if (!keepsPronunciationsUnique(run.draft, suggestions, updated.text)) {
    throw new Error('所选建议会让发音规则匹配多个位置，请取消冲突的插入或发音建议。');
  }
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
