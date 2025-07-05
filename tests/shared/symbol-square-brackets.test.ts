import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol [ ]', () => {
  it('handle [ ] symbols as square brackets', () => {
    expect(pangu.spacingText('前面[中文123漢字]後面')).toBe('前面 [中文 123 漢字] 後面');
    expect(pangu.spacingText('前面[中文123]後面')).toBe('前面 [中文 123] 後面');
    expect(pangu.spacingText('前面[123漢字]後面')).toBe('前面 [123 漢字] 後面');
    expect(pangu.spacingText('前面[中文123] tail')).toBe('前面 [中文 123] tail');
    expect(pangu.spacingText('head [中文123漢字]後面')).toBe('head [中文 123 漢字] 後面');
    expect(pangu.spacingText('head [中文123漢字] tail')).toBe('head [中文 123 漢字] tail');
  });
});
