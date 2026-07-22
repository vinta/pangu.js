import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol <', () => {
  // When CJK touches the < directly
  it('handle < symbol as operator', () => {
    expect(pangu.spacingText('前面<後面')).toBe('前面 < 後面');
    expect(pangu.spacingText('Vinta<陳上進')).toBe('Vinta < 陳上進');
    expect(pangu.spacingText('陳上進<Vinta')).toBe('陳上進 < Vinta');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 < 後面')).toBe('前面 < 後面');
    expect(pangu.spacingText('Vinta < Mollie')).toBe('Vinta < Mollie');
    expect(pangu.spacingText('Vinta < 陳上進')).toBe('Vinta < 陳上進');
    expect(pangu.spacingText('陳上進 < Vinta')).toBe('陳上進 < Vinta');
    expect(pangu.spacingText('得到一個 A < B 的結果')).toBe('得到一個 A < B 的結果');
  });

  // A less-than sign with half-width characters on both sides binds them into one token,
  // spaced from CJK as a unit and never split
  it('handle < symbol as less-than token', () => {
    expect(pangu.spacingText('Vinta<Mollie')).toBe('Vinta<Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('得到一個A<B的結果')).toBe('得到一個 A<B 的結果');
    expect(pangu.spacingText('如果A<B就繼續')).toBe('如果 A<B 就繼續');
    expect(pangu.spacingText('條件是1<2的情況')).toBe('條件是 1<2 的情況');
  });
});
