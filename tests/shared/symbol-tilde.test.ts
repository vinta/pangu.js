import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ~', () => {
  it('handle ~ symbol', () => {
    expect(pangu.spaceText('前面~')).toBe('前面~');
    expect(pangu.spaceText('前面~~')).toBe('前面~~');
    expect(pangu.spaceText('前面~~~')).toBe('前面~~~');
    expect(pangu.spaceText('前面~後面')).toBe('前面~ 後面');
    expect(pangu.spaceText('前面~~後面')).toBe('前面~~ 後面');
    expect(pangu.spaceText('前面~~~後面')).toBe('前面~~~ 後面');
    expect(pangu.spaceText('前面~abc')).toBe('前面~ abc');
    expect(pangu.spaceText('前面~123')).toBe('前面~ 123');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 ~ 後面')).toBe('前面 ~ 後面');
    expect(pangu.spaceText('前面~ 後面')).toBe('前面~ 後面');
    expect(pangu.spaceText('前面 ~後面')).toBe('前面 ~後面');
  });

  it('handle ~ symbol as preserved pattern', () => {
    expect(pangu.spaceText('前面~=後面')).toBe('前面 ~= 後面');
    expect(pangu.spaceText('前面 ~= 後面')).toBe('前面 ~= 後面');
  });
});
