import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol @', () => {
  it('handle @ symbol as at', () => {
    expect(pangu.spaceText('前面@vinta後面')).toBe('前面 @vinta 後面');
    expect(pangu.spaceText('前面@vinta_chen後面')).toBe('前面 @vinta_chen 後面');
    expect(pangu.spaceText('前面@VintaChen後面')).toBe('前面 @VintaChen 後面');
    expect(pangu.spaceText('前面@陳上進 後面')).toBe('前面 @陳上進 後面');
  });
});
