import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Other Symbols', () => {
  // \u2026
  it('handle … symbol, only add space on the right', () => {
    expect(pangu.spacingText('前面…後面')).toBe('前面… 後面');
    expect(pangu.spacingText('前面……後面')).toBe('前面…… 後面');
  });

  // \u00b7
  it('handle · symbol, replace with ・', () => {
    expect(pangu.spacingText('前面·後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2022
  it('handle • symbol, replace with ・', () => {
    expect(pangu.spacingText('前面•後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2027
  it('handle ‧ symbol, replace with ・', () => {
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

  // — An em-dash is not a spaced half-width symbol, so it stays flush against CJK
  it('handle — em-dash, does not add space with CJK', () => {
    expect(pangu.spacingText('前面—後面')).toBe('前面—後面');
    expect(pangu.spacingText('他說——不對')).toBe('他說——不對');
  });

  // \u2700 - \u27bf
  it('handle Dingbats symbols, add space between them and CJK', () => {
    expect(pangu.spacingText('剪刀✂符號')).toBe('剪刀 ✂ 符號');
    expect(pangu.spacingText('完成✅了')).toBe('完成 ✅ 了');
    expect(pangu.spacingText('愛心❤符號')).toBe('愛心 ❤ 符號');
  });

  // FIXME
  // // \ufffd
  // it('handle Specials symbols, add space between them and CJK', () => {
  //   expect(pangu.spacingText('我喜歡在填表單的時候故意加幾個� (U+FFFD)字元，好讓那些工程師懷疑系統有bug')).toBe('我喜歡在填表單的時候故意加幾個 � (U+FFFD) 字元，好讓那些工程師懷疑系統有 bug');
  // });
});
