import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol -', () => {
  // When the symbol appears only 1 time or shows up with other operators in one line
  it('handle - symbol as operator, ALWAYS spacing', () => {
    expect(pangu.spacingText('前面-後面')).toBe('前面 - 後面');
    expect(pangu.spacingText('Vinta-Mollie')).toBe('Vinta-Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('Vinta-陳上進')).toBe('Vinta - 陳上進');
    expect(pangu.spacingText('陳上進-Vinta')).toBe('陳上進 - Vinta');
    expect(pangu.spacingText('得到一個A-B的結果')).toBe('得到一個 A - B 的結果');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 - 後面')).toBe('前面 - 後面');
    expect(pangu.spacingText('Vinta - Mollie')).toBe('Vinta - Mollie');
    expect(pangu.spacingText('Vinta - 陳上進')).toBe('Vinta - 陳上進');
    expect(pangu.spacingText('陳上進 - Vinta')).toBe('陳上進 - Vinta');
    expect(pangu.spacingText('得到一個 A - B 的結果')).toBe('得到一個 A - B 的結果');
  });

  it('handle - symbol as hyphen/dash', () => {
    // Compound words
    expect(pangu.spacingText('Sci-Fi')).toBe('Sci-Fi');

    // prettier-ignore
    expect(pangu.spacingText('The company offered a state-of-the-art machine-learning-powered real-time fraud-detection system with end-to-end encryption and cutting-edge performance.'))
                           .toBe('The company offered a state-of-the-art machine-learning-powered real-time fraud-detection system with end-to-end encryption and cutting-edge performance.');

    // prettier-ignore
    expect(pangu.spacingText('這間公司提供了一套state-of-the-art、machine-learning-powered的real-time fraud-detection系統，具備end-to-end加密功能以及cutting-edge的效能。'))
                           .toBe('這間公司提供了一套 state-of-the-art、machine-learning-powered 的 real-time fraud-detection 系統，具備 end-to-end 加密功能以及 cutting-edge 的效能。');

    expect(pangu.spacingText('Anthropic的claude-4-opus模型')).toBe('Anthropic 的 claude-4-opus 模型');
    expect(pangu.spacingText('OpenAI的o3-pro模型')).toBe('OpenAI 的 o3-pro 模型');
    expect(pangu.spacingText('OpenAI的gpt-4o模型')).toBe('OpenAI 的 gpt-4o 模型');
    expect(pangu.spacingText('OpenAI的GPT-5模型')).toBe('OpenAI 的 GPT-5 模型');
    expect(pangu.spacingText('Google的gemini-2.5-pro模型')).toBe('Google 的 gemini-2.5-pro 模型');

    expect(pangu.spacingText('得到一個D-的結果')).toBe('得到一個 D- 的結果');
    expect(pangu.spacingText('得到一個D--的結果')).toBe('得到一個 D-- 的結果');

    // prettier-ignore
    expect(pangu.spacingText('长者的智慧和复杂的维斯特洛- 文章')).toBe('长者的智慧和复杂的维斯特洛 - 文章');

    // TODO: TDB
    // expect(pangu.spacingText('陳上進--Vinta')).toBe('陳上進 -- Vinta');
    // expect(pangu.spacingText('陳上進---Vinta')).toBe('陳上進 --- Vinta');
  });
});
