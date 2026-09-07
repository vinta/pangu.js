import type { AmbiguousShape, CandidateMatch, SettledCandidate } from './base';
import { indexOfNthSymbol } from './base';

// The brand names whose plus is part of the name. The rules read `CJK+` as an operator (ADR 0013) and, on a bundle-plan line, `A+` as a separator (ADR 0019); this list restores the suffix
// reading in the extension (ADR 0018). A Latin entry needs a left boundary so a longer word never matches; a CJK entry keeps none, since `MOD影劇館+` must match
const NAME_SUFFIX = /(?:(?<![A-Za-z0-9])(?:Disney|Apple TV|iCloud|CATCHPLAY|Paramount|[Dd]iscovery|ESPN)|公視|影劇館)\+/g;

// After a brand suffix, a slash, a closing bracket or quote, or pause and end punctuation follows tight; a word or an opening bracket keeps the boundary space
const CLOSING_AFTER_PLUS = /[/)\]}\uff09\u3011\u3015\u3009\u300b\u300d\u300f\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f]/;

export const nameSuffix: AmbiguousShape = {
  kind: 'name-suffix',

  find(unspaced: string, settled: string) {
    const candidateMatches: CandidateMatch[] = [];
    for (const nameMatch of unspaced.matchAll(NAME_SUFFIX)) {
      const unspacedIndex = nameMatch.index + nameMatch[0].length - 1;
      const index = indexOfNthSymbol(settled, '+', unspaced.slice(0, unspacedIndex).split('+').length - 1);
      // The brand was tight against the plus, so a space between them can only be one the rules inserted
      if (index !== -1 && settled[index - 1] === ' ') {
        // The sentence is the brand, its plus, and the one character after it, which edits() reads to decide the second gap
        candidateMatches.push({ sentence: unspaced.slice(nameMatch.index, unspacedIndex + 2), at: unspacedIndex - nameMatch.index, index });
      }
    }
    return candidateMatches;
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
