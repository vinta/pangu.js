import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol *', () => {
  it('handle * symbol as operator', () => {
    expect(pangu.spaceText('前面*後面')).toBe('前面 * 後面');
    expect(pangu.spaceText('Vinta*陳上進')).toBe('Vinta * 陳上進');
    expect(pangu.spaceText('陳上進*Vinta')).toBe('陳上進 * Vinta');
    expect(pangu.spaceText('標示*的欄位代表必填')).toBe('標示 * 的欄位代表必填');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 * 後面')).toBe('前面 * 後面');
    expect(pangu.spaceText('Vinta * Mollie')).toBe('Vinta * Mollie');
    expect(pangu.spaceText('Vinta * 陳上進')).toBe('Vinta * 陳上進');
    expect(pangu.spaceText('陳上進 * Vinta')).toBe('陳上進 * Vinta');
    expect(pangu.spaceText('得到一個 A * B 的結果')).toBe('得到一個 A * B 的結果');
  });

  it('handle * symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta*Mollie')).toBe('Vinta*Mollie'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A*B的結果')).toBe('得到一個 A*B 的結果');
    expect(pangu.spaceText('算式是2*3的積')).toBe('算式是 2*3 的積');
  });

  it('handle * symbol as preserved pattern', () => {
    expect(pangu.spaceText('刪掉*.log的檔案')).toBe('刪掉 *.log 的檔案');
  });
});
