import { ANY_CJK, pangu } from '../shared';

const QUOTE = /["\u201c\u201d]/;

// Where the space goes at the boundary between two adjacent text runs
export type BoundarySpacingVerdict = 'none' | 'prepend-next' | 'append-current' | 'insert-element';

// What a single text run needs before its boundaries are considered
export type TextRunSpacingVerdict = 'trim-leading-space' | 'prepend-space' | 'apply-text-spacing';

export interface BoundarySpacingContext {
  currentLast: string;
  nextFirst: string;
  currentEndsWithSpace: boolean;
  nextStartsWithSpace: boolean;
  whitespaceBetween: boolean;
  spaceLikeSiblingAfterCurrent: boolean;
  spaceLikeSiblingAfterCurrentBoundary: boolean;
  spaceLikeSiblingBeforeNext: boolean;
  spaceLikeSiblingBeforeNextBoundary: boolean;
  currentBoundaryIsBlock: boolean;
  currentBoundaryIsSpaceSensitive: boolean;
  nextBoundaryIsBlock: boolean;
  nextBoundaryIsIgnored: boolean;
  nextBoundaryIsSpaceSensitive: boolean;
  // These facts read computed styles, so they are supplied lazily and only
  // consulted for boundaries that survive the cheap checks
  hiddenBoundaryBefore: () => boolean;
  hiddenBoundaryAfter: () => boolean;
  inGridOrFlexContainer: () => boolean;
}

export interface TextRunSpacingContext {
  text: string;
  previousElementLastChar: string | null;
  // Reads computed styles, so it is supplied lazily and only consulted when
  // the text run starts with a space
  hiddenBoundaryBefore: () => boolean;
}

export function decideBoundarySpacing(context: BoundarySpacingContext) {
  if (context.spaceLikeSiblingAfterCurrent) {
    return 'none';
  }

  if (context.currentEndsWithSpace || context.nextStartsWithSpace || context.whitespaceBetween) {
    return 'none';
  }

  if (!needsBoundarySpace(context.currentLast, context.nextFirst)) {
    return 'none';
  }

  if (context.spaceLikeSiblingAfterCurrentBoundary || context.currentBoundaryIsBlock) {
    return 'none';
  }

  if (!context.nextBoundaryIsSpaceSensitive) {
    if (context.nextBoundaryIsIgnored || context.nextBoundaryIsBlock || context.spaceLikeSiblingBeforeNext || context.hiddenBoundaryBefore()) {
      return 'none';
    }
    return 'prepend-next';
  }

  if (!context.currentBoundaryIsSpaceSensitive) {
    if (context.hiddenBoundaryAfter()) {
      return 'none';
    }
    return 'append-current';
  }

  if (context.spaceLikeSiblingBeforeNextBoundary || context.hiddenBoundaryAfter()) {
    return 'none';
  }

  // Skip <pangu> element insertion in Grid/Flexbox containers
  // because the element becomes a layout item and breaks the layout
  if (context.inGridOrFlexContainer()) {
    return 'none';
  }

  return 'insert-element';
}

export function decideTextRunSpacing(context: TextRunSpacingContext) {
  const verdicts: TextRunSpacingVerdict[] = [];

  // The standalone quote rule reads the text left by the trim rule
  let { text } = context;
  if (text.startsWith(' ') && context.hiddenBoundaryBefore()) {
    verdicts.push('trim-leading-space');
    text = text.substring(1);
  }

  if (isStandaloneQuote(text)) {
    if (context.previousElementLastChar !== null && ANY_CJK.test(context.previousElementLastChar)) {
      verdicts.push('prepend-space');
    }
  } else {
    verdicts.push('apply-text-spacing');
  }

  return verdicts;
}

function needsBoundarySpace(currentLast: string, nextFirst: string) {
  const pair = `${currentLast}${nextFirst}`;
  if (pangu.spacingText(pair) === pair) {
    return false;
  }

  return !isQuoteNextToCjk(currentLast, nextFirst);
}

function isQuoteNextToCjk(currentLast: string, nextFirst: string) {
  return (QUOTE.test(currentLast) && ANY_CJK.test(nextFirst)) || (ANY_CJK.test(currentLast) && QUOTE.test(nextFirst));
}

function isStandaloneQuote(text: string) {
  return text.length === 1 && QUOTE.test(text);
}
