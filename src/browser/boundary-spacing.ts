import { ANY_CJK, pangu } from '../shared/index.js';

const QUOTE = /["\u201c\u201d]/;

// Where the space goes at the boundary between two adjacent text nodes
export type BoundarySpacingVerdict = 'none' | 'prepend-next' | 'append-current' | 'insert-element';

// What a single text node needs before its boundaries are considered
export type TextNodeSpacingVerdict = 'trim-leading-space' | 'prepend-space' | 'apply-text-spacing';

export interface BoundarySpacingContext {
  // Up to three trailing characters of the current text node, not just the last
  // one: rules like AN_COLON_CJK only fire with the characters before the
  // junction in view
  currentTail: string;
  nextFirst: string;
  currentEndsWithSpace: boolean;
  nextStartsWithSpace: boolean;
  whitespaceBetween: boolean;
  // Collectable text sits between the nodes, so they are not adjacent and no
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
}

export interface TextNodeSpacingContext {
  text: string;
  previousElementLastChar: string | null;
  // Reads computed styles, so it is supplied lazily and only consulted when
  // the text node starts with a space
  hiddenBoundaryBefore: () => boolean;
}

export function decideBoundarySpacing(boundarySpacingContext: BoundarySpacingContext) {
  if (boundarySpacingContext.spaceLikeSiblingAfterCurrent) {
    return 'none';
  }

  if (boundarySpacingContext.currentEndsWithSpace || boundarySpacingContext.nextStartsWithSpace || boundarySpacingContext.whitespaceBetween) {
    return 'none';
  }

  if (boundarySpacingContext.contentBetween) {
    return 'none';
  }

  if (!needsBoundarySpace(boundarySpacingContext.currentTail, boundarySpacingContext.nextFirst)) {
    return 'none';
  }

  if (boundarySpacingContext.spaceLikeSiblingAfterCurrentBoundary || boundarySpacingContext.currentBoundaryIsBlock) {
    return 'none';
  }

  if (!boundarySpacingContext.nextBoundaryIsSpaceSensitive) {
    if (
      boundarySpacingContext.nextBoundaryIsIgnored ||
      boundarySpacingContext.nextBoundaryIsBlock ||
      boundarySpacingContext.spaceLikeSiblingBeforeNext ||
      boundarySpacingContext.hiddenBoundaryBefore()
    ) {
      return 'none';
    }
    return 'prepend-next';
  }

  if (!boundarySpacingContext.currentBoundaryIsSpaceSensitive) {
    if (boundarySpacingContext.hiddenBoundaryAfter()) {
      return 'none';
    }
    return 'append-current';
  }

  if (boundarySpacingContext.spaceLikeSiblingBeforeNextBoundary || boundarySpacingContext.hiddenBoundaryAfter()) {
    return 'none';
  }

  // Skip <pangu> element insertion in Grid/Flexbox containers
  // because the element becomes a layout item and breaks the layout
  if (boundarySpacingContext.inGridOrFlexContainer()) {
    return 'none';
  }

  return 'insert-element';
}

export function decideTextNodeSpacing(textNodeSpacingContext: TextNodeSpacingContext) {
  const textNodeSpacingVerdicts: TextNodeSpacingVerdict[] = [];

  // The standalone quote rule reads the text left by the trim rule
  let { text } = textNodeSpacingContext;
  if (text.startsWith(' ') && textNodeSpacingContext.hiddenBoundaryBefore()) {
    textNodeSpacingVerdicts.push('trim-leading-space');
    text = text.substring(1);
  }

  if (isStandaloneQuote(text)) {
    if (textNodeSpacingContext.previousElementLastChar !== null && ANY_CJK.test(textNodeSpacingContext.previousElementLastChar)) {
      textNodeSpacingVerdicts.push('prepend-space');
    }
  } else {
    textNodeSpacingVerdicts.push('apply-text-spacing');
  }

  return textNodeSpacingVerdicts;
}

// spaceJunction is pure and a page repeats the same few junction windows at
// every boundary, so the spaced junctions are memoized. The cap only guards
// pathological pages with unbounded unique windows
const spacedJunctionCache = new Map<string, string>();
const SPACED_JUNCTION_CACHE_MAX = 4096;

function spaceJunction(currentTail: string, nextFirst: string) {
  const junction = `${currentTail}${nextFirst}`;
  const cached = spacedJunctionCache.get(junction);
  if (cached !== undefined) {
    return cached;
  }

  const spacedJunction = pangu.spacingText(junction);

  if (spacedJunctionCache.size >= SPACED_JUNCTION_CACHE_MAX) {
    spacedJunctionCache.clear();
  }
  spacedJunctionCache.set(junction, spacedJunction);
  return spacedJunction;
}

function needsBoundarySpace(currentTail: string, nextFirst: string) {
  // Only a space right at the junction counts: a space that spacingText puts
  // anywhere else belongs inside the tail, not at the boundary
  return spaceJunction(currentTail, nextFirst).endsWith(` ${nextFirst}`) && !isQuoteNextToCjk(currentTail.slice(-1), nextFirst);
}

// The junction reading can put a second space inside the tail itself, not only at the junction: CJK/ + CJK reads CJK / CJK, because the slash rule needs both sides of the slash in view while each
// node alone shows it only one. The boundary verdict places the junction space; this returns the tail with its interior spaces written in, or null when the tail already reads right. Only meaningful
// when the boundary verdict is a spacing action: 'none' means the nodes are separated or the junction reading does not apply, so the tail must stay untouched
export function respaceCurrentTail(currentTail: string, nextFirst: string) {
  const spacedJunction = spaceJunction(currentTail, nextFirst);
  if (!spacedJunction.endsWith(` ${nextFirst}`)) {
    return null;
  }
  const spacedTail = spacedJunction.slice(0, -2);
  return spacedTail === currentTail ? null : spacedTail;
}

function isQuoteNextToCjk(currentLast: string, nextFirst: string) {
  return (QUOTE.test(currentLast) && ANY_CJK.test(nextFirst)) || (ANY_CJK.test(currentLast) && QUOTE.test(nextFirst));
}

function isStandaloneQuote(text: string) {
  return text.length === 1 && QUOTE.test(text);
}
