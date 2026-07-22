import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol ! only add space on the right', () => {
  it('handle ! symbol', () => {
    expect(pangu.spacingText('前面!')).toBe('前面!');
    expect(pangu.spacingText('前面!!')).toBe('前面!!');
    expect(pangu.spacingText('前面!!!')).toBe('前面!!!');
    expect(pangu.spacingText('前面!後面')).toBe('前面! 後面');
    expect(pangu.spacingText('前面!!後面')).toBe('前面!! 後面');
    expect(pangu.spacingText('前面!!!後面')).toBe('前面!!! 後面');
    expect(pangu.spacingText('前面!abc')).toBe('前面! abc');
    expect(pangu.spacingText('前面!123')).toBe('前面! 123');
    expect(pangu.spacingText('前面2!的階乘')).toBe('前面 2! 的階乘');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 ! 後面')).toBe('前面 ! 後面');
    expect(pangu.spacingText('前面! 後面')).toBe('前面! 後面');
    expect(pangu.spacingText('前面 !後面')).toBe('前面 !後面');
  });
});
