import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol >', () => {
  it('handle > symbol as operator', () => {
    expect(pangu.spaceText('前面>後面')).toBe('前面 > 後面');
    expect(pangu.spaceText('Vinta>陳上進')).toBe('Vinta > 陳上進');
    expect(pangu.spaceText('陳上進>Vinta')).toBe('陳上進 > Vinta');
    expect(pangu.spaceText('溫度>30就開冷氣')).toBe('溫度 > 30 就開冷氣');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 > 後面')).toBe('前面 > 後面');
    expect(pangu.spaceText('Vinta > Abc123')).toBe('Vinta > Abc123');
    expect(pangu.spaceText('Vinta > 陳上進')).toBe('Vinta > 陳上進');
    expect(pangu.spaceText('陳上進 > Vinta')).toBe('陳上進 > Vinta');
    expect(pangu.spaceText('得到一個 A > B 的結果')).toBe('得到一個 A > B 的結果');
  });

  it('handle > symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta>Abc123')).toBe('Vinta>Abc123'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A>B的結果')).toBe('得到一個 A>B 的結果');
  });

  it('handle > symbol as preserved pattern', () => {
    expect(pangu.spaceText('流程是A->B的方向')).toBe('流程是 A->B 的方向');
  });
});
