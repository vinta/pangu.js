import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Name suffixes', () => {
  it('handle product names with suffixes', () => {
    expect(pangu.spaceText('Apple Fitness+推出新課程')).toBe('Apple Fitness+ 推出新課程');
    expect(pangu.spaceText('Apple TV+上架了新片')).toBe('Apple TV+ 上架了新片');
    expect(pangu.spaceText('Discovery+和discovery+都上架了')).toBe('Discovery+ 和 discovery+ 都上架了');
    expect(pangu.spaceText('Disney+上架了新片')).toBe('Disney+ 上架了新片');
    expect(pangu.spaceText('Disney+上架了C++課程')).toBe('Disney+ 上架了 C++ 課程');
    expect(pangu.spaceText('PS+會員')).toBe('PS+ 會員');
    expect(pangu.spaceText('公視+上架了新片')).toBe('公視+ 上架了新片');
    expect(pangu.spaceText('如何使用PTS+（公視+）註冊與觀看？')).toBe('如何使用 PTS+（公視+）註冊與觀看？');
    expect(pangu.spaceText('公視+(免費平台)')).toBe('公視+ (免費平台)');
    expect(pangu.spaceText('今天來看公視+')).toBe('今天來看公視+');
    expect(pangu.spaceText('MOD影劇館+上架了新片')).toBe('MOD 影劇館+ 上架了新片');
    expect(pangu.spaceText('Netflix、Disney+、Apple TV+、MOD影劇館+、公視+等串流平台')).toBe('Netflix、Disney+、Apple TV+、MOD 影劇館+、公視+ 等串流平台');
  });

  it('handle product tiers with suffixes', () => {
    expect(pangu.spaceText('vivo X70 Pro+開賣')).toBe('vivo X70 Pro+ 開賣');
  });

  it('handle credit ratings with suffixes', () => {
    expect(pangu.spaceText('評等介於AA-和AA+之間')).toBe('評等介於 AA- 和 AA+ 之間');
    expect(pangu.spaceText('惠譽給予BBB+評等')).toBe('惠譽給予 BBB+ 評等');
    expect(pangu.spaceText('惠譽給予BBB-評等')).toBe('惠譽給予 BBB- 評等');
    expect(pangu.spaceText('中華信評給予twAA+評等')).toBe('中華信評給予 twAA+ 評等');
  });

  it('handle blood types with suffixes', () => {
    expect(pangu.spaceText('血型是AB+的人')).toBe('血型是 AB+ 的人');
    expect(pangu.spaceText('血型是AB-的人')).toBe('血型是 AB- 的人');
    expect(pangu.spaceText('血型是Rh+的人')).toBe('血型是 Rh+ 的人');
    expect(pangu.spaceText('血型是Rh-的人')).toBe('血型是 Rh- 的人');
    expect(pangu.spaceText('型號AB-123的零件，血型是AB-的人')).toBe('型號 AB-123 的零件，血型是 AB- 的人');
  });

  it('handle closing punctuation tight after a suffixes', () => {
    expect(pangu.spaceText('公視+，今天有新片')).toBe('公視+，今天有新片');
    expect(pangu.spaceText('公視+。')).toBe('公視+。');
    expect(pangu.spaceText('(公視+）')).toBe('(公視+）');
    expect(pangu.spaceText('[公視+]')).toBe('[公視+]');
    expect(pangu.spaceText('「公視+」')).toBe('「公視+」');
  });

  it('handle non-preserved names', () => {
    expect(pangu.spaceText('私視+上線')).toBe('私視 + 上線');
    expect(pangu.spaceText('Disney-上架了新片')).toBe('Disney - 上架了新片');
  });
});
