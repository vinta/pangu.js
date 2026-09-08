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

  // \u2100 - \u214f
  it('handle Letterlike Symbols', () => {
    expect(pangu.spacingText('今天123℃很熱')).toBe('今天 123℃ 很熱');
    expect(pangu.spacingText('攝氏25℃到30℃之間')).toBe('攝氏 25℃ 到 30℃ 之間');
    expect(pangu.spacingText('水溫98℉了')).toBe('水溫 98℉ 了');
    expect(pangu.spacingText('5℃~10℃之間')).toBe('5℃~10℃ 之間');
    expect(pangu.spacingText('溫度是℃單位')).toBe('溫度是 ℃ 單位');
    expect(pangu.spacingText('第№5號')).toBe('第 №5 號');
    expect(pangu.spacingText('電阻10Ω很小')).toBe('電阻 10Ω 很小'); // \u2126 OHM SIGN, not Greek \u03a9
    expect(pangu.spacingText('中文ℝ漢字')).toBe('中文 ℝ 漢字');
    expect(pangu.spacingText('中文 ℝ 漢字')).toBe('中文 ℝ 漢字');
    expect(pangu.spacingText('符號ℓ表示長度')).toBe('符號 ℓ 表示長度');
    expect(pangu.spacingText('資訊ℹ圖示')).toBe('資訊 ℹ 圖示');
    expect(pangu.spacingText('估計℮500ml')).toBe('估計 ℮500ml');
  });

  // \u2122 and \u2120 read as superscript suffixes, so they stay attached on the left
  it('handle ™ and ℠ symbols', () => {
    expect(pangu.spacingText('iPhone™手機')).toBe('iPhone™ 手機');
    expect(pangu.spacingText('微軟™公司')).toBe('微軟™ 公司');
    expect(pangu.spacingText('Coca-Cola℠飲料')).toBe('Coca-Cola℠ 飲料');
  });
});
