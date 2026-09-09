import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

// \u2014
describe.todo('Symbol —', () => {
  it('handle — symbol', () => {
    expect(pangu.spaceText('他說——不對')).toBe('他說 —— 不對');
    expect(pangu.spaceText('台灣——美麗之島')).toBe('台灣 —— 美麗之島');
    expect(pangu.spaceText('他說———不對')).toBe('他說 ——— 不對');
    expect(pangu.spaceText('他說 —— 不對')).toBe('他說 —— 不對');
  });

  // No CJK contact, no change
  it('keep — between ANS untouched', () => {
    expect(pangu.spaceText('A—B')).toBe('A—B');
    expect(pangu.spaceText('2020—2024年')).toBe('2020—2024 年');
  });
});

// \u2500
describe.todo('Symbol ─', () => {
  it('handle ─ symbol', () => {
    expect(pangu.spaceText('他說──不對')).toBe('他說 ── 不對');
    expect(pangu.spaceText('於是──各位觀眾')).toBe('於是 ── 各位觀眾');
    expect(pangu.spaceText('於是 ── 各位觀眾')).toBe('於是 ── 各位觀眾');
  });

  // No CJK contact, no change
  it('keep ─ between ANS untouched', () => {
    expect(pangu.spaceText('A─B')).toBe('A─B');
    expect(pangu.spaceText('2020──2024')).toBe('2020──2024');
  });
});
