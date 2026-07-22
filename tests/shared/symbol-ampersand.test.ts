import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol &', () => {
  // When CJK touches the & directly
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

  // An ampersand with half-width characters on both sides binds them into one token,
  // spaced from CJK as a unit and never split. The & itself is untouched for the same
  // reason "Vinta&Mollie" is: no CJK touches it - but CJK boundaries elsewhere still space
  it('handle & symbol as ampersand token', () => {
    expect(pangu.spacingText('Vinta&Mollie')).toBe('Vinta&Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('得到一個A&B的結果')).toBe('得到一個 A&B 的結果');
    expect(pangu.spacingText('本週S&P 500及Nasdaq同時下跌')).toBe('本週 S&P 500 及 Nasdaq 同時下跌');
    expect(pangu.spacingText('接下來是Q&A時間')).toBe('接下來是 Q&A 時間');
  });
});
