import type { AmbiguousShape, CandidateMatch } from './ambiguous-shape';

// A copy of CJK in src/shared/index.ts, pinned by a vitest case. The content script is a classic script, so it can neither import the ESM build nor read CJK off the UMD global
export const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

// The hyphen-sign ambiguous shape: a hyphen-minus tight between a CJK character and a digit. Flagged on the unspaced text, because after spacing a rules-written `CJK - digit` is byte-identical
// to an author-typed one
const CJK_HYPHEN_DIGIT = new RegExp(`[${CJK}]-[0-9]`, 'g');

const DIGIT = /[0-9]/;

// Where a sentence slice is cut: ideographic full stop, fullwidth full stop, fullwidth exclamation mark, fullwidth question mark, fullwidth semicolon, and newline
const SENTENCE_TERMINATOR = /[\u3002\uff0e\uff01\uff1f\uff1b\n]/;

// How far a slice reaches on each side of the hyphen when no terminator turns up first
const MAX_SENTENCE_SIDE = 120;

// The sentence the hyphen sits in, cut at the nearest terminator on each side or at MAX_SENTENCE_SIDE. Terminators are excluded, so a slice reads like the bare sentences in the measured corpus
// The character before the hyphen is CJK, never a terminator, so it is always inside the slice
export function sliceSentence(text: string, at: number) {
  const leftLimit = Math.max(0, at - MAX_SENTENCE_SIDE);
  let start = leftLimit;
  for (let index = at - 1; index >= leftLimit; index--) {
    if (SENTENCE_TERMINATOR.test(text[index]!)) {
      start = index + 1;
      break;
    }
  }

  const rightLimit = Math.min(text.length, at + 1 + MAX_SENTENCE_SIDE);
  let end = rightLimit;
  for (let index = at + 1; index < rightLimit; index++) {
    if (SENTENCE_TERMINATOR.test(text[index]!)) {
      end = index;
      break;
    }
  }

  return { sentence: text.slice(start, end), at: at - start };
}

export function indexOfNthHyphen(text: string, ordinal: number) {
  let seen = 0;
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '-') {
      if (seen === ordinal) {
        return index;
      }
      seen++;
    }
  }
  return -1;
}

// The flagged original was tight, so a space between the hyphen and the digit can only be one the rules inserted. Anything else drops out here, so we never delete a byte we did not write
export function hasInsertedGap(text: string, hyphenIndex: number) {
  return text[hyphenIndex] === '-' && text[hyphenIndex + 1] === ' ' && DIGIT.test(text[hyphenIndex + 2] ?? '');
}

export const hyphenSign: AmbiguousShape = {
  kind: 'hyphen-sign',

  // search() ignores lastIndex, so the g regex is safe to reuse here; test() would advance it
  occursIn(text: string) {
    return text.search(CJK_HYPHEN_DIGIT) !== -1;
  },

  find(unspaced: string, settled: string) {
    const matches: CandidateMatch[] = [];
    for (const match of unspaced.matchAll(CJK_HYPHEN_DIGIT)) {
      // Every code point in the CJK class is a single UTF-16 unit, so the hyphen is one past the match
      const hyphenIndex = match.index + 1;
      // Spacing never changes hyphens, so their ordinal survives. A missing ordinal answers -1 and fails hasInsertedGap()
      const index = indexOfNthHyphen(settled, unspaced.slice(0, hyphenIndex).split('-').length - 1);
      if (hasInsertedGap(settled, index)) {
        matches.push({ ...sliceSentence(unspaced, hyphenIndex), index });
      }
    }
    return matches;
  },

  isFix(label: string) {
    return label === 'signed-number';
  },

  // Only the space after the hyphen goes. The space before it is a boundary the rules got right
  edits(_settled: string, index: number) {
    return [{ index: index + 1, remove: 1, insert: '' }];
  },
};
