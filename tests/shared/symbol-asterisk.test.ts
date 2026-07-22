import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol *', () => {
  // When CJK touches the * directly
  it('handle * symbol as operator', () => {
    expect(pangu.spacingText('前面*後面')).toBe('前面 * 後面');
    expect(pangu.spacingText('Vinta*陳上進')).toBe('Vinta * 陳上進');
    expect(pangu.spacingText('陳上進*Vinta')).toBe('陳上進 * Vinta');
    expect(pangu.spacingText('標示*的欄位代表必填')).toBe('標示 * 的欄位代表必填');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 * 後面')).toBe('前面 * 後面');
    expect(pangu.spacingText('Vinta * Mollie')).toBe('Vinta * Mollie');
    expect(pangu.spacingText('Vinta * 陳上進')).toBe('Vinta * 陳上進');
    expect(pangu.spacingText('陳上進 * Vinta')).toBe('陳上進 * Vinta');
    expect(pangu.spacingText('得到一個 A * B 的結果')).toBe('得到一個 A * B 的結果');
  });

  // An asterisk with half-width characters on both sides binds them into one token,
  // spaced from CJK as a unit and never split
  it('handle * symbol as asterisk token', () => {
    expect(pangu.spacingText('Vinta*Mollie')).toBe('Vinta*Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('得到一個A*B的結果')).toBe('得到一個 A*B 的結果');
    expect(pangu.spacingText('算式是2*3的積')).toBe('算式是 2*3 的積');
  });

  it('handle * symbol as special case', () => {
    expect(pangu.spacingText('刪掉*.log的檔案')).toBe('刪掉 *.log 的檔案');
    expect(pangu.spacingText('這是5*的飯店')).toBe('這是 5* 的飯店');
  });
});
