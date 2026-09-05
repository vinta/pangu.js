import type { Candidate } from './messages';

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
  readonly kind: string; // joins this half to its PromptSpec
  occursIn(text: string): boolean; // the warm-up's page-level gate: a yes/no scan, cheaper than find()
  find(unspaced: string, settled: string): CandidateMatch[]; // tight-shape scan on the unspaced text, resolved only where the inserted gap is present
  isFix(label: string): boolean; // which label triggers the fix
  edits(settled: string, index: number): TextEdit[]; // what to change at one settled index
}

export interface PromptSpec<Label extends string> {
  readonly kind: string;
  readonly systemPrompt: string;
  // Logged with the base session, so a live page says which prompt produced its labels
  readonly version: string;
  buildQuestion(sentence: string, at: number): string;
  readonly displayTokenEnum: readonly string[];
  labelForDisplayToken(token: unknown): Label | null;
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
