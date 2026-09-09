import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol =', () => {
  it('handle = symbol as operator', () => {
    expect(pangu.spaceText('前面=後面')).toBe('前面 = 後面');
    expect(pangu.spaceText('Vinta=陳上進')).toBe('Vinta = 陳上進');
    expect(pangu.spaceText('陳上進=Vinta')).toBe('陳上進 = Vinta');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 = 後面')).toBe('前面 = 後面');
    expect(pangu.spaceText('Vinta = Mollie')).toBe('Vinta = Mollie');
    expect(pangu.spaceText('Vinta = 陳上進')).toBe('Vinta = 陳上進');
    expect(pangu.spaceText('陳上進 = Vinta')).toBe('陳上進 = Vinta');
    expect(pangu.spaceText('得到一個 A = B 的結果')).toBe('得到一個 A = B 的結果');
  });

  it('handle = symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta=Mollie')).toBe('Vinta=Mollie'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A=B的結果')).toBe('得到一個 A=B 的結果');
    expect(pangu.spaceText('設定a=1之後執行')).toBe('設定 a=1 之後執行');
    expect(pangu.spaceText('網址是example.com?foo=bar&baz=1的頁面')).toBe('網址是 example.com?foo=bar&baz=1 的頁面');
  });

  it('handle = symbol as preserved pattern', () => {
    expect(pangu.spaceText('用=>寫箭頭函式')).toBe('用 => 寫箭頭函式');
  });
});
