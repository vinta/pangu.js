// AI spacing's shared vocabulary. Core owns the mechanism -- it hands over every text node a batch spaced, and it lands whatever fixes come back -- and this extension owns every per-shape fact:
// what to flag, what to ask, which label triggers a fix, and what that fix changes.
//
// An ambiguous shape is two halves living in two runtime contexts: an `AmbiguousShape` in the content script and a `PromptSpec` in the service worker, joined by nothing but `kind` and a label type.
// They stay in separate modules because the two bundles are separate and object-literal properties do not tree-shake, so one merged object would ship prompt bytes to the page and finder regexes to
// the worker. The interfaces can share this file because types erase.

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

// A match resolved against settled data and bound to the text node it came from. `sentence`/`at` are the pre-spacing bytes the classifier reads; `index`/`after` are the settled bytes an edit is
// allowed to touch
export interface Candidate {
  readonly kind: string;
  readonly node: Text;
  readonly sentence: string;
  readonly at: number;
  readonly index: number;
  readonly after: string;
}

// Page side, content script
export interface AmbiguousShape {
  readonly kind: string; // joins this half to its PromptSpec, and discriminates CLASSIFY_CANDIDATES
  find(before: string): CandidateMatch[]; // tight-shape scan on pre-spacing bytes, with sentence slice and ordinal
  settle(after: string, match: CandidateMatch): number | null; // the symbol's settled index when the inserted gap is present, else null
  isFix(label: string): boolean; // which label triggers the fix
  edits(after: string, index: number): TextEdit[]; // what to change at one settled index, never a composed string
}

// Worker side, service worker. One per kind, registered in prompt-classifier.ts
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
export function applyTextEdits(after: string, edits: readonly TextEdit[]) {
  let data = after;
  for (const edit of [...edits].sort((left, right) => right.index - left.index)) {
    data = data.slice(0, edit.index) + edit.insert + data.slice(edit.index + edit.remove);
  }
  return data;
}
