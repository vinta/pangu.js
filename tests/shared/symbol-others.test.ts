import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Other Symbols', () => {
  // \u2026
  it('handle … symbol', () => {
    expect(pangu.spacingText('前面…後面')).toBe('前面… 後面');
    expect(pangu.spacingText('前面……後面')).toBe('前面…… 後面');
  });

  // \u00b7
  it('handle · symbol', () => {
    expect(pangu.spacingText('前面·後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2022
  it('handle • symbol', () => {
    expect(pangu.spacingText('前面•後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2027
  it('handle ‧ symbol', () => {
    expect(pangu.spacingText('前面‧後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治‧R‧R‧馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M‧奈特‧沙马兰')).toBe('M・奈特・沙马兰');
  });

  // — An em-dash is not a spaced half-width symbol, so it stays flush against CJK
  it('handle — symbol', () => {
    expect(pangu.spacingText('前面—後面')).toBe('前面—後面');
    expect(pangu.spacingText('他說——不對')).toBe('他說——不對');
  });

  // \u2700 - \u27bf
  it('handle Dingbats symbols', () => {
    expect(pangu.spacingText('剪刀✂符號')).toBe('剪刀 ✂ 符號');
    expect(pangu.spacingText('完成✅了')).toBe('完成 ✅ 了');
    expect(pangu.spacingText('愛心❤符號')).toBe('愛心 ❤ 符號');
  });
});
