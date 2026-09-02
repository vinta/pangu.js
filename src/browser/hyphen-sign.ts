import { CJK } from '../shared/index.js';

// The only shape the hyphen-sign model layer looks at: a hyphen-minus sitting tight between a CJK character and a digit. Flagging the tight form on pre-spacing text is what makes a later un-insert
// safe, because once the rules have run a pangu-written `CJK - digit` is byte-identical to the same string typed by an author, and only the tight original identifies who wrote the space
const CJK_HYPHEN_DIGIT = new RegExp(`[${CJK}]-[0-9]`, 'g');

const DIGIT = /[0-9]/;

// Where a sentence slice is cut: ideographic full stop, fullwidth full stop, fullwidth exclamation mark, fullwidth question mark, fullwidth semicolon, and newline
const SENTENCE_TERMINATOR = /[\u3002\uff0e\uff01\uff1f\uff1b\n]/;

// How far a slice reaches on each side of the hyphen when no terminator turns up first
const MAX_SENTENCE_SIDE = 120;

// One flagged hyphen as the pre-spacing text describes it. `ordinal` says which hyphen-minus of that text this is, and is the bridge to the settled post-spacing index: spacing writes only ever add or
// move spaces, never hyphens, so the nth hyphen-minus stays the nth one
export interface HyphenSpanMatch {
  readonly sentence: string;
  readonly at: number;
  readonly ordinal: number;
}

// A match bound to the node it came from, held until the batch settles
export interface PendingHyphenSpan extends HyphenSpanMatch {
  readonly node: Text;
}

// A flagged hyphen resolved against settled data. `sentence`/`at` are the pre-spacing bytes the classifier reads; `postIndex`/`postSnapshot` are the bytes the applier is allowed to touch
export interface HyphenSignCandidate {
  readonly sentence: string;
  readonly at: number;
  readonly node: Text;
  readonly postIndex: number;
  readonly postSnapshot: string;
}

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

export function findHyphenSpans(text: string) {
  const matches: HyphenSpanMatch[] = [];
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
