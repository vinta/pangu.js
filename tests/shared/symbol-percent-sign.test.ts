import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol %', () => {
  it('handle % symbol', () => {
    expect(pangu.spacingText('前面%後面')).toBe('前面 % 後面');
    expect(pangu.spacingText('前面 % 後面')).toBe('前面 % 後面');
    expect(pangu.spacingText('前面100%後面')).toBe('前面 100% 後面');

    // prettier-ignore
    expect(pangu.spacingText('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾'))
                       .toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');

    // prettier-ignore
    expect(pangu.spacingText("丹寧控注意Levi's全館任2件25%OFF滿額再享85折！"))
                       .toBe("丹寧控注意 Levi's 全館任 2 件 25% OFF 滿額再享 85 折！");
  });
});
