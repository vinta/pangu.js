import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol _', () => {
  it('handle _ symbol as separator, DO NOT spacing', () => {
    expect(pangu.spacingText('前面_後面')).toBe('前面_後面');
    expect(pangu.spacingText('Vinta_Mollie')).toBe('Vinta_Mollie');
    expect(pangu.spacingText('Vinta_Mollie_Kitten')).toBe('Vinta_Mollie_Kitten');
    expect(pangu.spacingText('Mollie_陳上進')).toBe('Mollie_陳上進');
    expect(pangu.spacingText('陳上進_Mollie')).toBe('陳上進_Mollie');
    expect(pangu.spacingText('陳上進_貓咪_Mollie')).toBe('陳上進_貓咪_Mollie');
    expect(pangu.spacingText('陳上進_Mollie_貓咪')).toBe('陳上進_Mollie_貓咪');
    expect(pangu.spacingText('Mollie_Vinta_貓咪')).toBe('Mollie_Vinta_貓咪');
    expect(pangu.spacingText('Mollie_陳上進_貓咪')).toBe('Mollie_陳上進_貓咪');

    // prettier-ignore
    expect(pangu.spacingText('為什麼你們就是不能加個空格呢？_20771210_最終版_v365.7.24.zip'))
                       .toBe('為什麼你們就是不能加個空格呢？_20771210_最終版_v365.7.24.zip');

    // Rare cases, ignore
    // DO NOT change if already spacing
    // expect(pangu.spacingText('前面 _ 後面')).toBe('前面 _ 後面');
    // expect(pangu.spacingText('Vinta _ Mollie')).toBe('Vinta _ Mollie');
    // expect(pangu.spacingText('Vinta _ Mollie _ Kitten')).toBe('Vinta _ Mollie _ Kitten');
    // expect(pangu.spacingText('陳上進 _ 貓咪 _ Mollie')).toBe('陳上進 _ 貓咪 _ Mollie');
    // expect(pangu.spacingText('陳上進 _ Mollie _ 貓咪')).toBe('陳上進 _ Mollie _ 貓咪');
    // expect(pangu.spacingText('Mollie _ Vinta _ 貓咪')).toBe('Mollie _ Vinta _ 貓咪');
    // expect(pangu.spacingText('Mollie _ 陳上進 _ 貓咪')).toBe('Mollie _ 陳上進 _ 貓咪');

    // TODO:
    // expect(pangu.spacingText('得到一個A_B的結果')).toBe('得到一個A_B的結果');
  });
});
