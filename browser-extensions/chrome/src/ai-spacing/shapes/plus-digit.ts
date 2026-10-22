import { CJK, CJK_SIGN_DIGIT } from 'pangu/shared';
import type { AmbiguousShape } from './base';
import { findSinglePlusCandidateMatches, sliceSentence } from './base';
import { PLUS_DIGIT_LABELS } from './plus-digit-prompt';

const SETTLED_CJK_PLUS_DIGIT = new RegExp(`^[${CJK}] \\+[0-9]$`);

export const plusDigit: AmbiguousShape = {
  kind: 'plus-digit',

  hasPotentialCandidates(text: string) {
    return text.search(CJK_SIGN_DIGIT) !== -1;
  },

  find(unspaced: string, settled: string, sentenceAt = (at: number) => sliceSentence(unspaced, at)) {
    return findSinglePlusCandidateMatches(unspaced, settled, sentenceAt, CJK_SIGN_DIGIT, (index) => SETTLED_CJK_PLUS_DIGIT.test(settled.slice(index - 2, index + 2)));
  },

  edits({ index }, candidateLabel) {
    return candidateLabel === PLUS_DIGIT_LABELS.conjunction ? [{ index: index + 1, remove: 0, insert: ' ' }] : [];
  },
};
