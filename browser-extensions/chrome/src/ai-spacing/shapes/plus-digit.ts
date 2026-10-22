import { CJK, CJK_SIGN_DIGIT } from 'pangu/shared';
import type { AmbiguousShape, CandidateMatch } from './base';
import { indexOfNthSymbol, sliceSentence } from './base';
import { PLUS_DIGIT_LABELS } from './plus-digit-prompt';

const SETTLED_CJK_PLUS_DIGIT = new RegExp(`^[${CJK}] \\+[0-9]$`);

export const plusDigit: AmbiguousShape = {
  kind: 'plus-digit',

  hasPotentialCandidates(text: string) {
    return text.search(CJK_SIGN_DIGIT) !== -1;
  },

  find(unspaced: string, settled: string, sentenceAt = (at: number) => sliceSentence(unspaced, at)) {
    const candidateMatches: CandidateMatch[] = [];
    for (const plusMatch of unspaced.matchAll(CJK_SIGN_DIGIT)) {
      const unspacedIndex = plusMatch.index + plusMatch[1]!.length;
      const index = indexOfNthSymbol(settled, '+', unspaced.slice(0, unspacedIndex).split('+').length - 1);
      if (index === -1 || !SETTLED_CJK_PLUS_DIGIT.test(settled.slice(index - 2, index + 2))) {
        continue;
      }
      const candidate = sentenceAt(unspacedIndex);
      // The frozen prompt requires one plus in the full model context, including inline siblings
      if (candidate.sentence.split('+').length === 2) {
        candidateMatches.push({ ...candidate, index });
      }
    }
    return candidateMatches;
  },

  edits({ index }, candidateLabel) {
    return candidateLabel === PLUS_DIGIT_LABELS.conjunction ? [{ index: index + 1, remove: 0, insert: ' ' }] : [];
  },
};
