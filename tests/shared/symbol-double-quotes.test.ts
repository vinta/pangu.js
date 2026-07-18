import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol " "', () => {
  it('handle " " symbols as quotes', () => {
    expect(pangu.spacingText('前面"中文123漢字"後面')).toBe('前面 "中文 123 漢字" 後面');
    expect(pangu.spacingText('前面"中文123"後面')).toBe('前面 "中文 123" 後面');
    expect(pangu.spacingText('前面"中文abc"後面')).toBe('前面 "中文 abc" 後面');
    expect(pangu.spacingText('前面"123漢字"後面')).toBe('前面 "123 漢字" 後面');
    expect(pangu.spacingText('前面"中文123" tail')).toBe('前面 "中文 123" tail');
    expect(pangu.spacingText('head "中文123漢字"後面')).toBe('head "中文 123 漢字" 後面');
    expect(pangu.spacingText('head "中文123漢字" tail')).toBe('head "中文 123 漢字" tail');
  });

  it('handle " " adjacent to CJK', () => {
    expect(pangu.spacingText('我們也不可以說"We invited the reverend to dinner."')).toBe('我們也不可以說 "We invited the reverend to dinner."');
    expect(pangu.spacingText('"We invited the Rev. Darling."我們也不可以說')).toBe('"We invited the Rev. Darling." 我們也不可以說');
    expect(pangu.spacingText('它應該這樣使用："We invited"')).toBe('它應該這樣使用："We invited"');
  });

  // Straight quotes cannot distinguish opening from closing, so quotes are paired
  // left-to-right within a line. An unpaired leading closing quote or a quoted segment
  // that spans a newline shifts the pairing, and the CJK prose between two segments is
  // treated as quoted content whose edge spaces get stripped. This mis-pairing kept the
  // browser suite's quote-spacing case skipped for years. See #287
  it('handle " " mis-pairing (known limitation)', () => {
    expect(pangu.spacingText('Darling." 或 "We')).toBe('Darling."或" We');
    expect(pangu.spacingText('使用："We\ninvited Darling." 或 "We invited."')).toBe('使用："We\ninvited Darling."或" We invited."');
  });
});
