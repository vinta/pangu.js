import type { Candidate } from './messages';

// One change at one settled index: `remove` characters at `index` become `insert`. Never a composed string, because a text node can carry edits from more than one ambiguous shape and only the
// content script sees all of them
export interface TextEdit {
  readonly index: number;
  readonly remove: number;
  readonly insert: string;
}

// One occurrence of an ambiguous shape as the pre-spacing text describes it. `ordinal` says which occurrence of that symbol in that text this is, and is the bridge to the settled post-spacing index:
// spacing writes only ever add or move spaces, never symbols, so the nth occurrence stays the nth one
export interface CandidateMatch {
  readonly sentence: string;
  readonly at: number;
  readonly ordinal: number;
}

// A match resolved against settled data and bound to the text node it came from. `sentence`/`at` are the pre-spacing bytes the classifier reads; `index`/`settled` are the settled bytes an edit is
// allowed to touch
export interface SettledCandidate extends Candidate {
  readonly kind: string;
  readonly node: Text;
  readonly index: number;
  readonly settled: string;
}

export interface AmbiguousShape {
  readonly kind: string; // joins this half to its PromptSpec, and discriminates CLASSIFY_CANDIDATES
  occursIn(text: string): boolean; // whether the tight shape occurs anywhere in text: the warm-up's page-level gate, a yes/no scan without find's per-hit work
  find(unspaced: string): CandidateMatch[]; // tight-shape scan on pre-spacing bytes, with sentence slice and ordinal
  settle(settled: string, candidateMatch: CandidateMatch): number | null; // the symbol's settled index when the inserted gap is present, else null
  isFix(label: string): boolean; // which label triggers the fix
  edits(settled: string, index: number): TextEdit[]; // what to change at one settled index, never a composed string
}

export interface PromptSpec<Label extends string> {
  readonly kind: string;
  readonly systemPrompt: string;
  // The id of the measured prompt bytes, logged with the base session so a live page says which prompt produced its labels
  readonly version: string;
  buildQuestion(sentence: string, at: number): string;
  readonly displayTokenEnum: readonly string[];
  labelForDisplayToken(token: unknown): Label | null;
}

// Every edit one text node collected, from every ambiguous shape, composed into the bytes a single late fix writes. Descending index order is what keeps an earlier edit from shifting a later one's
// index, and one text node must reach core as one fix because a second fix on the same text node would fail its own compare-and-set check and silently drop
export function applyTextEdits(settled: string, textEdits: readonly TextEdit[]) {
  let data = settled;
  for (const textEdit of [...textEdits].sort((left, right) => right.index - left.index)) {
    data = data.slice(0, textEdit.index) + textEdit.insert + data.slice(textEdit.index + textEdit.remove);
  }
  return data;
}
