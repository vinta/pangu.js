import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol &', () => {
  // When the symbol appears only 1 time or shows up with other operators in one line
  it('handle & symbol as operator, ALWAYS spacing', () => {
    expect(pangu.spacingText('前面&後面')).toBe('前面 & 後面');
    expect(pangu.spacingText('Vinta&Mollie')).toBe('Vinta&Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('Vinta&陳上進')).toBe('Vinta & 陳上進');
    expect(pangu.spacingText('陳上進&Vinta')).toBe('陳上進 & Vinta');
    expect(pangu.spacingText('得到一個A&B的結果')).toBe('得到一個 A & B 的結果');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 & 後面')).toBe('前面 & 後面');
    expect(pangu.spacingText('Vinta & Mollie')).toBe('Vinta & Mollie');
    expect(pangu.spacingText('Vinta & 陳上進')).toBe('Vinta & 陳上進');
    expect(pangu.spacingText('陳上進 & Vinta')).toBe('陳上進 & Vinta');
    expect(pangu.spacingText('得到一個 A & B 的結果')).toBe('得到一個 A & B 的結果');
  });
});
