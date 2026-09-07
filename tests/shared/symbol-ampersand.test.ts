import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol &', () => {
  it('handle & symbol as operator', () => {
    expect(pangu.spacingText('前面&後面')).toBe('前面 & 後面');
    expect(pangu.spacingText('Vinta&陳上進')).toBe('Vinta & 陳上進');
    expect(pangu.spacingText('陳上進&Vinta')).toBe('陳上進 & Vinta');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 & 後面')).toBe('前面 & 後面');
    expect(pangu.spacingText('Vinta & Mollie')).toBe('Vinta & Mollie');
    expect(pangu.spacingText('Vinta & 陳上進')).toBe('Vinta & 陳上進');
    expect(pangu.spacingText('陳上進 & Vinta')).toBe('陳上進 & Vinta');
    expect(pangu.spacingText('得到一個 A & B 的結果')).toBe('得到一個 A & B 的結果');
  });

  it('handle & symbol as joiner token', () => {
    expect(pangu.spacingText('Vinta&Mollie')).toBe('Vinta&Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('得到一個A&B的結果')).toBe('得到一個 A&B 的結果');
    expect(pangu.spacingText('本週S&P 500及Nasdaq同時下跌')).toBe('本週 S&P 500 及 Nasdaq 同時下跌');
    expect(pangu.spacingText('接下來是Q&A時間')).toBe('接下來是 Q&A 時間');
  });
});
