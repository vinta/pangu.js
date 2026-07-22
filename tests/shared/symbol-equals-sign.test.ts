import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol =', () => {
  // When CJK touches the = directly
  it('handle = symbol as operator', () => {
    expect(pangu.spacingText('前面=後面')).toBe('前面 = 後面');
    expect(pangu.spacingText('Vinta=陳上進')).toBe('Vinta = 陳上進');
    expect(pangu.spacingText('陳上進=Vinta')).toBe('陳上進 = Vinta');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 = 後面')).toBe('前面 = 後面');
    expect(pangu.spacingText('Vinta = Mollie')).toBe('Vinta = Mollie');
    expect(pangu.spacingText('Vinta = 陳上進')).toBe('Vinta = 陳上進');
    expect(pangu.spacingText('陳上進 = Vinta')).toBe('陳上進 = Vinta');
    expect(pangu.spacingText('得到一個 A = B 的結果')).toBe('得到一個 A = B 的結果');
  });

  // An equals sign with half-width characters on both sides binds them into one token,
  // spaced from CJK as a unit and never split
  it('handle = symbol as equals token', () => {
    expect(pangu.spacingText('Vinta=Mollie')).toBe('Vinta=Mollie'); // If no CJK, DO NOT change

    // FIXME
    // expect(pangu.spacingText('得到一個A=B的結果')).toBe('得到一個 A=B 的結果');
    // expect(pangu.spacingText('設定a=1之後執行')).toBe('設定 a=1 之後執行');
    // expect(pangu.spacingText('網址是example.com?foo=bar&baz=1的頁面')).toBe('網址是 example.com?foo=bar&baz=1 的頁面');
  });

  it('handle = symbol as special case', () => {
    expect(pangu.spacingText('用=>寫箭頭函式')).toBe('用 => 寫箭頭函式');
  });
});
