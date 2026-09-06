import type { AmbiguousShape, CandidateMatch, SettledCandidate } from './base';
import { indexOfNthSymbol } from './base';

export const BRAND_SUFFIX_LABEL = 'brand-suffix';

export type BrandSuffixLabel = typeof BRAND_SUFFIX_LABEL;

// The CJK brand names whose plus is part of the name. The rules read `CJK+` as an operator (ADR 0013); this list restores the suffix reading in the extension (ADR 0018)
const BRAND_SUFFIX = /(?:公視|影劇館)\+/g;

// After a brand suffix, a slash, a closing bracket or quote, or pause and end punctuation follows tight; a word or an opening bracket keeps the boundary space
const CLOSING_AFTER_PLUS = /[/)\]}\uff09\u3011\u3015\u3009\u300b\u300d\u300f\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f]/;

export const brandSuffix: AmbiguousShape = {
  kind: 'brand-suffix',

  find(unspaced: string, settled: string) {
    const candidateMatches: CandidateMatch[] = [];
    for (const brandMatch of unspaced.matchAll(BRAND_SUFFIX)) {
      const unspacedIndex = brandMatch.index + brandMatch[0].length - 1;
      const index = indexOfNthSymbol(settled, '+', unspaced.slice(0, unspacedIndex).split('+').length - 1);
      // The brand was tight against the plus, so a space between them can only be one the rules inserted
      if (index !== -1 && settled[index - 1] === ' ') {
        // The sentence is the brand, its plus, and the one character after it, which edits() reads to decide the second gap
        candidateMatches.push({ sentence: unspaced.slice(brandMatch.index, unspacedIndex + 2), at: unspacedIndex - brandMatch.index, index });
      }
    }
    return candidateMatches;
  },

  // Every candidate is a listed brand, so the label is decided on the page and never sent to the worker
  classify(candidates) {
    return candidates.map(() => BRAND_SUFFIX_LABEL);
  },

  isFix(candidateLabel: string) {
    return candidateLabel === BRAND_SUFFIX_LABEL;
  },

  // The space before the plus always goes. The space after it goes only when the author's next character closes the phrase; before a word or an opening bracket it is a boundary the rules got right
  edits({ sentence, at, settled, index }: SettledCandidate) {
    const textEdits = [{ index: index - 1, remove: 1, insert: '' }];
    const after = sentence[at + 1];
    if (after !== undefined && CLOSING_AFTER_PLUS.test(after) && settled[index + 1] === ' ') {
      textEdits.push({ index: index + 1, remove: 1, insert: '' });
    }
    return textEdits;
  },
};
