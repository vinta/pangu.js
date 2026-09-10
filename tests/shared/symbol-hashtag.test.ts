import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol #', () => {
  it('handle # symbol as hashtag', () => {
    expect(pangu.spaceText('前面#後面')).toBe('前面 #後面');
    expect(pangu.spaceText('前面#H2G2後面')).toBe('前面 #H2G2 後面');
    expect(pangu.spaceText('前面 #銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
    expect(pangu.spaceText('前面#銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
    expect(pangu.spaceText('前面#銀河公車指南 #銀河拖吊車指南 後面')).toBe('前面 #銀河公車指南 #銀河拖吊車指南 後面');
  });

  it('handle # symbol as preserved pattern', () => {
    expect(pangu.spaceText('前面C#後面')).toBe('前面 C# 後面');
    expect(pangu.spaceText('前面F#後面')).toBe('前面 F# 後面');
    expect(pangu.spaceText('前端/後端/資料庫：C#和Python')).toBe('前端/後端/資料庫：C# 和 Python');
  });

  it('handle # symbol as hashtag in a slash list', () => {
    expect(pangu.spaceText('dae-dae-o/#絕地家庭小會議/#今天大掃除了沒有/')).toBe('dae-dae-o/#絕地家庭小會議/#今天大掃除了沒有/');
  });
});
