import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol !', () => {
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

    expect(pangu.spacingText('你還在用Yahoo!奇摩？')).toBe('你還在用 Yahoo! 奇摩？');

    // prettier-ignore
    expect(pangu.spacingText('! git commit -a -m "蛤"'))
                       .toBe('! git commit -a -m "蛤"');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 ! 後面')).toBe('前面 ! 後面');
    expect(pangu.spacingText('前面! 後面')).toBe('前面! 後面');

    // Rare cases, ignore
    // expect(pangu.spacingText('前面 !後面')).toBe('前面 !後面');
  });
});
