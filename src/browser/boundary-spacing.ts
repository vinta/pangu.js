import { ANY_CJK, pangu } from '../shared';

const QUOTE = /["\u201c\u201d]/;

// Where the space goes at the boundary between two adjacent text runs
export type BoundarySpacingVerdict = 'none' | 'prepend-next' | 'append-current' | 'insert-element' | 'insert-nbsp-text';

// What a single text run needs before its boundaries are considered
export type TextRunSpacingVerdict = 'trim-leading-space' | 'prepend-space' | 'apply-text-spacing';

export interface BoundarySpacingContext {
  // Up to three trailing characters of the current text run, not just the last
  // one: rules like AN_COLON_CJK only fire with the characters before the
  // junction in view
  currentTail: string;
  nextFirst: string;
  currentEndsWithSpace: boolean;
  nextStartsWithSpace: boolean;
  whitespaceBetween: boolean;
  // Collectable text sits between the runs, so they are not adjacent and no
  // boundary exists (e.g. an unqueued sibling between two separately mutated
  // nodes). Content the engine never collects (ignored tags like <code>) does
  // not count, so spacing across those islands is preserved
  contentBetween: boolean;
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
  // The boundary nodes are siblings rendered flush on one line by a row flex
  // parent, so only a non-collapsible U+00A0 between them can show a space.
  // Reads computed styles and forces layout, so it is consulted last
  flexRowFlushBoundary: () => boolean;
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

  if (context.contentBetween) {
    return 'none';
  }

  if (!needsBoundarySpace(context.currentTail, context.nextFirst)) {
    return 'none';
  }

  if (context.spaceLikeSiblingAfterCurrentBoundary) {
    return 'none';
  }

  // Block boundaries normally stack vertically and take no boundary space, but
  // a row flex parent can lay them out flush on one line, where the space can
  // only come from a non-collapsible U+00A0 text node between the items. The
  // flush check verifies flex-ness itself, so the hot prepend/append paths
  // below never pay a computed-style read
  if (context.currentBoundaryIsBlock || context.nextBoundaryIsBlock) {
    if (context.nextBoundaryIsIgnored || context.spaceLikeSiblingBeforeNext || context.spaceLikeSiblingBeforeNextBoundary) {
      return 'none';
    }
    return context.flexRowFlushBoundary() ? 'insert-nbsp-text' : 'none';
  }

  if (!context.nextBoundaryIsSpaceSensitive) {
    if (context.nextBoundaryIsIgnored || context.spaceLikeSiblingBeforeNext || context.hiddenBoundaryBefore()) {
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

  // Skip <pangu> element insertion in Grid/Flexbox containers because the
  // element becomes a layout item and breaks the layout. A flush flex row can
  // carry a U+00A0 text node instead, which no CSS selector can observe
  if (context.inGridOrFlexContainer()) {
    return context.flexRowFlushBoundary() ? 'insert-nbsp-text' : 'none';
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

// needsBoundarySpace is pure and a page repeats the same few junction windows
// at every boundary, so verdicts are memoized. The cap only guards pathological
// pages with unbounded unique windows
const junctionVerdictCache = new Map<string, boolean>();
const JUNCTION_VERDICT_CACHE_MAX = 4096;

function needsBoundarySpace(currentTail: string, nextFirst: string) {
  const junction = `${currentTail}${nextFirst}`;
  const cached = junctionVerdictCache.get(junction);
  if (cached !== undefined) {
    return cached;
  }

  // Only a space right at the junction counts: a space that spacingText puts
  // anywhere else belongs inside the tail, not at the boundary
  const verdict = pangu.spacingText(junction).endsWith(` ${nextFirst}`) && !isQuoteNextToCjk(currentTail.slice(-1), nextFirst);

  if (junctionVerdictCache.size >= JUNCTION_VERDICT_CACHE_MAX) {
    junctionVerdictCache.clear();
  }
  junctionVerdictCache.set(junction, verdict);
  return verdict;
}

function isQuoteNextToCjk(currentLast: string, nextFirst: string) {
  return (QUOTE.test(currentLast) && ANY_CJK.test(nextFirst)) || (ANY_CJK.test(currentLast) && QUOTE.test(nextFirst));
}

function isStandaloneQuote(text: string) {
  return text.length === 1 && QUOTE.test(text);
}
