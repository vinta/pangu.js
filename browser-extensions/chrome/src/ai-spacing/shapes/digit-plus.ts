import { CJK, DIGIT_PLUS_CJK } from 'pangu/shared';
import type { AmbiguousShape } from './base';
import { findSinglePlusCandidateMatches, sliceSentence } from './base';
import { DIGIT_PLUS_LABELS } from './digit-plus-prompt';

const SETTLED_DIGIT_PLUS_CJK = new RegExp(`^[0-9]\\+ [${CJK}]$`);

export const digitPlus: AmbiguousShape = {
  kind: 'digit-plus',

  hasPotentialCandidates(text: string) {
    return text.search(DIGIT_PLUS_CJK) !== -1;
  },

  find(unspaced: string, settled: string, sentenceAt = (at: number) => sliceSentence(unspaced, at)) {
    return findSinglePlusCandidateMatches(unspaced, settled, sentenceAt, DIGIT_PLUS_CJK, (index) => SETTLED_DIGIT_PLUS_CJK.test(settled.slice(index - 1, index + 3)));
  },

  edits({ index }, candidateLabel) {
    return candidateLabel === DIGIT_PLUS_LABELS.conjunction ? [{ index, remove: 0, insert: ' ' }] : [];
  },
};
