import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol &', () => {
  it('handle & symbol as operator', () => {
    expect(pangu.spaceText('前面&後面')).toBe('前面 & 後面');
    expect(pangu.spaceText('Vinta&陳上進')).toBe('Vinta & 陳上進');
    expect(pangu.spaceText('陳上進&Vinta')).toBe('陳上進 & Vinta');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 & 後面')).toBe('前面 & 後面');
    expect(pangu.spaceText('Vinta & Abc123')).toBe('Vinta & Abc123');
    expect(pangu.spaceText('Vinta & 陳上進')).toBe('Vinta & 陳上進');
    expect(pangu.spaceText('陳上進 & Vinta')).toBe('陳上進 & Vinta');
    expect(pangu.spaceText('得到一個 A & B 的結果')).toBe('得到一個 A & B 的結果');
  });

  it('handle & symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta&Abc123')).toBe('Vinta&Abc123'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A&B的結果')).toBe('得到一個 A&B 的結果');
    expect(pangu.spaceText('本週S&P 500及Nasdaq同時下跌')).toBe('本週 S&P 500 及 Nasdaq 同時下跌');
    expect(pangu.spaceText('接下來是Q&A時間')).toBe('接下來是 Q&A 時間');
  });
});
