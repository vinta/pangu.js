import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol \\', () => {
  it('handle \\ symbol', () => {
    expect(pangu.spaceText('前面\\後面')).toBe('前面 \\ 後面');
    expect(pangu.spaceText('前面 \\ 後面')).toBe('前面 \\ 後面');
  });

  it('handle \\ symbol as escape character', () => {
    expect(pangu.spaceText('\\n')).toBe('\\n');
    expect(pangu.spaceText('\\t')).toBe('\\t');
  });

  it('handle \\ symbol as Windows file path', () => {
    expect(pangu.spaceText('檔案在C:\\Users\\name\\')).toBe('檔案在 C:\\Users\\name\\');
    expect(pangu.spaceText('程式在D:\\Program Files\\')).toBe('程式在 D:\\Program Files\\');
    expect(pangu.spaceText('在C:\\Windows\\System32')).toBe('在 C:\\Windows\\System32');
  });
});
