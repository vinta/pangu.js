import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol +', () => {
  // When CJK touches the + directly
  it('handle + symbol as operator', () => {
    expect(pangu.spacingText('前面+後面')).toBe('前面 + 後面');
    expect(pangu.spacingText('Vinta+陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spacingText('陳上進+Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spacingText('你+我=我們')).toBe('你 + 我 = 我們');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 + 後面')).toBe('前面 + 後面');
    expect(pangu.spacingText('Vinta + Mollie')).toBe('Vinta + Mollie');
    expect(pangu.spacingText('Vinta + 陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spacingText('陳上進 + Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spacingText('得到一個 A + B 的結果')).toBe('得到一個 A + B 的結果');
  });

  // A plus with half-width characters on both sides binds them into one token,
  // spaced from CJK as a unit and never split
  it('handle + symbol as plus token', () => {
    expect(pangu.spacingText('Vinta+Mollie')).toBe('Vinta+Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('得到一個A+B的結果')).toBe('得到一個 A+B 的結果');
    expect(pangu.spacingText('答案是5+5的和')).toBe('答案是 5+5 的和');
  });

  it('handle + symbol as special case', () => {
    expect(pangu.spacingText('得到一個A+的結果')).toBe('得到一個 A+ 的結果');
    expect(pangu.spacingText('得到一個 A+ 的結果')).toBe('得到一個 A+ 的結果');
    expect(pangu.spacingText('得到一個C++的結果')).toBe('得到一個 C++ 的結果');
    expect(pangu.spacingText('得到一個 C++的結果')).toBe('得到一個 C++ 的結果');
    expect(pangu.spacingText('得到一個i++的結果')).toBe('得到一個 i++ 的結果');
    expect(pangu.spacingText('成績是A+的等級')).toBe('成績是 A+ 的等級');
    expect(pangu.spacingText('我會寫C++的程式')).toBe('我會寫 C++ 的程式');

    expect(pangu.spacingText('打+886這個號碼')).toBe('打 +886 這個號碼');
    expect(pangu.spacingText('氣溫是+5度左右')).toBe('氣溫是 +5 度左右');

    // FIXME: attach + to the preceding word (brand suffix)
    // (needs a rule that keeps Vinta+陳上進 as operator)
    // expect(pangu.spacingText('Disney+上架了新片')).toBe('Disney+ 上架了新片');
  });
});
