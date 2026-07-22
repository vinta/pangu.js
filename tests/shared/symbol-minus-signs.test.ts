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
    expect(pangu.spacingText('X-RAY')).toBe('X-RAY');
    expect(pangu.spacingText('USB Type-C')).toBe('USB Type-C');

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

    // Hyphen between half-width characters is a word connector, not an operator
    // Only a hyphen in direct contact with CJK acts as an operator
    expect(pangu.spacingText('得到一個A-B的結果')).toBe('得到一個 A-B 的結果');
    expect(pangu.spacingText('去5-A教室上課')).toBe('去 5-A 教室上課');
    expect(pangu.spacingText('搭2-A的公車')).toBe('搭 2-A 的公車');
    expect(pangu.spacingText('範圍是1-10的整數')).toBe('範圍是 1-10 的整數');
    expect(pangu.spacingText('用USB-C充電')).toBe('用 USB-C 充電');
    expect(pangu.spacingText('照X-RAY檢查')).toBe('照 X-RAY 檢查');

    // Hyphenated English names
    // prettier-ignore
    expect(pangu.spacingText('英文姓名須與護照上相同，包含標點符號；範例：王小明，英文名為WANG,HSIAO-MING，請於英文姓(Surname)欄位填入WANG,、英文名(Given Names)欄位填入HSIAO-MING。'))
                       .toBe('英文姓名須與護照上相同，包含標點符號；範例：王小明，英文名為 WANG,HSIAO-MING，請於英文姓 (Surname) 欄位填入 WANG,、英文名 (Given Names) 欄位填入 HSIAO-MING。');

    // CLI flags
    // prettier-ignore
    expect(pangu.spacingText('你可以使用uname -m指令來檢查你的Linux作業系統是32位元或是[敏感词已被屏蔽]位元'))
                       .toBe('你可以使用 uname -m 指令來檢查你的 Linux 作業系統是 32 位元或是 [敏感词已被屏蔽] 位元');

    expect(pangu.spacingText('得到一個D-的結果')).toBe('得到一個 D- 的結果');
    expect(pangu.spacingText('得到一個D--的結果')).toBe('得到一個 D-- 的結果');

    // prettier-ignore
    expect(pangu.spacingText('长者的智慧和复杂的维斯特洛- 文章')).toBe('长者的智慧和复杂的维斯特洛 - 文章');

    expect(pangu.spacingText('氣溫是-5度左右')).toBe('氣溫是 -5 度左右');
    expect(pangu.spacingText('參數要加-m的旗標')).toBe('參數要加 -m 的旗標');

    // FIXME: a year range should read the hyphen as an operator, not as a sign attached to the second year
    // expect(pangu.spacingText('2016年-2018年')).toBe('2016 年 - 2018 年');

    // FIXME
    // expect(pangu.spacingText('陳上進--Vinta')).toBe('陳上進 -- Vinta');
    // expect(pangu.spacingText('陳上進---Vinta')).toBe('陳上進 --- Vinta');
  });
});
