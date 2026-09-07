import type { Candidate, CandidateLabel } from '../messages';

// One change at one settled index: `remove` characters at `index` become `insert`. Edits stay separate because a text node can carry edits from more than one ambiguous shape
export interface TextEdit {
  readonly index: number;
  readonly remove: number;
  readonly insert: string;
}

// The classifier reads the unspaced sentence; edits use the symbol's resolved index in the settled text
export interface CandidateMatch extends Candidate {
  readonly index: number;
}

// A match resolved against the settled text and bound to its text node. `sentence`/`at` are what the classifier reads; `index`/`settled` are what an edit may touch
export interface SettledCandidate extends CandidateMatch {
  readonly node: Text;
  readonly settled: string;
}

export interface AmbiguousShape {
  readonly kind: string; // model shapes join to their PromptSpec through this identifier
  needsModel?(text: string): boolean; // present for model shapes; the text scan decides whether to warm up. Absent when find() resolves the match without a model
  find(unspaced: string, settled: string): CandidateMatch[]; // tight-shape scan on the unspaced text, resolved only where the inserted gap is present
  // Model shapes must return [] for null or rejected labels. Shapes without needsModel can ignore the label
  edits(settledCandidate: SettledCandidate, candidateLabel: CandidateLabel | null): TextEdit[];
}

// A copy of CJK in src/shared/index.ts, pinned by a vitest case. The content script is a classic script, so it can neither import the ESM build nor read CJK off the UMD global
export const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

// Where a sentence slice is cut: ideographic full stop, fullwidth full stop, fullwidth exclamation mark, fullwidth question mark, fullwidth semicolon, and newline
const SENTENCE_TERMINATOR = /[\u3002\uff0e\uff01\uff1f\uff1b\n]/;

// How far a slice reaches on each side of the symbol when no terminator turns up first
const MAX_SENTENCE_SIDE = 120;

// The sentence the symbol sits in, cut at the nearest terminator on each side or at MAX_SENTENCE_SIDE. Terminators are excluded, so a slice reads like the bare sentences in the measured corpus
// The character before the symbol is CJK, never a terminator, so it is always inside the slice
export function sliceSentence(text: string, at: number) {
  const before = text
    .slice(Math.max(0, at - MAX_SENTENCE_SIDE), at)
    .split(SENTENCE_TERMINATOR)
    .at(-1)!;
  const after = text.slice(at + 1, at + 1 + MAX_SENTENCE_SIDE).split(SENTENCE_TERMINATOR, 1)[0]!;
  return { sentence: before + text[at] + after, at: before.length };
}

// Spacing never adds or removes a symbol, so its ordinal in the unspaced text finds it again in the settled text. A missing ordinal answers -1
export function indexOfNthSymbol(text: string, symbol: string, ordinal: number) {
  let index = -1;
  for (let seen = 0; seen <= ordinal; seen++) {
    index = text.indexOf(symbol, index + 1);
    if (index === -1) {
      return -1;
    }
  }
  return index;
}

export interface PromptSpec<Label extends string> {
  readonly kind: string;
  readonly systemPrompt: string;
  readonly version: string;
  readonly candidateLabels: readonly Label[];
  buildQuestion(sentence: string, at: number): string;
}

// Composes every edit one text node collected into one late fix, since a second fix on the same node would fail core's compare-and-set check. Descending index order keeps an earlier edit
// from shifting a later one
export function applyTextEdits(settled: string, textEdits: readonly TextEdit[]) {
  let data = settled;
  for (const textEdit of [...textEdits].sort((left, right) => right.index - left.index)) {
    data = data.slice(0, textEdit.index) + textEdit.insert + data.slice(textEdit.index + textEdit.remove);
  }
  return data;
}
