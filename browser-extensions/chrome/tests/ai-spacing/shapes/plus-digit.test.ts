import { pangu } from 'pangu/shared';
import { describe, expect, it, vi } from 'vitest';
import { applyTextEdits } from '../../../src/ai-spacing/shapes/base';
import { digitPlus } from '../../../src/ai-spacing/shapes/digit-plus';
import { hyphenDigit } from '../../../src/ai-spacing/shapes/hyphen-digit';
import { plusDigit } from '../../../src/ai-spacing/shapes/plus-digit';

describe('plusDigit.find()', () => {
  it.each(['大寫英文字母+9位數字', '打+886這個號碼', '氣溫是+5度左右'])('find a tight original and exact settled form in %s', (unspaced) => {
    const settled = pangu.spaceText(unspaced);
    expect(plusDigit.find(unspaced, settled)).toEqual([{ sentence: unspaced, at: unspaced.indexOf('+'), index: settled.indexOf('+') }]);
  });

  it('keep UTF-16 sentence and settled offsets distinct', () => {
    const sentenceAt = vi.fn(() => ({ sentence: '格式🔑字母+9位數字', at: 6 }));
    expect(plusDigit.find('字母+9位數字', ' 字母 +9 位數字', sentenceAt)).toEqual([{ sentence: '格式🔑字母+9位數字', at: 6, index: 4 }]);
    expect(sentenceAt).toHaveBeenCalledWith(2);
  });

  it('count earlier noncandidate pluses when mapping the settled index', () => {
    expect(plusDigit.find('A+B。字母+9位數字', 'A + B。字母 +9 位數字')).toEqual([{ sentence: '字母+9位數字', at: 2, index: 9 }]);
  });

  it.each(['。', '！', '？', '；'])('allow separate single-plus contexts across %s', (terminator) => {
    const unspaced = `字母+9位數字${terminator}兩個字母+8位數字`;
    const settled = pangu.spaceText(unspaced);
    expect(plusDigit.find(unspaced, settled)).toEqual([
      { sentence: '字母+9位數字', at: 2, index: settled.indexOf('+') },
      { sentence: '兩個字母+8位數字', at: 4, index: settled.lastIndexOf('+') },
    ]);
  });

  it.each(['字母 +9位數字', '字母+ 9位數字', '字母\t+9位數字', '字母+\t9位數字', '字母＋9位數字', '字母+９位數字', 'letter+9', '2+2', '字母+數字'])('ignore excluded original shape %s', (unspaced) => {
    expect(plusDigit.find(unspaced, pangu.spaceText(unspaced))).toEqual([]);
    expect(plusDigit.hasPotentialCandidates(unspaced)).toBe(false);
  });

  it.each(['字母+9 位數字', '字母 + 9 位數字', '字母  +9 位數字', '字母\t+9 位數字', '字母 +\t9 位數字', '字母 9 位數字', '字母 X+9 位數字', '字母 +X 位數字'])(
    'drop an unexpected settled form %s',
    (settled) => {
      expect(plusDigit.find('字母+9位數字', settled)).toEqual([]);
    },
  );

  it('drop a missing settled ordinal', () => {
    expect(plusDigit.find('A+B。字母+9位數字', 'A+B。字母 9 位數字')).toEqual([]);
  });

  it.each(['字母+9位數字，配件+配件', 'C++：字母+9位數字', '字母+9：字母+8'])('reject multiple pluses in the same context: %s', (unspaced) => {
    expect(plusDigit.find(unspaced, pangu.spaceText(unspaced))).toEqual([]);
  });

  it('count a second plus from a neighboring inline node', () => {
    const sentenceAt = vi.fn(() => ({ sentence: '字母+9位數字，配件+配件', at: 2 }));
    expect(plusDigit.find('字母+9位數字', '字母 +9 位數字', sentenceAt)).toEqual([]);
    expect(sentenceAt).toHaveBeenCalledWith(2);
  });

  it.each(['字母', '+9位數字', '字母+', '9位數字'])('exclude a shape split across nodes: %s', (unspaced) => {
    const sentenceAt = vi.fn(() => ({ sentence: '字母+9位數字', at: 2 }));
    expect(plusDigit.find(unspaced, pangu.spaceText(unspaced), sentenceAt)).toEqual([]);
    expect(sentenceAt).not.toHaveBeenCalled();
  });

  it('apply the single-plus gate to the bounded context', () => {
    const prefix = `A+B${'中'.repeat(121)}`;
    const unspaced = `${prefix}字母+9位數字`;
    const settled = pangu.spaceText(unspaced);
    expect(plusDigit.find(unspaced, settled)).toEqual([{ sentence: `${'中'.repeat(118)}字母+9位數字`, at: 120, index: settled.lastIndexOf('+') }]);
  });

  it('never share a target with digit-plus', () => {
    const unspaced = '字母+9位數字；Switch 2+瑪利歐';
    const settled = pangu.spaceText(unspaced);
    expect(plusDigit.find(unspaced, settled).map(({ index }) => index)).toEqual([settled.indexOf('+')]);
    expect(digitPlus.find(unspaced, settled).map(({ index }) => index)).toEqual([settled.lastIndexOf('+')]);
  });
});

describe('plusDigit.hasPotentialCandidates()', () => {
  it('remain a repeatable broad scan across multiple pluses', () => {
    const text = 'A+B。字母+9位數字';
    expect(plusDigit.hasPotentialCandidates(text)).toBe(true);
    expect(plusDigit.hasPotentialCandidates(text)).toBe(true);
    expect(plusDigit.hasPotentialCandidates('字母+9，字母+8')).toBe(true);
  });
});

describe('plusDigit.edits()', () => {
  const settled = ' 字母 +9 位數字';
  const candidate = { sentence: '字母+9位數字', at: 2, index: 4, node: {} as Text, settled };

  it('insert only one space after the settled plus for conjunction', () => {
    const edits = plusDigit.edits(candidate, 'conjunction');
    expect(edits).toEqual([{ index: 5, remove: 0, insert: ' ' }]);
    expect(applyTextEdits(settled, edits)).toBe(' 字母 + 9 位數字');
  });

  it.each(['signed-number', 'unsure', 'lower-bound', 'range-or-separator', null] as const)('preserve core output for %s', (label) => {
    expect(plusDigit.edits(candidate, label)).toEqual([]);
  });

  it('compose a plus insertion and a hyphen deletion against the same settled snapshot', () => {
    const unspaced = '氣溫是-5度；字母+9位數字';
    const settled = pangu.spaceText(unspaced);
    const plus = plusDigit.find(unspaced, settled)[0]!;
    const hyphen = hyphenDigit.find(unspaced, settled)[0]!;
    const node = {} as Text;
    const edits = [...plusDigit.edits({ ...plus, node, settled }, 'conjunction'), ...hyphenDigit.edits({ ...hyphen, node, settled }, 'signed-number')];
    expect(applyTextEdits(settled, edits)).toBe('氣溫是 -5 度；字母 + 9 位數字');
  });
});
