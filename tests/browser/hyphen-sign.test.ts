import { describe, expect, it } from 'vitest';
import { findHyphenSpans, hasInsertedGap, indexOfNthHyphen, sliceSentence } from '../../src/browser/hyphen-sign';

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

describe('findHyphenSpans()', () => {
  it('flag a tight CJK-digit hyphen', () => {
    expect(findHyphenSpans('氣溫是-5度左右')).toEqual([{ sentence: '氣溫是-5度左右', at: 3, ordinal: 0 }]);
  });

  it('count earlier hyphens that were never flagged into the ordinal', () => {
    // The Nasdaq-100 hyphen is ordinal 0 and reads A-digit, so only the second hyphen is flagged
    expect(findHyphenSpans('Nasdaq-100本週下跌-13.44%')).toEqual([{ sentence: 'Nasdaq-100本週下跌-13.44%', at: 14, ordinal: 1 }]);
  });

  it('flag every hyphen in one text node', () => {
    expect(findHyphenSpans('從-5到-3度')).toEqual([
      { sentence: '從-5到-3度', at: 1, ordinal: 0 },
      { sentence: '從-5到-3度', at: 4, ordinal: 1 },
    ]);
  });

  it('slice each hyphen into its own sentence', () => {
    expect(findHyphenSpans('溫度是-5度。濕度是-3度')).toEqual([
      { sentence: '溫度是-5度', at: 3, ordinal: 0 },
      { sentence: '濕度是-3度', at: 3, ordinal: 1 },
    ]);
  });

  it('ignore shapes outside the tight CJK-digit form', () => {
    // Half-width left side, non-digit right side, and an already-spaced original are all out of scope
    expect(findHyphenSpans('abc-5')).toEqual([]);
    expect(findHyphenSpans('中文-abc')).toEqual([]);
    expect(findHyphenSpans('氣溫是 -5度')).toEqual([]);
    expect(findHyphenSpans('氣溫是- 5度')).toEqual([]);
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
