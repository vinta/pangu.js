import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('CJK A N', () => {
  it('handle short text', () => {
    expect(pangu.spaceText('中a')).toBe('中 a');
    expect(pangu.spaceText('a中')).toBe('a 中');
    expect(pangu.spaceText('1中')).toBe('1 中');
    expect(pangu.spaceText('中1')).toBe('中 1');
    expect(pangu.spaceText('中a1')).toBe('中 a1');
    expect(pangu.spaceText('a1中')).toBe('a1 中');
    expect(pangu.spaceText('a中1')).toBe('a 中 1');
    expect(pangu.spaceText('1中a')).toBe('1 中 a');
  });

  it('handle alphabets', () => {
    expect(pangu.spaceText('中文abc')).toBe('中文 abc');
    expect(pangu.spaceText('abc中文')).toBe('abc 中文');
  });

  it('handle numbers', () => {
    expect(pangu.spaceText('中文123')).toBe('中文 123');
    expect(pangu.spaceText('123中文')).toBe('123 中文');
  });

  // https://symbl.cc/en/unicode-table/#latin-1-supplement
  it('handle Latin-1 Supplement', () => {
    expect(pangu.spaceText('中文Ø漢字')).toBe('中文 Ø 漢字');
    expect(pangu.spaceText('中文 Ø 漢字')).toBe('中文 Ø 漢字');
  });

  // https://symbl.cc/en/unicode-table/#greek-coptic
  it('handle Greek and Coptic', () => {
    expect(pangu.spaceText('中文β漢字')).toBe('中文 β 漢字');
    expect(pangu.spaceText('中文 β 漢字')).toBe('中文 β 漢字');
    expect(pangu.spaceText('我是α，我是Ω')).toBe('我是 α，我是 Ω');
  });

  // https://symbl.cc/en/unicode-table/#number-forms
  it('handle Number Forms', () => {
    expect(pangu.spaceText('中文Ⅶ漢字')).toBe('中文 Ⅶ 漢字');
    expect(pangu.spaceText('中文 Ⅶ 漢字')).toBe('中文 Ⅶ 漢字');
  });

  // https://symbl.cc/en/unicode-table/#letterlike-symbols
  it('handle Letterlike Symbols', () => {
    expect(pangu.spaceText('今天123℃很熱')).toBe('今天 123℃ 很熱');
    expect(pangu.spaceText('攝氏25℃到30℃之間')).toBe('攝氏 25℃ 到 30℃ 之間');
    expect(pangu.spaceText('水溫98℉了')).toBe('水溫 98℉ 了');
    expect(pangu.spaceText('5℃~10℃之間')).toBe('5℃~10℃ 之間');
    expect(pangu.spaceText('溫度是℃單位')).toBe('溫度是 ℃ 單位');
    expect(pangu.spaceText('第№5號')).toBe('第 №5 號');
    expect(pangu.spaceText('電阻10Ω很小')).toBe('電阻 10Ω 很小'); // \u2126 OHM SIGN, not Greek \u03a9
    expect(pangu.spaceText('中文ℝ漢字')).toBe('中文 ℝ 漢字');
    expect(pangu.spaceText('中文 ℝ 漢字')).toBe('中文 ℝ 漢字');
    expect(pangu.spaceText('符號ℓ表示長度')).toBe('符號 ℓ 表示長度');
    expect(pangu.spaceText('資訊ℹ圖示')).toBe('資訊 ℹ 圖示');
    expect(pangu.spaceText('估計℮500ml')).toBe('估計 ℮500ml');
  });

  // https://symbl.cc/en/unicode-table/#dingbats
  it('handle Dingbats symbols', () => {
    expect(pangu.spaceText('剪刀✂符號')).toBe('剪刀 ✂ 符號');
    expect(pangu.spaceText('完成✅了')).toBe('完成 ✅ 了');
    expect(pangu.spaceText('愛心❤符號')).toBe('愛心 ❤ 符號');
  });

  // https://symbl.cc/en/unicode-table/#cjk-radicals-supplement
  it('handle CJK Radicals Supplement', () => {
    expect(pangu.spaceText('abc⻤123')).toBe('abc ⻤ 123');
    expect(pangu.spaceText('abc ⻤ 123')).toBe('abc ⻤ 123');
  });

  // https://symbl.cc/en/unicode-table/#kangxi-radicals
  it('handle Kangxi Radicals', () => {
    expect(pangu.spaceText('abc⾗123')).toBe('abc ⾗ 123');
    expect(pangu.spaceText('abc ⾗ 123')).toBe('abc ⾗ 123');
  });

  // https://symbl.cc/en/unicode-table/#hiragana
  it('handle Hiragana', () => {
    expect(pangu.spaceText('abcあ123')).toBe('abc あ 123');
    expect(pangu.spaceText('abc あ 123')).toBe('abc あ 123');
  });

  // https://symbl.cc/en/unicode-table/#katakana
  it('handle Katakana', () => {
    expect(pangu.spaceText('abcア123')).toBe('abc ア 123');
    expect(pangu.spaceText('abc ア 123')).toBe('abc ア 123');
  });

  // https://symbl.cc/en/unicode-table/#bopomofo
  it('handle Bopomofo', () => {
    expect(pangu.spaceText('abcㄅ123')).toBe('abc ㄅ 123');
    expect(pangu.spaceText('abc ㄅ 123')).toBe('abc ㄅ 123');
  });

  // https://symbl.cc/en/unicode-table/#enclosed-cjk-letters-and-months
  it('handle Enclosed CJK Letters And Months', () => {
    expect(pangu.spaceText('abc㈱123')).toBe('abc ㈱ 123');
    expect(pangu.spaceText('abc ㈱ 123')).toBe('abc ㈱ 123');
  });

  // https://symbl.cc/en/unicode-table/#cjk-unified-ideographs-extension-a
  it('handle CJK Unified Ideographs Extension-A', () => {
    expect(pangu.spaceText('abc㐂123')).toBe('abc 㐂 123');
    expect(pangu.spaceText('abc 㐂 123')).toBe('abc 㐂 123');
  });

  // https://symbl.cc/en/unicode-table/#cjk-unified-ideographs
  it('handle CJK Unified Ideographs', () => {
    expect(pangu.spaceText('abc丁123')).toBe('abc 丁 123');
    expect(pangu.spaceText('abc 丁 123')).toBe('abc 丁 123');
  });

  // https://symbl.cc/en/unicode-table/#cjk-compatibility-ideographs
  it('handle CJK Compatibility Ideographs', () => {
    expect(pangu.spaceText('abc車123')).toBe('abc 車 123');
    expect(pangu.spaceText('abc 車 123')).toBe('abc 車 123');
  });
});
