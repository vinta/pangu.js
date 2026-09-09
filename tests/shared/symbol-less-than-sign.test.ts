import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol <', () => {
  it('handle < symbol as operator', () => {
    expect(pangu.spaceText('前面<後面')).toBe('前面 < 後面');
    expect(pangu.spaceText('Vinta<陳上進')).toBe('Vinta < 陳上進');
    expect(pangu.spaceText('陳上進<Vinta')).toBe('陳上進 < Vinta');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 < 後面')).toBe('前面 < 後面');
    expect(pangu.spaceText('Vinta < Mollie')).toBe('Vinta < Mollie');
    expect(pangu.spaceText('Vinta < 陳上進')).toBe('Vinta < 陳上進');
    expect(pangu.spaceText('陳上進 < Vinta')).toBe('陳上進 < Vinta');
    expect(pangu.spaceText('得到一個 A < B 的結果')).toBe('得到一個 A < B 的結果');
  });

  it('handle < symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta<Mollie')).toBe('Vinta<Mollie'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A<B的結果')).toBe('得到一個 A<B 的結果');
    expect(pangu.spaceText('如果A<B就繼續')).toBe('如果 A<B 就繼續');
    expect(pangu.spaceText('條件是1<2的情況')).toBe('條件是 1<2 的情況');
  });
});
