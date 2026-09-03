import { describe, expect, it } from 'vitest';
import { applyTextEdits, type AmbiguousShape, type TextEdit } from '../../browser-extensions/chrome/src/utils/ai-spacing';
import { CJK, findHyphenMatches, hasInsertedGap, hyphenSign, indexOfNthHyphen, sliceSentence } from '../../browser-extensions/chrome/src/utils/hyphen-sign';
import { CJK as SHARED_CJK } from '../../src/shared/index';

describe('sliceSentence()', () => {
  it('keep a text with no terminator whole', () => {
    const text = '氣溫是-5度左右';
    expect(sliceSentence(text, 3)).toEqual({ sentence: text, at: 3 });
  });

  it('cut at the terminator before the hyphen, exclusive', () => {
    const text = '今天很冷。氣溫是-5度左右';
    expect(sliceSentence(text, 8)).toEqual({ sentence: '氣溫是-5度左右', at: 3 });
  });

  it('cut at the terminator after the hyphen, exclusive', () => {
    const text = '氣溫是-5度左右。記得帶外套';
    expect(sliceSentence(text, 3)).toEqual({ sentence: '氣溫是-5度左右', at: 3 });
  });

  it('cut at a newline on either side', () => {
    const text = '前一行\n氣溫是-5度左右\n後一行';
    expect(sliceSentence(text, 7)).toEqual({ sentence: '氣溫是-5度左右', at: 3 });
  });

  it('cut at every terminator in the set', () => {
    for (const terminator of ['。', '．', '！', '？', '；']) {
      const text = `前句${terminator}氣溫是-5度左右${terminator}後句`;
      expect(sliceSentence(text, 6)).toEqual({ sentence: '氣溫是-5度左右', at: 3 });
    }
  });

  it('cap the slice at 120 characters per side when the text runs on', () => {
    const text = `${'中'.repeat(200)}-5${'文'.repeat(200)}`;
    const { sentence, at } = sliceSentence(text, 200);

    expect(at).toBe(120);
    expect(sentence).toHaveLength(241);
    expect(sentence.charAt(at)).toBe('-');
  });

  it('always keep the CJK character before the hyphen', () => {
    const text = '。是-5';
    expect(sliceSentence(text, 2)).toEqual({ sentence: '是-5', at: 1 });
  });
});

describe('findHyphenMatches()', () => {
  it('flag a tight CJK-digit hyphen', () => {
    expect(findHyphenMatches('氣溫是-5度左右')).toEqual([{ sentence: '氣溫是-5度左右', at: 3, ordinal: 0 }]);
  });

  it('count earlier hyphens that were never flagged into the ordinal', () => {
    // The Nasdaq-100 hyphen is ordinal 0 and reads A-digit, so only the second hyphen is flagged
    expect(findHyphenMatches('Nasdaq-100本週下跌-13.44%')).toEqual([{ sentence: 'Nasdaq-100本週下跌-13.44%', at: 14, ordinal: 1 }]);
  });

  it('flag every hyphen in one text node', () => {
    expect(findHyphenMatches('從-5到-3度')).toEqual([
      { sentence: '從-5到-3度', at: 1, ordinal: 0 },
      { sentence: '從-5到-3度', at: 4, ordinal: 1 },
    ]);
  });

  it('slice each hyphen into its own sentence', () => {
    expect(findHyphenMatches('溫度是-5度。濕度是-3度')).toEqual([
      { sentence: '溫度是-5度', at: 3, ordinal: 0 },
      { sentence: '濕度是-3度', at: 3, ordinal: 1 },
    ]);
  });

  it('ignore shapes outside the tight CJK-digit form', () => {
    // Half-width left side, non-digit right side, and an already-spaced original are all out of scope
    expect(findHyphenMatches('abc-5')).toEqual([]);
    expect(findHyphenMatches('中文-abc')).toEqual([]);
    expect(findHyphenMatches('氣溫是 -5度')).toEqual([]);
    expect(findHyphenMatches('氣溫是- 5度')).toEqual([]);
  });
});

describe('indexOfNthHyphen()', () => {
  it('find the nth hyphen-minus', () => {
    expect(indexOfNthHyphen('Nasdaq-100 本週下跌 - 13.44%', 1)).toBe(16);
    expect(indexOfNthHyphen('Nasdaq-100 本週下跌 - 13.44%', 0)).toBe(6);
  });

  it('report a missing ordinal rather than guessing', () => {
    expect(indexOfNthHyphen('氣溫是 - 5 度左右', 1)).toBe(-1);
    expect(indexOfNthHyphen('沒有連字號', 0)).toBe(-1);
  });
});

describe('hasInsertedGap()', () => {
  it('accept the gap the rules insert', () => {
    expect(hasInsertedGap('氣溫是 - 5 度左右', 4)).toBe(true);
  });

  it('reject a gap the rules did not insert', () => {
    // No space at all, a space the author put on the other side only, and a non-digit after the gap
    expect(hasInsertedGap('氣溫是 -5 度左右', 4)).toBe(false);
    expect(hasInsertedGap('氣溫是 - 五度', 4)).toBe(false);
    expect(hasInsertedGap('氣溫是 - ', 4)).toBe(false);
  });

  it('reject an index that is not a hyphen', () => {
    expect(hasInsertedGap('氣溫是 - 5 度左右', 3)).toBe(false);
  });
});

describe('CJK', () => {
  it('match the shared character class the rules read, byte for byte', () => {
    expect(CJK).toBe(SHARED_CJK);
  });
});

describe('hyphenSign.settle()', () => {
  // What a batch hands the page side: the bytes text spacing read, then the bytes the batch settled on
  function settleAll(before: string, after: string) {
    return hyphenSign.find(before).map((candidateMatch) => hyphenSign.settle(after, candidateMatch));
  }

  it('settle on the index the rules left the hyphen at', () => {
    expect(settleAll('氣溫是-5度左右', '氣溫是 - 5 度左右')).toEqual([4]);
  });

  it('follow the hyphen past a junction space', () => {
    expect(settleAll('氣溫是-5度', ' 氣溫是 - 5 度')).toEqual([5]);
  });

  it('settle the flagged hyphen when an earlier hyphen was never flagged', () => {
    expect(settleAll('Nasdaq-100本週下跌-13.44%', 'Nasdaq-100 本週下跌 - 13.44%')).toEqual([16]);
  });

  it('never flag an author-spaced hyphen', () => {
    expect(hyphenSign.find('氣溫是 -5度左右')).toEqual([]);
  });
});

describe('hyphenSign.isFix()', () => {
  it('fix only the signed-number label', () => {
    expect(hyphenSign.isFix('signed-number')).toBe(true);
    expect(hyphenSign.isFix('range-or-separator')).toBe(false);
    expect(hyphenSign.isFix('unsure')).toBe(false);
  });
});

describe('hyphenSign.edits()', () => {
  // The whole page-side pipeline for one text node whose every candidate came back as a fix: find, settle, edit, compose
  function fixAll(before: string, after: string) {
    const textEdits = hyphenSign.find(before).flatMap((candidateMatch) => {
      const index = hyphenSign.settle(after, candidateMatch);
      return index === null ? [] : hyphenSign.edits(after, index);
    });
    return applyTextEdits(after, textEdits);
  }

  it('delete only the space the rules inserted after the hyphen', () => {
    expect(fixAll('氣溫是-5度左右', '氣溫是 - 5 度左右')).toBe('氣溫是 -5 度左右');
  });

  it('fix every hyphen in one text node', () => {
    expect(fixAll('從-5到-3度', '從 - 5 到 - 3 度')).toBe('從 -5 到 -3 度');
  });

  it('fix after a junction space', () => {
    expect(fixAll('氣溫是-5度', ' 氣溫是 - 5 度')).toBe(' 氣溫是 -5 度');
  });
});

describe('applyTextEdits()', () => {
  // A stand-in second ambiguous shape, inserting a space rather than removing one, so the composition is exercised in both directions on one text node
  const spaceInserter: AmbiguousShape = {
    kind: 'space-inserter',
    find: () => [],
    settle: () => null,
    isFix: (label) => label === 'insert',
    edits: (_after, index) => [{ index, remove: 0, insert: ' ' }],
  };

  it('apply edits from two ambiguous shapes to one text node', () => {
    const after = '氣溫是 - 5 度 A+B';
    const textEdits: TextEdit[] = [...hyphenSign.edits(after, 4), ...spaceInserter.edits(after, 11)];

    // Descending index order is what keeps the insert from shifting the delete, whichever order the shapes were asked in
    expect(applyTextEdits(after, textEdits)).toBe('氣溫是 -5 度 A +B');
    expect(applyTextEdits(after, [...textEdits].reverse())).toBe('氣溫是 -5 度 A +B');
  });
});
