import { describe, expect, it, vi } from 'vitest';
import { applyTextEdits } from '../../../../browser-extensions/chrome/src/ai-spacing/shapes/base';
import { digitPlus } from '../../../../browser-extensions/chrome/src/ai-spacing/shapes/digit-plus';

describe('digitPlus.find()', () => {
  it('find a whole numeric token before CJK', () => {
    expect(digitPlus.find('Switch 2+瑪利歐', 'Switch 2+ 瑪利歐')).toEqual([{ sentence: 'Switch 2+瑪利歐', at: 8, index: 8 }]);
    expect(digitPlus.find('評分3.5+的餐廳', '評分 3.5+ 的餐廳')).toEqual([{ sentence: '評分3.5+的餐廳', at: 5, index: 6 }]);
  });

  it('keep UTF-16 sentence and settled offsets distinct', () => {
    const sentenceAt = vi.fn(() => ({ sentence: '推薦🎮Switch 2+瑪利歐同捆組', at: 12 }));
    expect(digitPlus.find('2+瑪利歐', ' 2+ 瑪利歐', sentenceAt)).toEqual([{ sentence: '推薦🎮Switch 2+瑪利歐同捆組', at: 12, index: 2 }]);
    expect(sentenceAt).toHaveBeenCalledWith(1);
  });

  it('count earlier noncandidate pluses when mapping the settled index', () => {
    expect(digitPlus.find('A+B。Switch 2+瑪利歐', 'A + B。Switch 2+ 瑪利歐')).toEqual([{ sentence: 'Switch 2+瑪利歐', at: 8, index: 14 }]);
  });

  it.each(['。', '！', '？', '；'])('allow separate single-plus contexts across %s', (terminator) => {
    expect(digitPlus.find(`有100+的選擇${terminator}Switch 2+瑪利歐`, `有 100+ 的選擇${terminator}Switch 2+ 瑪利歐`)).toEqual([
      { sentence: '有100+的選擇', at: 4, index: 5 },
      { sentence: 'Switch 2+瑪利歐', at: 8, index: 19 },
    ]);
  });

  it.each([
    ['Switch 2 +瑪利歐', 'Switch 2 + 瑪利歐'],
    ['Switch 2+ 瑪利歐', 'Switch 2+ 瑪利歐'],
    ['Galaxy S24+手機', 'Galaxy S24 + 手機'],
    ['Synology DS224+儲存檔案', 'Synology DS224 + 儲存檔案'],
    ['Roborock S7+掃地', 'Roborock S7 + 掃地'],
    ['相機X100+記憶卡同捆組', '相機 X100 + 記憶卡同捆組'],
    ['商品數量2+', '商品數量 2+'],
    ['商品2＋配件', '商品 2＋配件'],
    ['2+2', '2+2'],
    ['Switch 2+Mario', 'Switch 2+Mario'],
  ])('ignore excluded original shape %s', (unspaced, settled) => {
    expect(digitPlus.find(unspaced, settled)).toEqual([]);
    expect(digitPlus.hasPotentialCandidates(unspaced)).toBe(false);
  });

  it.each(['Switch 2 + 瑪利歐', 'Switch 2+瑪利歐', 'Switch 2+  瑪利歐', 'Switch 2+\t瑪利歐', 'Switch 2 瑪利歐', 'Switch X+ 瑪利歐', 'Switch 2+ Mario'])(
    'drop an unexpected settled form %s',
    (settled) => {
      expect(digitPlus.find('Switch 2+瑪利歐', settled)).toEqual([]);
    },
  );

  it('drop a missing settled ordinal', () => {
    expect(digitPlus.find('A+B。Switch 2+瑪利歐', 'A+B。Switch 2 瑪利歐')).toEqual([]);
  });

  it.each(['Switch 2+瑪利歐，手把+配件', 'C++，Switch 2+瑪利歐', '2+遊戲與3+配件'])('reject multiple pluses in the same context: %s', (unspaced) => {
    expect(digitPlus.find(unspaced, unspaced.replace(/\+(?=[瑪遊配])/g, '+ '))).toEqual([]);
  });

  it('count a second plus from a neighboring inline node', () => {
    const sentenceAt = vi.fn(() => ({ sentence: 'Switch 2+瑪利歐，手把+配件', at: 8 }));
    expect(digitPlus.find('2+瑪利歐', '2+ 瑪利歐', sentenceAt)).toEqual([]);
    expect(sentenceAt).toHaveBeenCalledWith(1);
  });

  it('apply the single-plus gate to the bounded context', () => {
    const prefix = `A+B${'中'.repeat(121)}`;
    const [candidate] = digitPlus.find(`${prefix}2+遊戲`, `${prefix} 2+ 遊戲`);
    expect(candidate).toEqual({ sentence: `${'中'.repeat(119)}2+遊戲`, at: 120, index: prefix.length + 2 });
  });
});

describe('digitPlus.hasPotentialCandidates()', () => {
  it('remain a repeatable broad scan across multiple pluses', () => {
    const text = 'A+B。Switch 2+瑪利歐';
    expect(digitPlus.hasPotentialCandidates(text)).toBe(true);
    expect(digitPlus.hasPotentialCandidates(text)).toBe(true);
    expect(digitPlus.hasPotentialCandidates('2+遊戲，3+配件')).toBe(true);
    expect(digitPlus.find(text, 'A + B。Switch 2+ 瑪利歐')).toHaveLength(1);
  });
});

describe('digitPlus.edits()', () => {
  const settled = ' Switch 2+ 瑪利歐';
  const candidate = { sentence: 'Switch 2+瑪利歐', at: 8, index: 9, node: {} as Text, settled };

  it('insert only one space before the settled plus for conjunction', () => {
    const edits = digitPlus.edits(candidate, 'conjunction');
    expect(edits).toEqual([{ index: 9, remove: 0, insert: ' ' }]);
    expect(applyTextEdits(settled, edits)).toBe(' Switch 2 + 瑪利歐');
  });

  it.each(['lower-bound', 'unsure', 'signed-number', 'range-or-separator', null] as const)('preserve core output for %s', (label) => {
    expect(digitPlus.edits(candidate, label)).toEqual([]);
  });
});
