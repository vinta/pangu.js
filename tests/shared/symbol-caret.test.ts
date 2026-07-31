import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ^', () => {
  // When the symbol appears only 1 time or shows up with other operators in one line
  it('handle ^ symbol as operator, ALWAYS spacing', () => {
    expect(pangu.spacingText('前面^後面')).toBe('前面 ^ 後面');
    expect(pangu.spacingText('前面 ^ 後面')).toBe('前面 ^ 後面');
  });
});
