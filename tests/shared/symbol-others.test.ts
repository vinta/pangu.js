import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Other Symbols', () => {
  // \u2026
  it('handle … symbol 只加右空格', () => {
    expect(pangu.spacingText('前面…後面')).toBe('前面… 後面');
    expect(pangu.spacingText('前面……後面')).toBe('前面…… 後面');
  });

  // \u00b7
  it('handle · symbol 取代', () => {
    expect(pangu.spacingText('前面·後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2022
  it('handle • symbol 取代', () => {
    expect(pangu.spacingText('前面•後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2027
  it('handle ‧ symbol 取代', () => {
    expect(pangu.spacingText('前面‧後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治‧R‧R‧馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M‧奈特‧沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u201c
  // \u201d
  it('handle English with “ ” symbols', () => {
    // prettier-ignore
    expect(pangu.spacingText('阿里云开源“计算王牌”Blink，实时计算时代已来'))
                       .toBe('阿里云开源 “计算王牌” Blink，实时计算时代已来');

    // prettier-ignore
    expect(pangu.spacingText('苹果撤销Facebook“企业证书”后者股价一度短线走低'))
                       .toBe('苹果撤销 Facebook “企业证书” 后者股价一度短线走低');

    // prettier-ignore
    expect(pangu.spacingText('【UCG中字】“數毛社”DF的《戰神4》全新演示解析'))
                       .toBe('【UCG 中字】“數毛社” DF 的《戰神 4》全新演示解析');
  });
});
