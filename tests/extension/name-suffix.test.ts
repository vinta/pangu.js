import { describe, expect, it } from 'vitest';
import { applyTextEdits } from '../../browser-extensions/chrome/src/ai-spacing/shapes/base';
import { nameSuffix } from '../../browser-extensions/chrome/src/ai-spacing/shapes/name-suffix-shape';

function fixAll(unspaced: string, settled: string) {
  const textEdits = nameSuffix.find(unspaced, settled).flatMap((candidateMatch) => nameSuffix.edits({ ...candidateMatch, node: {} as Text, settled }, null));
  return applyTextEdits(settled, textEdits);
}

describe('nameSuffix.find()', () => {
  it('flag a listed name tight against its symbol', () => {
    expect(nameSuffix.find('Disney+上架了新片', 'Disney + 上架了新片')).toEqual([{ sentence: 'Disney+上', at: 6, index: 7 }]);
    expect(nameSuffix.find('公視+上架了新片', '公視 + 上架了新片')).toEqual([{ sentence: '公視+上', at: 2, index: 3 }]);
    expect(nameSuffix.find('MOD影劇館+上架了新片', 'MOD 影劇館 + 上架了新片')).toEqual([{ sentence: '影劇館+上', at: 3, index: 8 }]);
    expect(nameSuffix.find('血型是AB-的人', '血型是 AB - 的人')).toEqual([{ sentence: 'AB-的', at: 2, index: 7 }]);
  });

  it('count earlier symbols into the ordinal, per symbol', () => {
    expect(nameSuffix.find('公視+與Disney+都上架了新片', '公視 + 與 Disney + 都上架了新片')).toEqual([
      { sentence: '公視+與', at: 2, index: 3 },
      { sentence: 'Disney+都', at: 6, index: 14 },
    ]);
    expect(nameSuffix.find('HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)', 'HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館 + (300M/300M)')).toEqual([{ sentence: '影劇館+(', at: 3, index: 36 }]);
    expect(nameSuffix.find('評等介於AA-和AA+之間', '評等介於 AA - 和 AA + 之間')).toEqual([
      { sentence: 'AA-和', at: 2, index: 8 },
      { sentence: 'AA+之', at: 2, index: 15 },
    ]);
  });

  it('flag every listed name in one text node', () => {
    expect(nameSuffix.find('公視+上架新片，公視+也有紀錄片', '公視 + 上架新片，公視 + 也有紀錄片')).toEqual([
      { sentence: '公視+上', at: 2, index: 3 },
      { sentence: '公視+也', at: 2, index: 13 },
    ]);
  });

  it('keep the end of the text as an empty next character', () => {
    expect(nameSuffix.find('今天來看公視+', '今天來看公視 +')).toEqual([{ sentence: '公視+', at: 2, index: 7 }]);
  });

  it('ignore an author-written space, an unlisted name, and a longer Latin word', () => {
    expect(nameSuffix.find('公視 +上架了新片', '公視 + 上架了新片')).toEqual([]);
    expect(nameSuffix.find('公視 + 上架了新片', '公視 + 上架了新片')).toEqual([]);
    expect(nameSuffix.find('星河+上線', '星河 + 上線')).toEqual([]);
    expect(nameSuffix.find('Canal+出品', 'Canal + 出品')).toEqual([]);
    expect(nameSuffix.find('Canal+和Disney+都上架了', 'Canal + 和 Disney + 都上架了')).toEqual([{ sentence: 'Disney+都', at: 6, index: 17 }]);
    expect(nameSuffix.find('NotDisney+和Disney+都上架了', 'NotDisney + 和 Disney + 都上架了')).toEqual([{ sentence: 'Disney+都', at: 6, index: 21 }]);
    expect(nameSuffix.find('血型是NotAB+的人', '血型是 NotAB + 的人')).toEqual([]);
  });

  it('ignore a minus after a name that takes a plus only', () => {
    expect(nameSuffix.find('Disney-上架了新片', 'Disney - 上架了新片')).toEqual([]);
  });

  it('drop a match when the settled text has no rules-inserted gap', () => {
    expect(nameSuffix.find('公視+上架了新片', '公視+ 上架了新片')).toEqual([]);
    expect(nameSuffix.find('公視+上架了新片', '公視上架了新片')).toEqual([]);
    expect(nameSuffix.find('型號AB-123的零件', '型號 AB-123 的零件')).toEqual([]);
    expect(nameSuffix.find('血型是AB-，很稀有', '血型是 AB-，很稀有')).toEqual([]);
  });
});

describe('nameSuffix.edits()', () => {
  it('delete the space before the symbol and keep the boundary before a word', () => {
    expect(fixAll('Disney+上架了新片', 'Disney + 上架了新片')).toBe('Disney+ 上架了新片');
    expect(fixAll('公視+上架了新片', '公視 + 上架了新片')).toBe('公視+ 上架了新片');
    expect(fixAll('MOD影劇館+上架了新片', 'MOD 影劇館 + 上架了新片')).toBe('MOD 影劇館+ 上架了新片');
    expect(fixAll('公視+與Disney+都上架了新片', '公視 + 與 Disney + 都上架了新片')).toBe('公視+ 與 Disney+ 都上架了新片');
  });

  it('restore one name from each set', () => {
    expect(fixAll('Apple Fitness+推出新課程', 'Apple Fitness + 推出新課程')).toBe('Apple Fitness+ 推出新課程');
    expect(fixAll('PS+會員', 'PS + 會員')).toBe('PS+ 會員');
    expect(fixAll('vivo X70 Pro+開賣', 'vivo X70 Pro + 開賣')).toBe('vivo X70 Pro+ 開賣');
    expect(fixAll('標普給予AA+評等', '標普給予 AA + 評等')).toBe('標普給予 AA+ 評等');
    expect(fixAll('惠譽給予BBB+評等', '惠譽給予 BBB + 評等')).toBe('惠譽給予 BBB+ 評等');
    expect(fixAll('中華信評給予twAA+評等', '中華信評給予 twAA + 評等')).toBe('中華信評給予 twAA+ 評等');
    expect(fixAll('血型是AB+的人', '血型是 AB + 的人')).toBe('血型是 AB+ 的人');
    expect(fixAll('血型是Rh+的人', '血型是 Rh + 的人')).toBe('血型是 Rh+ 的人');
  });

  it('restore the minus form of a credit rating or a blood type', () => {
    expect(fixAll('血型是AB-的人', '血型是 AB - 的人')).toBe('血型是 AB- 的人');
    expect(fixAll('血型是Rh-的人', '血型是 Rh - 的人')).toBe('血型是 Rh- 的人');
    expect(fixAll('標普給予AA-評等', '標普給予 AA - 評等')).toBe('標普給予 AA- 評等');
    expect(fixAll('惠譽給予BBB-評等', '惠譽給予 BBB - 評等')).toBe('惠譽給予 BBB- 評等');
    expect(fixAll('評等介於AA-和AA+之間', '評等介於 AA - 和 AA + 之間')).toBe('評等介於 AA- 和 AA+ 之間');
  });

  it('leave a single-letter joiner alone on a listed line', () => {
    expect(fixAll('血型是AB+和A+B型', '血型是 AB + 和 A + B 型')).toBe('血型是 AB+ 和 A + B 型');
  });

  it('restore Latin names the rules spaced as separators', () => {
    expect(fixAll('Netflix、Disney+、Apple TV+等串流平台', 'Netflix、Disney + 、Apple TV + 等串流平台')).toBe('Netflix、Disney+、Apple TV+ 等串流平台');
    expect(fixAll('Disney+和Apple TV+都上架了', 'Disney + 和 Apple TV + 都上架了')).toBe('Disney+ 和 Apple TV+ 都上架了');
    expect(fixAll('公視+、Disney+、Apple TV+等平台', '公視 + 、Disney + 、Apple TV + 等平台')).toBe('公視+、Disney+、Apple TV+ 等平台');
    expect(fixAll('Discovery+和discovery+都上架了', 'Discovery + 和 discovery + 都上架了')).toBe('Discovery+ 和 discovery+ 都上架了');
  });

  it('keep the boundary before an opening bracket', () => {
    expect(fixAll('公視+(免費平台)', '公視 + (免費平台)')).toBe('公視+ (免費平台)');
    expect(fixAll('【速在必行方案】HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)', '【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館 + (300M/300M)')).toBe(
      '【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館+ (300M/300M)',
    );
  });

  it('delete both spaces before a slash, a closing bracket, or punctuation', () => {
    expect(fixAll('影劇館+/全選', '影劇館 + /全選')).toBe('影劇館+/全選');
    expect(fixAll('HiNet光世代+MOD+影劇館+/全選/自選20/特選餐/豪華餐(5選1)+Wi-Fi全屋通(1台)', 'HiNet 光世代 + MOD + 影劇館 + /全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)')).toBe(
      'HiNet 光世代 + MOD + 影劇館+/全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)',
    );
    expect(fixAll('公視+，今天有新片', '公視 + ，今天有新片')).toBe('公視+，今天有新片');
    expect(fixAll('公視+。', '公視 + 。')).toBe('公視+。');
    expect(fixAll('公視+）', '公視 + ）')).toBe('公視+）');
    expect(fixAll('公視+]', '公視 + ]')).toBe('公視+]');
    expect(fixAll('「公視+」', '「公視 + 」')).toBe('「公視+」');
  });

  it('delete only the space before the symbol at the end of the text', () => {
    expect(fixAll('今天來看公視+', '今天來看公視 +')).toBe('今天來看公視+');
  });

  it('fix every listed name in one text node', () => {
    expect(fixAll('公視+上架新片，公視+也有紀錄片', '公視 + 上架新片，公視 + 也有紀錄片')).toBe('公視+ 上架新片，公視+ 也有紀錄片');
  });
});
