import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

// \u00a0
describe('Symbol &nbsp; replace with half-width space', () => {
  it('handle solitary &nbsp;, replace', () => {
    expect(pangu.spacingText('我們說We\u00a0invited')).toBe('我們說 We invited');
    expect(pangu.spacingText('第\u00a05\u00a0章')).toBe('第 5 章');
  });

  it('handle solitary &nbsp; adjacent to a half-width space, replace', () => {
    expect(pangu.spacingText('或\u00a0 "We invited"')).toBe('或 "We invited"');
  });

  it('handle consecutive &nbsp;, preserve', () => {
    // Runs of 2+ &nbsp;s are deliberate formatting (e.g. paragraph indentation)
    expect(pangu.spacingText('中文\u00a0\u00a0\u00a0\u00a0中文')).toBe('中文\u00a0\u00a0\u00a0\u00a0中文');
  });

  it('handle &nbsp; adjacent to other whitespace, preserve', () => {
    expect(pangu.spacingText('中文\u00a0\n中文')).toBe('中文\u00a0\n中文');
  });

  it('handle &nbsp; at string boundaries, preserve', () => {
    expect(pangu.spacingText('\u00a0中文abc')).toBe('\u00a0中文 abc');
    expect(pangu.spacingText('中文abc\u00a0')).toBe('中文 abc\u00a0');
  });
});
