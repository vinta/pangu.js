import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol ; 只加右空格', () => {
  it('handle ; symbol', () => {
    expect(pangu.spacingText('前面;後面')).toBe('前面; 後面');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 ; 後面')).toBe('前面 ; 後面');
    expect(pangu.spacingText('前面; 後面')).toBe('前面; 後面');
    expect(pangu.spacingText('前面 ;後面')).toBe('前面 ;後面');
  });
});
