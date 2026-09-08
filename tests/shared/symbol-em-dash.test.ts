import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol —', () => {
  // — An em-dash is not a spaced half-width symbol, so it stays flush against CJK
  it('handle — symbol', () => {
    expect(pangu.spacingText('前面—後面')).toBe('前面—後面');
    expect(pangu.spacingText('他說——不對')).toBe('他說——不對');
  });
});
