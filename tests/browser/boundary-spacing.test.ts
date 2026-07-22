import type { BoundarySpacingContext, BoundarySpacingVerdict, TextRunSpacingContext, TextRunSpacingVerdict } from '../../src/browser/boundary-spacing';
import { decideBoundarySpacing, decideTextRunSpacing } from '../../src/browser/boundary-spacing';
import { describe, it, expect } from 'vitest';

// A boundary that the spacing engine wants a space at, with every veto turned off
const spacingBoundary: BoundarySpacingContext = {
  currentTail: '中',
  nextFirst: 'a',
  nextHead: 'a',
  currentEndsWithSpace: false,
  nextStartsWithSpace: false,
  whitespaceBetween: false,
  nbspBetween: false,
  contentBetween: false,
  spaceLikeSiblingAfterCurrent: false,
  spaceLikeSiblingAfterCurrentBoundary: false,
  spaceLikeSiblingBeforeNext: false,
  spaceLikeSiblingBeforeNextBoundary: false,
  currentBoundaryIsBlock: false,
  currentBoundaryIsSpaceSensitive: false,
  nextBoundaryIsBlock: false,
  nextBoundaryIsIgnored: false,
  nextBoundaryIsSpaceSensitive: false,
  hiddenBoundaryBefore: () => false,
  hiddenBoundaryAfter: () => false,
  inGridOrFlexContainer: () => false,
  flexRowFlushBoundary: () => false,
  inlineBlockFlushBoundary: () => false,
};

// A layout-dependent fact that the verdict must not need on this path
function neverConsulted(name: string): () => boolean {
  return () => {
    throw new Error(`${name} must not be consulted`);
  };
}

// The next boundary is space-sensitive, so the space goes onto the current text run
const appendCurrentBoundary: Partial<BoundarySpacingContext> = { nextBoundaryIsSpaceSensitive: true };

// Neither text run may be modified, so the space needs a <pangu> element
const insertElementBoundary: Partial<BoundarySpacingContext> = { nextBoundaryIsSpaceSensitive: true, currentBoundaryIsSpaceSensitive: true };

const textRun: TextRunSpacingContext = {
  text: '中文abc',
  previousElementLastChar: null,
  hiddenBoundaryBefore: () => false,
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
    { name: 'does nothing when collectable text sits between the runs', context: { contentBetween: true }, verdict: 'none' },
    { name: 'does nothing when collectable text sits between space-sensitive runs', context: { ...insertElementBoundary, contentBetween: true }, verdict: 'none' },
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
    { name: 'CJK then half-width', context: { currentTail: '中', nextFirst: 'a' }, verdict: 'prepend-next' },
    { name: 'half-width then CJK', context: { currentTail: 'a', nextFirst: '中' }, verdict: 'prepend-next' },
    { name: 'kana then half-width', context: { currentTail: 'の', nextFirst: 'a' }, verdict: 'prepend-next' },
    { name: 'CJK then CJK', context: { currentTail: '中', nextFirst: '文' }, verdict: 'none' },
    { name: 'half-width then half-width', context: { currentTail: 'a', nextFirst: 'b' }, verdict: 'none' },
    // Hangul is outside the CJK class of shared, so the probe reports no spacing
    { name: 'hangul then half-width', context: { currentTail: '한', nextFirst: 'a' }, verdict: 'none' },
    // AN_COLON_CJK needs the alphanumeric character before the colon, so the
    // verdict flips with the tail context
    { name: 'colon with alphanumeric context then CJK', context: { currentTail: 'g:', nextFirst: '低' }, verdict: 'prepend-next' },
    { name: 'colon without context then CJK', context: { currentTail: ':', nextFirst: '低' }, verdict: 'none' },
    // The probe spaces inside the tail here (中 g), never at the junction
    { name: 'a space that belongs inside the tail', context: { currentTail: '中g', nextFirst: 'x' }, verdict: 'none' },
    // The junction alone has no CJK, but nextHead reaches the 十 inside the
    // brackets, so AN_LEFT_BRACKET gets its context (the Google Calendar case)
    { name: 'a CJK just past the junction window', context: { currentTail: 'g 1', nextFirst: '(', nextHead: '(十九)' }, verdict: 'prepend-next' },
    { name: 'no CJK anywhere near the junction', context: { currentTail: 'g 1', nextFirst: '(', nextHead: '(999' }, verdict: 'none' },
  ];

  it.each(probeCases)('probes the spacing engine with $name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const quoteCases: BoundaryCase[] = [
    { name: 'a straight quote before CJK', context: { currentTail: '"', nextFirst: '中' }, verdict: 'none' },
    { name: 'CJK before a straight quote', context: { currentTail: '中', nextFirst: '"' }, verdict: 'none' },
    { name: 'a curly quote before CJK', context: { currentTail: '“', nextFirst: '中' }, verdict: 'none' },
    { name: 'CJK before a curly quote', context: { currentTail: '中', nextFirst: '”' }, verdict: 'none' },
    { name: 'kana before a straight quote', context: { currentTail: 'の', nextFirst: '"' }, verdict: 'none' },
    { name: 'a straight quote before kana', context: { currentTail: '"', nextFirst: 'の' }, verdict: 'none' },
    // The veto reads the last character of the tail, not the whole tail
    { name: 'a quote at the tail end before CJK', context: { currentTail: '文"', nextFirst: '中' }, verdict: 'none' },
  ];

  it.each(quoteCases)('skips spacing for $name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const visibilityCases: BoundaryCase[] = [
    { name: 'a hidden boundary before vetoes prepend-next', context: { hiddenBoundaryBefore: () => true }, verdict: 'none' },
    { name: 'a hidden boundary after vetoes append-current', context: { ...appendCurrentBoundary, hiddenBoundaryAfter: () => true }, verdict: 'none' },
    { name: 'a hidden boundary after vetoes insert-element', context: { ...insertElementBoundary, hiddenBoundaryAfter: () => true }, verdict: 'none' },
    { name: 'a hidden boundary after leaves prepend-next alone', context: { hiddenBoundaryAfter: () => true }, verdict: 'prepend-next' },
    { name: 'a hidden boundary before leaves append-current alone', context: { ...appendCurrentBoundary, hiddenBoundaryBefore: () => true }, verdict: 'append-current' },
    { name: 'a hidden boundary before leaves insert-element alone', context: { ...insertElementBoundary, hiddenBoundaryBefore: () => true }, verdict: 'insert-element' },
  ];

  it.each(visibilityCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  const insertElementCases: BoundaryCase[] = [
    { name: 'a Grid/Flexbox container downgrades insert-element', context: { ...insertElementBoundary, inGridOrFlexContainer: () => true }, verdict: 'none' },
    { name: 'a space-like sibling before the next boundary downgrades insert-element', context: { ...insertElementBoundary, spaceLikeSiblingBeforeNextBoundary: true }, verdict: 'none' },
    { name: 'a Grid/Flexbox container leaves prepend-next alone', context: { inGridOrFlexContainer: () => true }, verdict: 'prepend-next' },
    { name: 'a Grid/Flexbox container leaves append-current alone', context: { ...appendCurrentBoundary, inGridOrFlexContainer: () => true }, verdict: 'append-current' },
    { name: 'a space-like sibling before the next boundary leaves prepend-next alone', context: { spaceLikeSiblingBeforeNextBoundary: true }, verdict: 'prepend-next' },
  ];

  it.each(insertElementCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  // Block or blockified boundaries collapse any written U+0020, so a flush row
  // flex parent upgrades them to a U+00A0 text node between the items
  const flushFlexRowCases: BoundaryCase[] = [
    { name: 'a flush flex row upgrades a current block boundary to insert-nbsp-text', context: { currentBoundaryIsBlock: true, flexRowFlushBoundary: () => true }, verdict: 'insert-nbsp-text' },
    { name: 'a flush flex row upgrades a next block boundary to insert-nbsp-text', context: { nextBoundaryIsBlock: true, flexRowFlushBoundary: () => true }, verdict: 'insert-nbsp-text' },
    { name: 'a flush flex row upgrades insert-element to insert-nbsp-text', context: { ...insertElementBoundary, inGridOrFlexContainer: () => true, flexRowFlushBoundary: () => true }, verdict: 'insert-nbsp-text' },
    { name: 'a block boundary without a flush flex row still does nothing', context: { nextBoundaryIsBlock: true, flexRowFlushBoundary: () => false }, verdict: 'none' },
    { name: 'a space-like sibling before the next run vetoes before the flush check runs', context: { currentBoundaryIsBlock: true, spaceLikeSiblingBeforeNext: true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary') }, verdict: 'none' },
    { name: 'a space-like sibling before the next boundary vetoes before the flush check runs', context: { nextBoundaryIsBlock: true, spaceLikeSiblingBeforeNextBoundary: true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary') }, verdict: 'none' },
    { name: 'an ignored next boundary vetoes before the flush check runs', context: { currentBoundaryIsBlock: true, nextBoundaryIsIgnored: true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary') }, verdict: 'none' },
  ];

  it.each(flushFlexRowCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  // Collapsible spaces at flush block boundaries render as nothing, so they
  // must not settle the boundary; a U+00A0 between the runs always does
  const collapsedSpaceCases: BoundaryCase[] = [
    { name: 'a leading space in the next run does not veto a flush flex row', context: { nextStartsWithSpace: true, nextBoundaryIsBlock: true, flexRowFlushBoundary: () => true }, verdict: 'insert-nbsp-text' },
    { name: 'a trailing space in the current run does not veto a flush flex row', context: { currentEndsWithSpace: true, currentBoundaryIsBlock: true, flexRowFlushBoundary: () => true }, verdict: 'insert-nbsp-text' },
    { name: 'whitespace between block runs does not veto a flush flex row', context: { whitespaceBetween: true, currentBoundaryIsBlock: true, flexRowFlushBoundary: () => true }, verdict: 'insert-nbsp-text' },
    { name: 'whitespace between block runs settles the boundary outside flex', context: { whitespaceBetween: true, currentBoundaryIsBlock: true, inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary') }, verdict: 'none' },
    { name: 'a U+00A0 between the runs settles the boundary without any flush check', context: { whitespaceBetween: true, nbspBetween: true, currentBoundaryIsBlock: true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'), inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary') }, verdict: 'none' },
    { name: 'an existing space settles non-block boundaries without any flush check', context: { nextStartsWithSpace: true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'), inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary') }, verdict: 'none' },
  ];

  it.each(collapsedSpaceCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });

  // Inline-blocks flush on one shared line take the pangu element, whose
  // U+0020 renders in normal flow
  const flushInlineBlockCases: BoundaryCase[] = [
    { name: 'flush inline-blocks at a block boundary get a pangu element', context: { currentBoundaryIsBlock: true, inlineBlockFlushBoundary: () => true }, verdict: 'insert-element' },
    { name: 'a leading space does not veto flush inline-blocks', context: { nextStartsWithSpace: true, nextBoundaryIsBlock: true, inlineBlockFlushBoundary: () => true }, verdict: 'insert-element' },
    { name: 'a hidden boundary before vetoes the flush block path', context: { currentBoundaryIsBlock: true, hiddenBoundaryBefore: () => true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'), inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary') }, verdict: 'none' },
    { name: 'a hidden boundary after vetoes the flush block path', context: { currentBoundaryIsBlock: true, hiddenBoundaryAfter: () => true, flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'), inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary') }, verdict: 'none' },
  ];

  it.each(flushInlineBlockCases)('$name', ({ context, verdict }) => {
    expect(decideBoundarySpacing(boundaryContext(context))).toBe(verdict);
  });
});

describe('decideTextRunSpacing()', () => {
  const trimCases: TextRunCase[] = [
    { name: 'trims a leading space that comes after a hidden element', context: { text: ' 中文abc', hiddenBoundaryBefore: () => true }, verdicts: ['trim-leading-space', 'apply-text-spacing'] },
    { name: 'keeps a leading space that comes after a visible element', context: { text: ' 中文abc', hiddenBoundaryBefore: () => false }, verdicts: ['apply-text-spacing'] },
    { name: 'has nothing to trim after a hidden element', context: { text: '中文abc', hiddenBoundaryBefore: () => true }, verdicts: ['apply-text-spacing'] },
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
    expect(decideTextRunSpacing(textRunContext({ text: ' "', previousElementLastChar: '中', hiddenBoundaryBefore: () => true }))).toEqual(['trim-leading-space', 'prepend-space']);
  });

  it('treats an untrimmed leading space as part of the text run', () => {
    expect(decideTextRunSpacing(textRunContext({ text: ' "', previousElementLastChar: '中', hiddenBoundaryBefore: () => false }))).toEqual(['apply-text-spacing']);
  });
});

describe('layout-dependent facts are consulted lazily', () => {
  const layoutFactsUnavailable: Partial<BoundarySpacingContext> = {
    hiddenBoundaryBefore: neverConsulted('hiddenBoundaryBefore'),
    hiddenBoundaryAfter: neverConsulted('hiddenBoundaryAfter'),
    inGridOrFlexContainer: neverConsulted('inGridOrFlexContainer'),
    flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'),
    inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary'),
  };

  it('consults no layout fact when the text runs are already spaced', () => {
    expect(decideBoundarySpacing(boundaryContext({ ...layoutFactsUnavailable, currentEndsWithSpace: true }))).toBe('none');
  });

  it('consults no layout fact when the probe reports no spacing', () => {
    expect(decideBoundarySpacing(boundaryContext({ ...layoutFactsUnavailable, currentTail: '中', nextFirst: '文' }))).toBe('none');
  });

  it('consults only hidden and flush facts when the current boundary is a block', () => {
    const context = boundaryContext({
      ...layoutFactsUnavailable,
      currentBoundaryIsBlock: true,
      hiddenBoundaryBefore: () => false,
      hiddenBoundaryAfter: () => false,
      flexRowFlushBoundary: () => false,
      inlineBlockFlushBoundary: () => false,
    });
    expect(decideBoundarySpacing(context)).toBe('none');
  });

  it('leaves hidden-after, grid/flex, and the flush facts unconsulted on the prepend-next path', () => {
    const context = boundaryContext({
      hiddenBoundaryAfter: neverConsulted('hiddenBoundaryAfter'),
      inGridOrFlexContainer: neverConsulted('inGridOrFlexContainer'),
      flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'),
      inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary'),
    });
    expect(decideBoundarySpacing(context)).toBe('prepend-next');
  });

  it('leaves hidden-before, grid/flex, and the flush facts unconsulted on the append-current path', () => {
    const context = boundaryContext({
      ...appendCurrentBoundary,
      hiddenBoundaryBefore: neverConsulted('hiddenBoundaryBefore'),
      inGridOrFlexContainer: neverConsulted('inGridOrFlexContainer'),
      flexRowFlushBoundary: neverConsulted('flexRowFlushBoundary'),
      inlineBlockFlushBoundary: neverConsulted('inlineBlockFlushBoundary'),
    });
    expect(decideBoundarySpacing(context)).toBe('append-current');
  });

  it('leaves the hidden boundary unconsulted for a text run with no leading space', () => {
    expect(decideTextRunSpacing(textRunContext({ hiddenBoundaryBefore: neverConsulted('hiddenBoundaryBefore') }))).toEqual(['apply-text-spacing']);
  });
});
