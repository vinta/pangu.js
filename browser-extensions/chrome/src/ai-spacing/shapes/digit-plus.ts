import { CJK, DIGIT_PLUS_CJK } from '../../../../../src/shared/index';
import type { AmbiguousShape, CandidateMatch } from './base';
import { indexOfNthSymbol, sliceSentence } from './base';
import { DIGIT_PLUS_LABELS } from './digit-plus-prompt';

const SETTLED_DIGIT_PLUS_CJK = new RegExp(`^[0-9]\\+ [${CJK}]$`);

export const digitPlus: AmbiguousShape = {
  kind: 'digit-plus',

  hasPotentialCandidates(text: string) {
    return text.search(DIGIT_PLUS_CJK) !== -1;
  },

  find(unspaced: string, settled: string, sentenceAt = (at: number) => sliceSentence(unspaced, at)) {
    const candidateMatches: CandidateMatch[] = [];
    for (const plusMatch of unspaced.matchAll(DIGIT_PLUS_CJK)) {
      const unspacedIndex = plusMatch.index + plusMatch[1]!.length;
      const index = indexOfNthSymbol(settled, '+', unspaced.slice(0, unspacedIndex).split('+').length - 1);
      if (index === -1 || !SETTLED_DIGIT_PLUS_CJK.test(settled.slice(index - 1, index + 3))) {
        continue;
      }
      const candidate = sentenceAt(unspacedIndex);
      // The frozen prompt targets the first plus. Count the full model context, including inline siblings.
      if (candidate.sentence.split('+').length === 2) {
        candidateMatches.push({ ...candidate, index });
      }
    }
    return candidateMatches;
  },

  edits({ index }, candidateLabel) {
    return candidateLabel === DIGIT_PLUS_LABELS.conjunction ? [{ index, remove: 0, insert: ' ' }] : [];
  },
};
