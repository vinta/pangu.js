import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

// \u00b7
describe('Symbol ·', () => {
  it('handle · symbol', () => {
    expect(pangu.spaceText('前面·後面')).toBe('前面・後面');
    expect(pangu.spaceText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spaceText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
  });
});

// \u2022
describe('Symbol •', () => {
  it('handle • symbol', () => {
    expect(pangu.spaceText('前面•後面')).toBe('前面・後面');
    expect(pangu.spaceText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spaceText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
  });

  it('should not convert consecutive • symbols', () => {
    expect(pangu.spaceText('國泰CUBE卡 •••• 1234')).toBe('國泰 CUBE 卡 •••• 1234');
    expect(pangu.spaceText('ether.fi Cash Card •••• 5678')).toBe('ether.fi Cash Card •••• 5678');
  });
});

// \u2027
describe('Symbol ‧', () => {
  it('handle ‧ symbol', () => {
    expect(pangu.spaceText('前面‧後面')).toBe('前面・後面');
    expect(pangu.spaceText('喬治‧R‧R‧馬丁')).toBe('喬治・R・R・馬丁');
    expect(pangu.spaceText('M‧奈特‧沙马兰')).toBe('M・奈特・沙马兰');
  });
});
