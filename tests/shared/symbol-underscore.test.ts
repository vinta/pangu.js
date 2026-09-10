import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol _', () => {
  it('handle _ symbol as separator', () => {
    expect(pangu.spaceText('前面_後面')).toBe('前面_後面');
    expect(pangu.spaceText('Vinta_Abc123')).toBe('Vinta_Abc123');
    expect(pangu.spaceText('Vinta_Abc123_Kitten')).toBe('Vinta_Abc123_Kitten');
    expect(pangu.spaceText('Vinta_貓咪')).toBe('Vinta_貓咪');
    expect(pangu.spaceText('貓咪_Vinta')).toBe('貓咪_Vinta');
    expect(pangu.spaceText('陳上進_貓咪_Abc123')).toBe('陳上進_貓咪_Abc123');
    expect(pangu.spaceText('陳上進_Abc123_貓咪')).toBe('陳上進_Abc123_貓咪');
    expect(pangu.spaceText('Abc123_Vinta_貓咪')).toBe('Abc123_Vinta_貓咪');
    expect(pangu.spaceText('Abc123_陳上進_貓咪')).toBe('Abc123_陳上進_貓咪');
    expect(pangu.spaceText('得到一個A_B的結果')).toBe('得到一個 A_B 的結果');

    // prettier-ignore
    expect(pangu.spaceText('為什麼你們就是不能加個空格呢？_20771210_最終版_v365.7.24.zip'))
                     .toBe('為什麼你們就是不能加個空格呢？_20771210_最終版_v365.7.24.zip');

    // Rare cases, ignore
    // expect(pangu.spaceText('前面 _ 後面')).toBe('前面 _ 後面');
    // expect(pangu.spaceText('Vinta _ Abc123')).toBe('Vinta _ Abc123');
    // expect(pangu.spaceText('Vinta _ Abc123 _ Kitten')).toBe('Vinta _ Abc123 _ Kitten');
    // expect(pangu.spaceText('陳上進 _ 貓咪 _ Abc123')).toBe('陳上進 _ 貓咪 _ Abc123');
    // expect(pangu.spaceText('陳上進 _ Abc123 _ 貓咪')).toBe('陳上進 _ Abc123 _ 貓咪');
    // expect(pangu.spaceText('Abc123 _ Vinta _ 貓咪')).toBe('Abc123 _ Vinta _ 貓咪');
    // expect(pangu.spaceText('Abc123 _ 陳上進 _ 貓咪')).toBe('Abc123 _ 陳上進 _ 貓咪');
  });
});
