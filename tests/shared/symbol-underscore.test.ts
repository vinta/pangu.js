import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol _', () => {
  it('handle _ symbol as separator', () => {
    expect(pangu.spaceText('前面_後面')).toBe('前面_後面');
    expect(pangu.spaceText('Vinta_Mollie')).toBe('Vinta_Mollie');
    expect(pangu.spaceText('Vinta_Mollie_Kitten')).toBe('Vinta_Mollie_Kitten');
    expect(pangu.spaceText('Mollie_陳上進')).toBe('Mollie_陳上進');
    expect(pangu.spaceText('陳上進_Mollie')).toBe('陳上進_Mollie');
    expect(pangu.spaceText('陳上進_貓咪_Mollie')).toBe('陳上進_貓咪_Mollie');
    expect(pangu.spaceText('陳上進_Mollie_貓咪')).toBe('陳上進_Mollie_貓咪');
    expect(pangu.spaceText('Mollie_Vinta_貓咪')).toBe('Mollie_Vinta_貓咪');
    expect(pangu.spaceText('Mollie_陳上進_貓咪')).toBe('Mollie_陳上進_貓咪');
    expect(pangu.spaceText('得到一個A_B的結果')).toBe('得到一個 A_B 的結果');

    // prettier-ignore
    expect(pangu.spaceText('為什麼你們就是不能加個空格呢？_20771210_最終版_v365.7.24.zip'))
                       .toBe('為什麼你們就是不能加個空格呢？_20771210_最終版_v365.7.24.zip');

    // Rare cases, ignore
    // expect(pangu.spaceText('前面 _ 後面')).toBe('前面 _ 後面');
    // expect(pangu.spaceText('Vinta _ Mollie')).toBe('Vinta _ Mollie');
    // expect(pangu.spaceText('Vinta _ Mollie _ Kitten')).toBe('Vinta _ Mollie _ Kitten');
    // expect(pangu.spaceText('陳上進 _ 貓咪 _ Mollie')).toBe('陳上進 _ 貓咪 _ Mollie');
    // expect(pangu.spaceText('陳上進 _ Mollie _ 貓咪')).toBe('陳上進 _ Mollie _ 貓咪');
    // expect(pangu.spaceText('Mollie _ Vinta _ 貓咪')).toBe('Mollie _ Vinta _ 貓咪');
    // expect(pangu.spaceText('Mollie _ 陳上進 _ 貓咪')).toBe('Mollie _ 陳上進 _ 貓咪');
  });
});
