import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ・', () => {
  // \u00b7
  it('handle · symbol', () => {
    expect(pangu.spacingText('前面·後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2022
  it('handle • symbol', () => {
    expect(pangu.spacingText('前面•後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
  });

  // \u2027
  it('handle ‧ symbol', () => {
    expect(pangu.spacingText('前面‧後面')).toBe('前面・後面');
    expect(pangu.spacingText('喬治‧R‧R‧馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spacingText('M‧奈特‧沙马兰')).toBe('M・奈特・沙马兰');
  });
});
