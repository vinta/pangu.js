import type { BoundarySpacingContext, BoundarySpacingVerdict, TextRunSpacingContext, TextRunSpacingVerdict } from '../../src/browser/boundary-spacing';
import { decideBoundarySpacing, decideTextRunSpacing } from '../../src/browser/boundary-spacing';
import { describe, it, expect } from 'vitest';

// A boundary that the spacing engine wants a space at, with every veto turned off
const spacingBoundary: BoundarySpacingContext = {
  currentLast: '中',
  nextFirst: 'a',
  currentEndsWithSpace: false,
  nextStartsWithSpace: false,
  whitespaceBetween: false,
  spaceLikeSiblingAfterCurrent: false,
  spaceLikeSiblingAfterCurrentBoundary: false,
  spaceLikeSiblingBeforeNext: false,
  spaceLikeSiblingBeforeNextBoundary: false,
  currentBoundaryIsBlock: false,
  currentBoundaryIsSpaceSensitive: false,
  nextBoundaryIsBlock: false,
  nextBoundaryIsIgnored: false,
  nextBoundaryIsSpaceSensitive: false,
  hiddenBoundaryBefore: false,
  hiddenBoundaryAfter: false,
  inGridOrFlexContainer: false,
};

// The next boundary is space-sensitive, so the space goes onto the current text run
const appendCurrentBoundary: Partial<BoundarySpacingContext> = { nextBoundaryIsSpaceSensitive: true };

// Neither text run may be modified, so the space needs a <pangu> element
const insertElementBoundary: Partial<BoundarySpacingContext> = { nextBoundaryIsSpaceSensitive: true, currentBoundaryIsSpaceSensitive: true };

const textRun: TextRunSpacingContext = {
  text: '中文abc',
  previousElementLastChar: null,
  hiddenBoundaryBefore: false,
};

interface BoundaryCase {
  name: string;
  context: Partial<BoundarySpacingContext>;
  verdict: BoundarySpacingVerdict;
}

interface TextRunCase {
  name: string;
  context: Partial<TextRunSpacingContext>;
  verdicts: TextRunSpacingVerdict[];
}

function boundaryContext(overrides: Partial<BoundarySpacingContext>) {
  return { ...spacingBoundary, ...overrides };
}

function textRunContext(overrides: Partial<TextRunSpacingContext>) {
  return { ...textRun, ...overrides };
}

describe('decideBoundarySpacing()', () => {
  const verdictCases: BoundaryCase[] = [
    { name: 'prepends to the next text run when neither boundary is space-sensitive', context: {}, verdict: 'prepend-next' },
    { name: 'appends to the current text run when only the next boundary is space-sensitive', context: appendCurrentBoundary, verdict: 'append-current' },
    { name: 'inserts an element when both boundaries are space-sensitive', context: insertElementBoundary, verdict: 'insert-element' },
    { name: 'does nothing when the current boundary is a block', context: { currentBoundaryIsBlock: true }, verdict: 'none' },
    { name: 'does nothing when the next boundary is ignored', context: { nextBoundaryIsIgnored: true }, verdict: 'none' },
    { name: 'does nothing when the next boundary is a block', context: { nextBoundaryIsBlock: true }, verdict: 'none' },
  ];

  it.each(verdictCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const existingSpaceCases: BoundaryCase[] = [
    { name: 'the current text run already ends with a space', context: { currentEndsWithSpace: true }, verdict: 'none' },
    { name: 'the next text run already starts with a space', context: { nextStartsWithSpace: true }, verdict: 'none' },
    { name: 'whitespace sits between the two text runs', context: { whitespaceBetween: true }, verdict: 'none' },
    { name: 'a space-like sibling follows the current text run', context: { spaceLikeSiblingAfterCurrent: true }, verdict: 'none' },
    { name: 'a space-like sibling follows the current boundary', context: { spaceLikeSiblingAfterCurrentBoundary: true }, verdict: 'none' },
    { name: 'a space-like sibling precedes the next text run', context: { spaceLikeSiblingBeforeNext: true }, verdict: 'none' },
  ];

  it.each(existingSpaceCases)('does nothing when $name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const probeCases: BoundaryCase[] = [
    { name: 'CJK then half-width', context: { currentLast: '中', nextFirst: 'a' }, verdict: 'prepend-next' },
    { name: 'half-width then CJK', context: { currentLast: 'a', nextFirst: '中' }, verdict: 'prepend-next' },
    { name: 'kana then half-width', context: { currentLast: 'の', nextFirst: 'a' }, verdict: 'prepend-next' },
    { name: 'CJK then CJK', context: { currentLast: '中', nextFirst: '文' }, verdict: 'none' },
    { name: 'half-width then half-width', context: { currentLast: 'a', nextFirst: 'b' }, verdict: 'none' },
    // Hangul is outside the CJK class of shared, so the probe reports no spacing
    { name: 'hangul then half-width', context: { currentLast: '한', nextFirst: 'a' }, verdict: 'none' },
  ];

  it.each(probeCases)('probes the spacing engine with $name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const quoteCases: BoundaryCase[] = [
    { name: 'a straight quote before CJK', context: { currentLast: '"', nextFirst: '中' }, verdict: 'none' },
    { name: 'CJK before a straight quote', context: { currentLast: '中', nextFirst: '"' }, verdict: 'none' },
    { name: 'a curly quote before CJK', context: { currentLast: '“', nextFirst: '中' }, verdict: 'none' },
    { name: 'CJK before a curly quote', context: { currentLast: '中', nextFirst: '”' }, verdict: 'none' },
    { name: 'kana before a straight quote', context: { currentLast: 'の', nextFirst: '"' }, verdict: 'none' },
    { name: 'a straight quote before kana', context: { currentLast: '"', nextFirst: 'の' }, verdict: 'none' },
  ];

  it.each(quoteCases)('skips spacing for $name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const visibilityCases: BoundaryCase[] = [
    { name: 'a hidden boundary before vetoes prepend-next', context: { hiddenBoundaryBefore: true }, verdict: 'none' },
    { name: 'a hidden boundary after vetoes append-current', context: { ...appendCurrentBoundary, hiddenBoundaryAfter: true }, verdict: 'none' },
    { name: 'a hidden boundary after vetoes insert-element', context: { ...insertElementBoundary, hiddenBoundaryAfter: true }, verdict: 'none' },
    { name: 'a hidden boundary after leaves prepend-next alone', context: { hiddenBoundaryAfter: true }, verdict: 'prepend-next' },
    { name: 'a hidden boundary before leaves append-current alone', context: { ...appendCurrentBoundary, hiddenBoundaryBefore: true }, verdict: 'append-current' },
    { name: 'a hidden boundary before leaves insert-element alone', context: { ...insertElementBoundary, hiddenBoundaryBefore: true }, verdict: 'insert-element' },
  ];

  it.each(visibilityCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const insertElementCases: BoundaryCase[] = [
    { name: 'a Grid/Flexbox container downgrades insert-element', context: { ...insertElementBoundary, inGridOrFlexContainer: true }, verdict: 'none' },
    { name: 'a space-like sibling before the next boundary downgrades insert-element', context: { ...insertElementBoundary, spaceLikeSiblingBeforeNextBoundary: true }, verdict: 'none' },
    { name: 'a Grid/Flexbox container leaves prepend-next alone', context: { inGridOrFlexContainer: true }, verdict: 'prepend-next' },
    { name: 'a Grid/Flexbox container leaves append-current alone', context: { ...appendCurrentBoundary, inGridOrFlexContainer: true }, verdict: 'append-current' },
    { name: 'a space-like sibling before the next boundary leaves prepend-next alone', context: { spaceLikeSiblingBeforeNextBoundary: true }, verdict: 'prepend-next' },
  ];

  it.each(insertElementCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });
});

describe('decideTextRunSpacing()', () => {
  const trimCases: TextRunCase[] = [
    { name: 'trims a leading space that comes after a hidden element', context: { text: ' 中文abc', hiddenBoundaryBefore: true }, verdicts: ['trim-leading-space', 'apply-text-spacing'] },
    { name: 'keeps a leading space that comes after a visible element', context: { text: ' 中文abc', hiddenBoundaryBefore: false }, verdicts: ['apply-text-spacing'] },
    { name: 'has nothing to trim after a hidden element', context: { text: '中文abc', hiddenBoundaryBefore: true }, verdicts: ['apply-text-spacing'] },
  ];

  it.each(trimCases)('$name', ({ context, verdicts }) => {
    expect(decideTextRunSpacing(textRunContext(context))).toEqual(verdicts);
  });

  const standaloneQuoteCases: TextRunCase[] = [
    { name: 'a straight quote after CJK', context: { text: '"', previousElementLastChar: '中' }, verdicts: ['prepend-space'] },
    { name: 'a left curly quote after CJK', context: { text: '“', previousElementLastChar: '中' }, verdicts: ['prepend-space'] },
    { name: 'a right curly quote after CJK', context: { text: '”', previousElementLastChar: '中' }, verdicts: ['prepend-space'] },
    { name: 'a straight quote after kana', context: { text: '"', previousElementLastChar: 'の' }, verdicts: ['prepend-space'] },
  ];

  it.each(standaloneQuoteCases)('prepends a space to $name', ({ context, verdicts }) => {
    expect(decideTextRunSpacing(textRunContext(context))).toEqual(verdicts);
  });

  const quoteSkipCases: TextRunCase[] = [
    { name: 'the previous element ends with half-width', context: { text: '"', previousElementLastChar: 'a' }, verdicts: [] },
    { name: 'there is no previous element', context: { text: '"', previousElementLastChar: null }, verdicts: [] },
  ];

  it.each(quoteSkipCases)('leaves a standalone quote alone when $name', ({ context, verdicts }) => {
    expect(decideTextRunSpacing(textRunContext(context))).toEqual(verdicts);
  });

  const textSpacingCases: TextRunCase[] = [
    { name: 'more than one character', context: { text: '""', previousElementLastChar: '中' }, verdicts: ['apply-text-spacing'] },
    { name: 'a single character that is not a quote', context: { text: 'a', previousElementLastChar: '中' }, verdicts: ['apply-text-spacing'] },
  ];

  it.each(textSpacingCases)('applies text spacing to a text run of $name', ({ context, verdicts }) => {
    expect(decideTextRunSpacing(textRunContext(context))).toEqual(verdicts);
  });

  it('trims a leading space before deciding that the rest is a standalone quote', () => {
    expect(decideTextRunSpacing(textRunContext({ text: ' "', previousElementLastChar: '中', hiddenBoundaryBefore: true }))).toEqual(['trim-leading-space', 'prepend-space']);
  });

  it('treats an untrimmed leading space as part of the text run', () => {
    expect(decideTextRunSpacing(textRunContext({ text: ' "', previousElementLastChar: '中', hiddenBoundaryBefore: false }))).toEqual(['apply-text-spacing']);
  });
});
