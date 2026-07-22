import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol , only add space on the right', () => {
  it('handle , symbol', () => {
    expect(pangu.spacingText('前面,後面')).toBe('前面, 後面');

    expect(pangu.spacingText('精采5G購機方案(30個月),月繳599元購機優惠(30個月)')).toBe('精采 5G 購機方案 (30 個月), 月繳 599 元購機優惠 (30 個月)');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 , 後面')).toBe('前面 , 後面');
    expect(pangu.spacingText('前面, 後面')).toBe('前面, 後面');
    expect(pangu.spacingText('前面 ,後面')).toBe('前面 ,後面');
  });
});
