import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol |', () => {
  it('handle | symbol as separator, DO NOT spacing', () => {
    expect(pangu.spacingText('前面|後面')).toBe('前面|後面');
    expect(pangu.spacingText('Vinta|Mollie')).toBe('Vinta|Mollie');
    expect(pangu.spacingText('Vinta|Mollie|Kitten')).toBe('Vinta|Mollie|Kitten');
    expect(pangu.spacingText('Mollie|陳上進')).toBe('Mollie|陳上進');
    expect(pangu.spacingText('陳上進|Mollie')).toBe('陳上進|Mollie');
    expect(pangu.spacingText('陳上進|貓咪|Mollie')).toBe('陳上進|貓咪|Mollie');
    expect(pangu.spacingText('陳上進|Mollie|貓咪')).toBe('陳上進|Mollie|貓咪');
    expect(pangu.spacingText('Mollie|Vinta|貓咪')).toBe('Mollie|Vinta|貓咪');
    expect(pangu.spacingText('Mollie|陳上進|貓咪')).toBe('Mollie|陳上進|貓咪');

    // Rare cases, ignore
    // DO NOT change if already spacing
    // expect(pangu.spacingText('前面 | 後面')).toBe('前面 | 後面');
    // expect(pangu.spacingText('Vinta | Mollie')).toBe('Vinta | Mollie');
    // expect(pangu.spacingText('Vinta | Mollie | Kitten')).toBe('Vinta | Mollie | Kitten');
    // expect(pangu.spacingText('陳上進 | 貓咪 | Mollie')).toBe('陳上進 | 貓咪 | Mollie');
    // expect(pangu.spacingText('陳上進 | Mollie | 貓咪')).toBe('陳上進 | Mollie | 貓咪');
    // expect(pangu.spacingText('Mollie | Vinta | 貓咪')).toBe('Mollie | Vinta | 貓咪');
    // expect(pangu.spacingText('Mollie | 陳上進 | 貓咪')).toBe('Mollie | 陳上進 | 貓咪');

    // TODO:
    // expect(pangu.spacingText('得到一個A|B的結果')).toBe('得到一個A|B的結果');
  });
});
