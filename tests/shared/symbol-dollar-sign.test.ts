import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol $', () => {
  it('handle $ symbol', () => {
    expect(pangu.spacingText('前面$後面')).toBe('前面 $ 後面');
    expect(pangu.spacingText('前面 $ 後面')).toBe('前面 $ 後面');
    expect(pangu.spacingText('前面$100後面')).toBe('前面 $100 後面');
  });
});
