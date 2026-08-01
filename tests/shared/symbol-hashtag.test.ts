import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol # only add space on the left', () => {
  it('handle # symbol as hashtag', () => {
    expect(pangu.spacingText('前面#後面')).toBe('前面 #後面');
    expect(pangu.spacingText('前面#H2G2後面')).toBe('前面 #H2G2 後面');
    expect(pangu.spacingText('前面 #銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
    expect(pangu.spacingText('前面#銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
    expect(pangu.spacingText('前面#銀河公車指南 #銀河拖吊車指南 後面')).toBe('前面 #銀河公車指南 #銀河拖吊車指南 後面');

    // Special cases
    expect(pangu.spacingText('前面C#後面')).toBe('前面 C# 後面');
    expect(pangu.spacingText('前面F#後面')).toBe('前面 F# 後面');
  });

  // FIXME
  // it('handle # # symbols as Weibo-like hashtags', () => {
  //   expect(pangu.spacingText('前面#H2G2#後面')).toBe('前面 #H2G2# 後面');
  //   expect(pangu.spacingText('前面#銀河閃電霹靂車指南#後面')).toBe('前面 #銀河閃電霹靂車指南# 後面');
  // });
});
