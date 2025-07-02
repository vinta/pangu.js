import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol ` `', () => {
  it('handle ` ` symbols as quotes', () => {
    expect(pangu.spacingText('前面`中間`後面')).toBe('前面 `中間` 後面');
  });
});
