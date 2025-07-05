import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol ? 只加右空格', () => {
  it('handle ? symbol', () => {
    expect(pangu.spacingText('前面?')).toBe('前面?');
    expect(pangu.spacingText('前面??')).toBe('前面??');
    expect(pangu.spacingText('前面???')).toBe('前面???');
    expect(pangu.spacingText('前面?後面')).toBe('前面? 後面');
    expect(pangu.spacingText('前面??後面')).toBe('前面?? 後面');
    expect(pangu.spacingText('前面???後面')).toBe('前面??? 後面');
    expect(pangu.spacingText('前面?abc')).toBe('前面? abc');
    expect(pangu.spacingText('前面?123')).toBe('前面? 123');
    expect(pangu.spacingText('所以,請問Jackey的鼻子有幾個?3.14個')).toBe('所以, 請問 Jackey 的鼻子有幾個? 3.14 個');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 ? 後面')).toBe('前面 ? 後面');
    expect(pangu.spacingText('前面? 後面')).toBe('前面? 後面');
    expect(pangu.spacingText('前面 ?後面')).toBe('前面 ?後面');
  });
});
