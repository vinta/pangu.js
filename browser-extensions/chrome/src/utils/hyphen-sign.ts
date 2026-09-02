import type { AmbiguousShape, CandidateMatch } from './ai-spacing';

// The extension's own copy of the CJK character class, pinned to `CJK` in src/shared/index.ts by a vitest case so drift fails CI. Three reasons it is a copy rather than an import: the content script
// loads pangu.umd.js as a separate classic script and the UMD global does not expose CJK; a content script cannot be an ES module, so it cannot import the ESM build at runtime; and bundling
// src/shared into the content script would risk a second copy of the engine beside the UMD one, because that module ends with `export const pangu = new Pangu()`
export const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

// The hyphen-sign ambiguous shape, the only one AI spacing reads today: a hyphen-minus sitting tight between a CJK character and a digit. Flagging the tight form on pre-spacing text is what makes a later un-insert
// safe, because once the rules have run a pangu-written `CJK - digit` is byte-identical to the same string typed by an author, and only the tight original identifies who wrote the space
const CJK_HYPHEN_DIGIT = new RegExp(`[${CJK}]-[0-9]`, 'g');

const DIGIT = /[0-9]/;

// Where a sentence slice is cut: ideographic full stop, fullwidth full stop, fullwidth exclamation mark, fullwidth question mark, fullwidth semicolon, and newline
const SENTENCE_TERMINATOR = /[\u3002\uff0e\uff01\uff1f\uff1b\n]/;

// How far a slice reaches on each side of the hyphen when no terminator turns up first
const MAX_SENTENCE_SIDE = 120;

// The window the classifier is asked about: the sentence the hyphen sits in, cut at the nearest terminator on each side, or at the cap when the text runs on. Exclusive of the terminators themselves,
// so a slice reads as the bare sentence the measured corpus is made of. The character before the hyphen is CJK and therefore never a terminator, so it is always inside the slice
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

export function findHyphenMatches(text: string) {
  const matches: CandidateMatch[] = [];
  for (const match of text.matchAll(CJK_HYPHEN_DIGIT)) {
    // Every code point in the CJK class is a single UTF-16 unit, so the hyphen is one past the match
    const hyphenIndex = match.index + 1;
    matches.push({ ...sliceSentence(text, hyphenIndex), ordinal: text.slice(0, hyphenIndex).split('-').length - 1 });
  }
  return matches;
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

// Self-verifying provenance: the flagged original was tight, so a space between the hyphen and the digit can only be one the rules inserted. Author-spaced originals and boundaries the rules declined
// to space both fail this check and drop out, which is what keeps the applier from ever deleting a byte pangu did not write
export function hasInsertedGap(text: string, hyphenIndex: number) {
  return text[hyphenIndex] === '-' && text[hyphenIndex + 1] === ' ' && DIGIT.test(text[hyphenIndex + 2] ?? '');
}

export const hyphenSign: AmbiguousShape = {
  kind: 'hyphen-sign',

  find(before: string) {
    return findHyphenMatches(before);
  },

  // A missing ordinal answers -1, which fails the inserted-gap check like any other index that is not a hyphen, so an unsettled match needs no guard of its own
  settle(after: string, match: CandidateMatch) {
    const index = indexOfNthHyphen(after, match.ordinal);
    return hasInsertedGap(after, index) ? index : null;
  },

  isFix(label: string) {
    return label === 'signed-number';
  },

  // Only the space the rules inserted between the hyphen and the digit goes; the space before the hyphen is the boundary the rules were right about, and it stays
  edits(_after: string, index: number) {
    return [{ index: index + 1, remove: 1, insert: '' }];
  },
};
