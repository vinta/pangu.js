import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Name suffixes', () => {
  it('restores name suffixes', () => {
    expect(pangu.spaceText('Disney+上架了新片')).toBe('Disney+ 上架了新片');
    expect(pangu.spaceText('公視+上架了新片')).toBe('公視+ 上架了新片');
    expect(pangu.spaceText('如何使用PTS+（公視+）註冊與觀看？')).toBe('如何使用 PTS+（公視+）註冊與觀看？');
    expect(pangu.spaceText('MOD+影劇館+上架')).toBe('MOD + 影劇館+ 上架');
    expect(pangu.spaceText('Netflix、Disney+、Apple TV+等串流平台')).toBe('Netflix、Disney+、Apple TV+ 等串流平台');
    expect(pangu.spaceText('影劇館+/全選')).toBe('影劇館+/全選');
    expect(pangu.spaceText('公視+(免費平台)')).toBe('公視+ (免費平台)');
    expect(pangu.spaceText('「公視+」')).toBe('「公視+」');
    expect(pangu.spaceText('今天來看公視+')).toBe('今天來看公視+');
    expect(pangu.spaceText('vivo X70 Pro+開賣')).toBe('vivo X70 Pro+ 開賣');
    expect(pangu.spaceText('評等介於AA-和AA+之間')).toBe('評等介於 AA- 和 AA+ 之間');
    expect(pangu.spaceText('血型是AB-的人')).toBe('血型是 AB- 的人');
  });

  it('preserves core spacing and author-written gaps', () => {
    expect(pangu.spaceText('打+886這個號碼')).toBe('打 +886 這個號碼');
    expect(pangu.spaceText('Disney+上架了C++課程')).toBe('Disney+ 上架了 C++ 課程');
    expect(pangu.spaceText('Disney+上架了A+B')).toBe('Disney+ 上架了 A + B');
    expect(pangu.spaceText('Switch+健身環套組')).toBe('Switch + 健身環套組');
    expect(pangu.spaceText('公視 +上架了新片')).toBe('公視 + 上架了新片');
    expect(pangu.spaceText('氣溫是 - 5度')).toBe('氣溫是 - 5 度');
  });

  it('restores product names, credit ratings, and blood types', () => {
    expect(pangu.spaceText('Apple Fitness+推出新課程')).toBe('Apple Fitness+ 推出新課程');
    expect(pangu.spaceText('PS+會員')).toBe('PS+ 會員');
    expect(pangu.spaceText('Discovery+和discovery+都上架了')).toBe('Discovery+ 和 discovery+ 都上架了');
    expect(pangu.spaceText('惠譽給予BBB+評等')).toBe('惠譽給予 BBB+ 評等');
    expect(pangu.spaceText('惠譽給予BBB-評等')).toBe('惠譽給予 BBB- 評等');
    expect(pangu.spaceText('中華信評給予twAA+評等')).toBe('中華信評給予 twAA+ 評等');
    expect(pangu.spaceText('血型是Rh+的人')).toBe('血型是 Rh+ 的人');
    expect(pangu.spaceText('血型是Rh-的人')).toBe('血型是 Rh- 的人');
  });

  it('restores repeated names and mixed suffixes independently', () => {
    expect(pangu.spaceText('公視+上架新片，公視+也有紀錄片')).toBe('公視+ 上架新片，公視+ 也有紀錄片');
    expect(pangu.spaceText('公視+與Disney+都上架了新片')).toBe('公視+ 與 Disney+ 都上架了新片');
    expect(pangu.spaceText('公視+、Disney+、Apple TV+等平台')).toBe('公視+、Disney+、Apple TV+ 等平台');
    expect(pangu.spaceText('血型是AB+和A+B型')).toBe('血型是 AB+ 和 A + B 型');
    expect(pangu.spaceText('型號AB-123的零件，血型是AB-的人')).toBe('型號 AB-123 的零件，血型是 AB- 的人');
    expect(pangu.spaceText('血型是AB-，很稀有')).toBe('血型是 AB-，很稀有');
  });

  it('requires a listed name, its accepted symbol, and a Latin left boundary', () => {
    expect(pangu.spaceText('星河+上線')).toBe('星河 + 上線');
    expect(pangu.spaceText('Canal+和Disney+都上架了')).toBe('Canal + 和 Disney+ 都上架了');
    expect(pangu.spaceText('NotDisney+和Disney+都上架了')).toBe('NotDisney + 和 Disney+ 都上架了');
    expect(pangu.spaceText('血型是NotAB+的人')).toBe('血型是 NotAB + 的人');
    expect(pangu.spaceText('Disney-上架了新片')).toBe('Disney - 上架了新片');
  });

  it('preserves author-written spaces before and after a suffix', () => {
    expect(pangu.spaceText('公視 + 上架了新片')).toBe('公視 + 上架了新片');
    expect(pangu.spaceText('公視  +上架')).toBe('公視  + 上架');
    expect(pangu.spaceText('公視+  上架')).toBe('公視+  上架');
    expect(pangu.spaceText('公視+ /全選')).toBe('公視+ /全選');
    expect(pangu.spaceText('公視+  ，今天有新片')).toBe('公視+  ，今天有新片');
  });

  it('keeps closing punctuation tight after a suffix', () => {
    expect(pangu.spaceText('公視+，今天有新片')).toBe('公視+，今天有新片');
    expect(pangu.spaceText('公視+。')).toBe('公視+。');
    expect(pangu.spaceText('公視+）')).toBe('公視+）');
    expect(pangu.spaceText('公視+]')).toBe('公視+]');
  });

  it('preserves protected content and spaces attribute values independently', () => {
    expect(pangu.spaceText('保留`公視+與Disney +`，公視+上架了新片')).toBe('保留 `公視+與Disney +`，公視+ 上架了新片');
    expect(pangu.spaceText('<a data-name="Disney+" title="公視+上架了新片">公視+上架</a>')).toBe('<a data-name="Disney+" title="公視+ 上架了新片">公視+ 上架</a>');
    expect(pangu.spaceText('<a data-name="Disney +" title="公視 +上架">公視+上架</a>')).toBe('<a data-name="Disney +" title="公視 + 上架">公視+ 上架</a>');
  });

  it('keeps its final output unchanged on a second pass', () => {
    expect(pangu.spaceText(pangu.spaceText('Disney+上架了A+B'))).toBe('Disney+ 上架了 A + B');
    expect(pangu.spaceText(pangu.spaceText('公視+上架新片，公視+也有紀錄片'))).toBe('公視+ 上架新片，公視+ 也有紀錄片');
    expect(pangu.spaceText(pangu.spaceText('評等介於AA-和AA+之間'))).toBe('評等介於 AA- 和 AA+ 之間');
    expect(pangu.spaceText(pangu.spaceText('影劇館+/全選'))).toBe('影劇館+/全選');
    expect(pangu.spaceText(pangu.spaceText('公視+  ，今天有新片'))).toBe('公視+  ，今天有新片');
    expect(pangu.spaceText(pangu.spaceText('保留`公視+與Disney +`，公視+上架了新片'))).toBe('保留 `公視+與Disney +`，公視+ 上架了新片');
  });
});
