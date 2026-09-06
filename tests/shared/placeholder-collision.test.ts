import { describe, expect, it } from 'vitest';
import { pangu } from '../../dist/shared/index.js';

describe('Literal placeholder text', () => {
  it.each([
    ['`+`', '\uE004BACKTICK_CONTENT_', '\uE005'],
    ['<br>', '\uE000HTML_TAG_PLACEHOLDER_', '\uE001'],
    ['<div>', '\uE002HTML_TAG_MENTION_', '\uE003'],
    ["'中文'", '\uE030SINGLE_QUOTE_CJK_PLACEHOLDER_', '\uE031'],
    ['GPT-5', '\uE010COMPOUND_WORD_PLACEHOLDER_', '\uE011'],
  ])('preserve literal markers alongside %s', (content, prefix, suffix) => {
    const markers = ['0', '1', '00', '9999'].map((index) => `${prefix}${index}${suffix}`).join(' ');
    const text = `中文 ${content} ${markers}`;
    expect(pangu.spacingText(text)).toBe(text);
  });

  it('preserve markers inside HTML attributes and backticks', () => {
    const text = '<a title="\uE004BACKTICK_CONTENT_0\uE005 中文">`\uE000HTML_TAG_PLACEHOLDER_0\uE001`</a>';
    expect(pangu.spacingText(text)).toBe(text);
  });
});
