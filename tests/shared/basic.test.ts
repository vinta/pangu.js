import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Basic', () => {
  describe('兩邊都加空格', () => {
    it('should handle short text', () => {
      expect(pangu.spacingText('中a')).toBe('中 a');
      expect(pangu.spacingText('a中')).toBe('a 中');
      expect(pangu.spacingText('1中')).toBe('1 中');
      expect(pangu.spacingText('中1')).toBe('中 1');
      expect(pangu.spacingText('中a1')).toBe('中 a1');
      expect(pangu.spacingText('a1中')).toBe('a1 中');
      expect(pangu.spacingText('a中1')).toBe('a 中 1');
      expect(pangu.spacingText('1中a')).toBe('1 中 a');
    });

    it('should handle alphabets', () => {
      expect(pangu.spacingText('中文abc')).toBe('中文 abc');
      expect(pangu.spacingText('abc中文')).toBe('abc 中文');
    });

    it('should handle numbers', () => {
      expect(pangu.spacingText('中文123')).toBe('中文 123');
      expect(pangu.spacingText('123中文')).toBe('123 中文');
    });

    // https://symbl.cc/en/unicode-table/#latin-1-supplement
    it('should handle Latin-1 Supplement', () => {
      expect(pangu.spacingText('中文Ø漢字')).toBe('中文 Ø 漢字');
      expect(pangu.spacingText('中文 Ø 漢字')).toBe('中文 Ø 漢字');
    });

    // https://symbl.cc/en/unicode-table/#greek-coptic
    it('should handle Greek and Coptic', () => {
      expect(pangu.spacingText('中文β漢字')).toBe('中文 β 漢字');
      expect(pangu.spacingText('中文 β 漢字')).toBe('中文 β 漢字');
      expect(pangu.spacingText('我是α，我是Ω')).toBe('我是 α，我是 Ω');
    });

    // https://symbl.cc/en/unicode-table/#number-forms
    it('should handle Number Forms', () => {
      expect(pangu.spacingText('中文Ⅶ漢字')).toBe('中文 Ⅶ 漢字');
      expect(pangu.spacingText('中文 Ⅶ 漢字')).toBe('中文 Ⅶ 漢字');
    });

    // https://symbl.cc/en/unicode-table/#cjk-radicals-supplement
    it('should handle CJK Radicals Supplement', () => {
      expect(pangu.spacingText('abc⻤123')).toBe('abc ⻤ 123');
      expect(pangu.spacingText('abc ⻤ 123')).toBe('abc ⻤ 123');
    });

    // https://symbl.cc/en/unicode-table/#kangxi-radicals
    it('should handle Kangxi Radicals', () => {
      expect(pangu.spacingText('abc⾗123')).toBe('abc ⾗ 123');
      expect(pangu.spacingText('abc ⾗ 123')).toBe('abc ⾗ 123');
    });

    // https://symbl.cc/en/unicode-table/#hiragana
    it('should handle Hiragana', () => {
      expect(pangu.spacingText('abcあ123')).toBe('abc あ 123');
      expect(pangu.spacingText('abc あ 123')).toBe('abc あ 123');
    });

    // https://symbl.cc/en/unicode-table/#katakana
    it('should handle Katakana', () => {
      expect(pangu.spacingText('abcア123')).toBe('abc ア 123');
      expect(pangu.spacingText('abc ア 123')).toBe('abc ア 123');
    });

    // https://symbl.cc/en/unicode-table/#bopomofo
    it('should handle Bopomofo', () => {
      expect(pangu.spacingText('abcㄅ123')).toBe('abc ㄅ 123');
      expect(pangu.spacingText('abc ㄅ 123')).toBe('abc ㄅ 123');
    });

    // https://symbl.cc/en/unicode-table/#enclosed-cjk-letters-and-months
    it('should handle Enclosed CJK Letters And Months', () => {
      expect(pangu.spacingText('abc㈱123')).toBe('abc ㈱ 123');
      expect(pangu.spacingText('abc ㈱ 123')).toBe('abc ㈱ 123');
    });

    // https://symbl.cc/en/unicode-table/#cjk-unified-ideographs-extension-a
    it('should handle CJK Unified Ideographs Extension-A', () => {
      expect(pangu.spacingText('abc㐂123')).toBe('abc 㐂 123');
      expect(pangu.spacingText('abc 㐂 123')).toBe('abc 㐂 123');
    });

    // https://symbl.cc/en/unicode-table/#cjk-unified-ideographs
    it('should handle CJK Unified Ideographs', () => {
      expect(pangu.spacingText('abc丁123')).toBe('abc 丁 123');
      expect(pangu.spacingText('abc 丁 123')).toBe('abc 丁 123');
    });

    // https://symbl.cc/en/unicode-table/#cjk-compatibility-ideographs
    it('should handle CJK Compatibility Ideographs', () => {
      expect(pangu.spacingText('abc車123')).toBe('abc 車 123');
      expect(pangu.spacingText('abc 車 123')).toBe('abc 車 123');
    });
  });
});
