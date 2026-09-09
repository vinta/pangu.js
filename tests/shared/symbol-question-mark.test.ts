import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ?', () => {
  it('handle ? symbol', () => {
    expect(pangu.spaceText('前面?')).toBe('前面?');
    expect(pangu.spaceText('前面??')).toBe('前面??');
    expect(pangu.spaceText('前面???')).toBe('前面???');
    expect(pangu.spaceText('前面?後面')).toBe('前面? 後面');
    expect(pangu.spaceText('前面??後面')).toBe('前面?? 後面');
    expect(pangu.spaceText('前面???後面')).toBe('前面??? 後面');
    expect(pangu.spaceText('前面?abc')).toBe('前面? abc');
    expect(pangu.spaceText('前面?123')).toBe('前面? 123');
    expect(pangu.spaceText('所以,請問Jackey的鼻子有幾個?3.14個')).toBe('所以, 請問 Jackey 的鼻子有幾個? 3.14 個');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 ? 後面')).toBe('前面 ? 後面');
    expect(pangu.spaceText('前面? 後面')).toBe('前面? 後面');

    // Rare cases, ignore
    // expect(pangu.spaceText('前面 ?後面')).toBe('前面 ?後面');
  });
});
