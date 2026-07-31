import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

//
describe('Symbol &nbsp; suppresses spacing, always preserve', () => {
  it('handle solitary &nbsp;, preserve', () => {
    // The &nbsp; already separates the runs it sits between, so only the genuinely missing 說|We junction gets a space
    expect(pangu.spacingText('我們說We\u00a0invited')).toBe('我們說 We\u00a0invited');
    expect(pangu.spacingText('第\u00a05\u00a0章')).toBe('第\u00a05\u00a0章');
  });

  it('handle solitary &nbsp; adjacent to a half-width space, preserve', () => {
    // A doubled gap the author wrote. CSS collapses two half-width spaces but never collapses &nbsp; + space, so this paints wider than one space.
    // Dropping either character would be a rewrite, so both stay
    expect(pangu.spacingText('或\u00a0 "We invited"')).toBe('或\u00a0 "We invited"');
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

  it('handle &nbsp; separating a hashtag from CJK, preserve', () => {
    // The hashtag guard has to read an &nbsp; as the gap it is, otherwise the # reads as glued to 台北 and gets split off
    expect(pangu.spacingText('台北\u00a0#中文')).toBe('台北\u00a0#中文');
    expect(pangu.spacingText('中文#\u00a0abc')).toBe('中文#\u00a0abc');
  });
});
