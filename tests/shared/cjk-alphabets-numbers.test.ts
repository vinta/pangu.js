import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('CJK A N', () => {
  it('handle short text', () => {
    expect(pangu.spacingText('中a')).toBe('中 a');
    expect(pangu.spacingText('a中')).toBe('a 中');
    expect(pangu.spacingText('1中')).toBe('1 中');
    expect(pangu.spacingText('中1')).toBe('中 1');
    expect(pangu.spacingText('中a1')).toBe('中 a1');
    expect(pangu.spacingText('a1中')).toBe('a1 中');
    expect(pangu.spacingText('a中1')).toBe('a 中 1');
    expect(pangu.spacingText('1中a')).toBe('1 中 a');
  });

  it('handle alphabets', () => {
    expect(pangu.spacingText('中文abc')).toBe('中文 abc');
    expect(pangu.spacingText('abc中文')).toBe('abc 中文');
  });

  it('handle numbers', () => {
    expect(pangu.spacingText('中文123')).toBe('中文 123');
    expect(pangu.spacingText('123中文')).toBe('123 中文');
  });

  // https://symbl.cc/en/unicode-table/#latin-1-supplement
  it('handle Latin-1 Supplement', () => {
    expect(pangu.spacingText('中文Ø漢字')).toBe('中文 Ø 漢字');
    expect(pangu.spacingText('中文 Ø 漢字')).toBe('中文 Ø 漢字');
  });

  // https://symbl.cc/en/unicode-table/#greek-coptic
  it('handle Greek and Coptic', () => {
    expect(pangu.spacingText('中文β漢字')).toBe('中文 β 漢字');
    expect(pangu.spacingText('中文 β 漢字')).toBe('中文 β 漢字');
    expect(pangu.spacingText('我是α，我是Ω')).toBe('我是 α，我是 Ω');
  });

  // https://symbl.cc/en/unicode-table/#number-forms
  it('handle Number Forms', () => {
    expect(pangu.spacingText('中文Ⅶ漢字')).toBe('中文 Ⅶ 漢字');
    expect(pangu.spacingText('中文 Ⅶ 漢字')).toBe('中文 Ⅶ 漢字');
  });

  // https://symbl.cc/en/unicode-table/#letterlike-symbols
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

  // https://symbl.cc/en/unicode-table/#dingbats
  it('handle Dingbats symbols', () => {
    expect(pangu.spacingText('剪刀✂符號')).toBe('剪刀 ✂ 符號');
    expect(pangu.spacingText('完成✅了')).toBe('完成 ✅ 了');
    expect(pangu.spacingText('愛心❤符號')).toBe('愛心 ❤ 符號');
  });

  // https://symbl.cc/en/unicode-table/#cjk-radicals-supplement
  it('handle CJK Radicals Supplement', () => {
    expect(pangu.spacingText('abc⻤123')).toBe('abc ⻤ 123');
    expect(pangu.spacingText('abc ⻤ 123')).toBe('abc ⻤ 123');
  });

  // https://symbl.cc/en/unicode-table/#kangxi-radicals
  it('handle Kangxi Radicals', () => {
    expect(pangu.spacingText('abc⾗123')).toBe('abc ⾗ 123');
    expect(pangu.spacingText('abc ⾗ 123')).toBe('abc ⾗ 123');
  });

  // https://symbl.cc/en/unicode-table/#hiragana
  it('handle Hiragana', () => {
    expect(pangu.spacingText('abcあ123')).toBe('abc あ 123');
    expect(pangu.spacingText('abc あ 123')).toBe('abc あ 123');
  });

  // https://symbl.cc/en/unicode-table/#katakana
  it('handle Katakana', () => {
    expect(pangu.spacingText('abcア123')).toBe('abc ア 123');
    expect(pangu.spacingText('abc ア 123')).toBe('abc ア 123');
  });

  // https://symbl.cc/en/unicode-table/#bopomofo
  it('handle Bopomofo', () => {
    expect(pangu.spacingText('abcㄅ123')).toBe('abc ㄅ 123');
    expect(pangu.spacingText('abc ㄅ 123')).toBe('abc ㄅ 123');
  });

  // https://symbl.cc/en/unicode-table/#enclosed-cjk-letters-and-months
  it('handle Enclosed CJK Letters And Months', () => {
    expect(pangu.spacingText('abc㈱123')).toBe('abc ㈱ 123');
    expect(pangu.spacingText('abc ㈱ 123')).toBe('abc ㈱ 123');
  });

  // https://symbl.cc/en/unicode-table/#cjk-unified-ideographs-extension-a
  it('handle CJK Unified Ideographs Extension-A', () => {
    expect(pangu.spacingText('abc㐂123')).toBe('abc 㐂 123');
    expect(pangu.spacingText('abc 㐂 123')).toBe('abc 㐂 123');
  });

  // https://symbl.cc/en/unicode-table/#cjk-unified-ideographs
  it('handle CJK Unified Ideographs', () => {
    expect(pangu.spacingText('abc丁123')).toBe('abc 丁 123');
    expect(pangu.spacingText('abc 丁 123')).toBe('abc 丁 123');
  });

  // https://symbl.cc/en/unicode-table/#cjk-compatibility-ideographs
  it('handle CJK Compatibility Ideographs', () => {
    expect(pangu.spacingText('abc車123')).toBe('abc 車 123');
    expect(pangu.spacingText('abc 車 123')).toBe('abc 車 123');
  });
});
