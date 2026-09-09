import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ,', () => {
  it('handle , symbol', () => {
    expect(pangu.spaceText('前面,後面')).toBe('前面, 後面');

    expect(pangu.spaceText('"你好",她說')).toBe('"你好", 她說');
    expect(pangu.spaceText('每月只要1,000元')).toBe('每月只要 1,000 元');
    expect(pangu.spaceText('精采5G購機方案(30個月),月繳599元購機優惠(30個月)')).toBe('精采 5G 購機方案 (30 個月), 月繳 599 元購機優惠 (30 個月)');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 , 後面')).toBe('前面 , 後面');
    expect(pangu.spaceText('前面, 後面')).toBe('前面, 後面');

    // Rare cases, ignore
    // expect(pangu.spaceText('前面 ,後面')).toBe('前面 ,後面');
  });
});
