import { describe, expect, it } from 'vitest';
import pangu, { CJK, pangu as namedPangu, Pangu } from '../../dist/shared/index.js';

describe('Shared ESM imports', () => {
  it('handle default ESM imports', () => {
    expect(pangu.spaceText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new Pangu();
    expect(anotherPangu.spaceText('Hello世界')).toBe('Hello 世界');
  });

  it('handle destructured ESM imports', () => {
    expect(namedPangu.spaceText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new Pangu();
    expect(anotherPangu.spaceText('Hello世界')).toBe('Hello 世界');
  });

  it('handle pattern imports', () => {
    expect(new RegExp(`[${CJK}]`).test('中文')).toBe(true);
  });
});
