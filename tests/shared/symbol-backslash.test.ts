import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol \\', () => {
  it('handle \\ symbol', () => {
    expect(pangu.spacingText('前面\\後面')).toBe('前面 \\ 後面');
    expect(pangu.spacingText('前面 \\ 後面')).toBe('前面 \\ 後面');
  });

  it('handle \\ symbol as escape character', () => {
    expect(pangu.spacingText('\\n')).toBe('\\n');
    expect(pangu.spacingText('\\t')).toBe('\\t');
  });

  it('handle \\ symbol as Windows file path', () => {
    expect(pangu.spacingText('檔案在C:\\Users\\name\\')).toBe('檔案在 C:\\Users\\name\\');
    expect(pangu.spacingText('程式在D:\\Program Files\\')).toBe('程式在 D:\\Program Files\\');
    expect(pangu.spacingText('在C:\\Windows\\System32')).toBe('在 C:\\Windows\\System32');
  });
});
