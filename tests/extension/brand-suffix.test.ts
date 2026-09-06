import { describe, expect, it } from 'vitest';
import { applyTextEdits } from '../../browser-extensions/chrome/src/ai-spacing/shapes/base';
import { brandSuffix } from '../../browser-extensions/chrome/src/ai-spacing/shapes/brand-suffix-shape';
import { pangu } from '../../src/shared/index';

function fixAll(unspaced: string, settled: string) {
  const textEdits = brandSuffix.find(unspaced, settled).flatMap((candidateMatch) => brandSuffix.edits({ ...candidateMatch, node: {} as Text, settled }));
  return applyTextEdits(settled, textEdits);
}

describe('brandSuffix.find()', () => {
  it('flag a listed brand tight against its plus', () => {
    expect(brandSuffix.find('公視+上架了新片', '公視 + 上架了新片')).toEqual([{ sentence: '公視+上', at: 2, index: 3 }]);
    expect(brandSuffix.find('MOD影劇館+上架了新片', 'MOD 影劇館 + 上架了新片')).toEqual([{ sentence: '影劇館+上', at: 3, index: 8 }]);
  });

  it('count earlier pluses into the ordinal', () => {
    expect(brandSuffix.find('公視+與Disney+都上架了新片', '公視 + 與 Disney+ 都上架了新片')).toEqual([{ sentence: '公視+與', at: 2, index: 3 }]);
    expect(brandSuffix.find('HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)', 'HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館 + (300M/300M)')).toEqual([{ sentence: '影劇館+(', at: 3, index: 36 }]);
  });

  it('flag every listed brand in one text node', () => {
    expect(brandSuffix.find('公視+上架新片，公視+也有紀錄片', '公視 + 上架新片，公視 + 也有紀錄片')).toEqual([
      { sentence: '公視+上', at: 2, index: 3 },
      { sentence: '公視+也', at: 2, index: 13 },
    ]);
  });

  it('keep the end of the text as an empty next character', () => {
    expect(brandSuffix.find('今天來看公視+', '今天來看公視 +')).toEqual([{ sentence: '公視+', at: 2, index: 7 }]);
  });

  it('ignore an author-written space and unlisted brands', () => {
    expect(brandSuffix.find('公視 +上架了新片', '公視 + 上架了新片')).toEqual([]);
    expect(brandSuffix.find('公視 + 上架了新片', '公視 + 上架了新片')).toEqual([]);
    expect(brandSuffix.find('星河+上線', '星河 + 上線')).toEqual([]);
    expect(brandSuffix.find('Disney+上架了新片', 'Disney+ 上架了新片')).toEqual([]);
  });

  it('drop a match when the settled text has no rules-inserted gap', () => {
    expect(brandSuffix.find('公視+上架了新片', '公視+ 上架了新片')).toEqual([]);
    expect(brandSuffix.find('公視+上架了新片', '公視上架了新片')).toEqual([]);
  });
});

describe('brandSuffix.classify() and isFix()', () => {
  it('label every candidate on the page as a brand suffix and fix it', () => {
    const candidateLabels = brandSuffix.classify!([
      { sentence: '公視+上', at: 2 },
      { sentence: '影劇館+/', at: 3 },
    ]);
    expect(candidateLabels).toEqual(['brand-suffix', 'brand-suffix']);
    expect(brandSuffix.isFix('brand-suffix')).toBe(true);
    expect(brandSuffix.isFix('signed-number')).toBe(false);
  });
});

describe('brandSuffix.edits()', () => {
  it('preserve author spaces when the input contains a literal core placeholder', () => {
    const unspaced = '`+` A \uE004BACKTICK_CONTENT_0\uE005 公視+上架';
    expect(fixAll(unspaced, pangu.spacingText(unspaced))).toBe('`+` A \uE004BACKTICK_CONTENT_0\uE005 公視+ 上架');
  });

  it('delete the space before the plus and keep the boundary before a word', () => {
    expect(fixAll('公視+上架了新片', '公視 + 上架了新片')).toBe('公視+ 上架了新片');
    expect(fixAll('MOD影劇館+上架了新片', 'MOD 影劇館 + 上架了新片')).toBe('MOD 影劇館+ 上架了新片');
    expect(fixAll('公視+與Disney+都上架了新片', '公視 + 與 Disney+ 都上架了新片')).toBe('公視+ 與 Disney+ 都上架了新片');
  });

  it('keep the boundary before an opening bracket', () => {
    expect(fixAll('公視+(免費平台)', '公視 + (免費平台)')).toBe('公視+ (免費平台)');
    expect(fixAll('【速在必行方案】HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)', '【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館 + (300M/300M)')).toBe(
      '【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館+ (300M/300M)',
    );
  });

  it('delete both spaces before a slash, a closing bracket, or punctuation', () => {
    expect(fixAll('影劇館+/全選', '影劇館 + /全選')).toBe('影劇館+/全選');
    expect(fixAll('公視+，今天有新片', '公視 + ，今天有新片')).toBe('公視+，今天有新片');
    expect(fixAll('公視+。', '公視 + 。')).toBe('公視+。');
    expect(fixAll('公視+）', '公視 + ）')).toBe('公視+）');
    expect(fixAll('公視+]', '公視 + ]')).toBe('公視+]');
    expect(fixAll('「公視+」', '「公視 + 」')).toBe('「公視+」');
  });

  it('delete only the space before the plus at the end of the text', () => {
    expect(fixAll('今天來看公視+', '今天來看公視 +')).toBe('今天來看公視+');
  });

  it('fix every listed brand in one text node', () => {
    expect(fixAll('公視+上架新片，公視+也有紀錄片', '公視 + 上架新片，公視 + 也有紀錄片')).toBe('公視+ 上架新片，公視+ 也有紀錄片');
  });
});
