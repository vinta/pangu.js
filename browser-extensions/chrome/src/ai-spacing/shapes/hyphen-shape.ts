import type { AmbiguousShape, CandidateMatch, SettledCandidate } from './base';
import { CJK, indexOfNthSymbol, sliceSentence } from './base';
import { HYPHEN_LABELS } from './hyphen-prompt';

// The hyphen-sign ambiguous shape: a hyphen-minus tight between a CJK character and a digit. Flagged on the unspaced text, because after spacing a rules-written `CJK - digit` is byte-identical
// to an author-typed one
const CJK_HYPHEN_DIGIT = new RegExp(`[${CJK}]-[0-9]`, 'g');

const DIGIT = /[0-9]/;

// The flagged original was tight, so a space between the hyphen and the digit can only be one the rules inserted. Anything else drops out here, so we never delete a byte we did not write
export function hasInsertedGap(text: string, hyphenIndex: number) {
  return text[hyphenIndex] === '-' && text[hyphenIndex + 1] === ' ' && DIGIT.test(text[hyphenIndex + 2] ?? '');
}

export const hyphenSign: AmbiguousShape = {
  kind: 'hyphen-sign',

  // search() ignores lastIndex, so the g regex is safe to reuse here; test() would advance it
  needsModel(text: string) {
    return text.search(CJK_HYPHEN_DIGIT) !== -1;
  },

  find(unspaced: string, settled: string) {
    const candidateMatches: CandidateMatch[] = [];
    for (const hyphenMatch of unspaced.matchAll(CJK_HYPHEN_DIGIT)) {
      // Every code point in the CJK class is a single UTF-16 unit, so the hyphen is one past the match
      const unspacedIndex = hyphenMatch.index + 1;
      // A missing ordinal answers -1 and fails hasInsertedGap()
      const index = indexOfNthSymbol(settled, '-', unspaced.slice(0, unspacedIndex).split('-').length - 1);
      if (hasInsertedGap(settled, index)) {
        candidateMatches.push({ ...sliceSentence(unspaced, unspacedIndex), index });
      }
    }
    return candidateMatches;
  },

  // Only the space after the hyphen goes. The space before it is a boundary the rules got right
  edits({ index }: SettledCandidate, candidateLabel) {
    return candidateLabel === HYPHEN_LABELS.signedNumber ? [{ index: index + 1, remove: 1, insert: '' }] : [];
  },
};
