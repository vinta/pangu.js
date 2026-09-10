import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol -', () => {
  it('handle - symbol as operator', () => {
    expect(pangu.spaceText('前面-後面')).toBe('前面 - 後面');
    expect(pangu.spaceText('Vinta-陳上進')).toBe('Vinta - 陳上進');
    expect(pangu.spaceText('陳上進-Vinta')).toBe('陳上進 - Vinta');

    // prettier-ignore
    expect(pangu.spaceText('博客來-Rewire-神經可塑性：用神經科學突破行為模式迴圈，終結焦慮、恐慌和憂鬱，實現最佳的心理健康')).toBe('博客來 - Rewire - 神經可塑性：用神經科學突破行為模式迴圈，終結焦慮、恐慌和憂鬱，實現最佳的心理健康');
    expect(pangu.spaceText('博客來-經濟學原理 10/e Mankiw (授權經銷版)')).toBe('博客來 - 經濟學原理 10/e Mankiw (授權經銷版)');
    expect(pangu.spaceText('財政部電子發票整合服務平台[自然人憑證]-歸戶設定通知')).toBe('財政部電子發票整合服務平台 [自然人憑證] - 歸戶設定通知');
    expect(pangu.spaceText('博客來-4%法則：讓錢活得比你久的提領金律(電子書)')).toBe('博客來 - 4% 法則：讓錢活得比你久的提領金律 (電子書)');
    expect(pangu.spaceText('长者的智慧和复杂的维斯特洛- 文章')).toBe('长者的智慧和复杂的维斯特洛 - 文章');
    expect(pangu.spaceText('1976年-2018年')).toBe('1976 年 - 2018 年');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 - 後面')).toBe('前面 - 後面');
    expect(pangu.spaceText('Vinta - Abc123')).toBe('Vinta - Abc123');
    expect(pangu.spaceText('Vinta - 陳上進')).toBe('Vinta - 陳上進');
    expect(pangu.spaceText('陳上進 - Vinta')).toBe('陳上進 - Vinta');
    expect(pangu.spaceText('得到一個 A - B 的結果')).toBe('得到一個 A - B 的結果');
  });

  it('handle - symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta-Abc123')).toBe('Vinta-Abc123'); // If no CJK, DO NOT change
    expect(pangu.spaceText('得到一個A-B的結果')).toBe('得到一個 A-B 的結果');
    expect(pangu.spaceText('去5-A教室上課')).toBe('去 5-A 教室上課');
    expect(pangu.spaceText('搭2-A的公車')).toBe('搭 2-A 的公車');
    expect(pangu.spaceText('範圍是1-10的整數')).toBe('範圍是 1-10 的整數');
    expect(pangu.spaceText('用USB-C充電')).toBe('用 USB-C 充電');
    expect(pangu.spaceText('照X-RAY檢查')).toBe('照 X-RAY 檢查');

    // Hyphenated English names
    // prettier-ignore
    expect(pangu.spaceText('英文姓名須與護照上相同，包含標點符號；範例：王小明，英文名為WANG, HSIAO-MING，請於英文姓(Surname)欄位填入WANG,、英文名(Given Names)欄位填入HSIAO-MING。'))
                     .toBe('英文姓名須與護照上相同，包含標點符號；範例：王小明，英文名為 WANG, HSIAO-MING，請於英文姓 (Surname) 欄位填入 WANG,、英文名 (Given Names) 欄位填入 HSIAO-MING。');
  });

  it('handle - symbol as preserved pattern', () => {
    // Compound words
    expect(pangu.spaceText('Sci-Fi')).toBe('Sci-Fi');
    expect(pangu.spaceText('X-RAY')).toBe('X-RAY');
    expect(pangu.spaceText('USB Type-C')).toBe('USB Type-C');

    // prettier-ignore
    expect(pangu.spaceText('The company offered a state-of-the-art machine-learning-powered real-time fraud-detection system with end-to-end encryption and cutting-edge performance.'))
                     .toBe('The company offered a state-of-the-art machine-learning-powered real-time fraud-detection system with end-to-end encryption and cutting-edge performance.');

    // prettier-ignore
    expect(pangu.spaceText('這間公司提供了一套state-of-the-art、machine-learning-powered的real-time fraud-detection系統，具備end-to-end加密功能以及cutting-edge的效能。'))
                     .toBe('這間公司提供了一套 state-of-the-art、machine-learning-powered 的 real-time fraud-detection 系統，具備 end-to-end 加密功能以及 cutting-edge 的效能。');

    expect(pangu.spaceText('Anthropic的claude-4-opus模型')).toBe('Anthropic 的 claude-4-opus 模型');
    expect(pangu.spaceText('OpenAI的o3-pro模型')).toBe('OpenAI 的 o3-pro 模型');
    expect(pangu.spaceText('OpenAI的gpt-4o模型')).toBe('OpenAI 的 gpt-4o 模型');
    expect(pangu.spaceText('OpenAI的GPT-5模型')).toBe('OpenAI 的 GPT-5 模型');
    expect(pangu.spaceText('Google的gemini-2.5-pro模型')).toBe('Google 的 gemini-2.5-pro 模型');
  });

  it('handle - symbol as affix', () => {
    // CLI flags
    // prettier-ignore
    expect(pangu.spaceText('你可以使用uname -m指令來檢查你的Linux作業系統是32位元或是[敏感词已被屏蔽]位元'))
                     .toBe('你可以使用 uname -m 指令來檢查你的 Linux 作業系統是 32 位元或是 [敏感词已被屏蔽] 位元');
    expect(pangu.spaceText('參數要加-m的旗標')).toBe('參數要加 -m 的旗標');

    // Grades
    expect(pangu.spaceText('得到一個D-的結果')).toBe('得到一個 D- 的結果');
    expect(pangu.spaceText('得到一個D--的結果')).toBe('得到一個 D-- 的結果');

    // NOTE: fixed by AI spacing, see browser-extensions/chrome/src/ai-spacing/shapes/hyphen-shape.ts
    // The hyphen sign reading was dropped, CJK-N reads as an operator, see ADR 0015
    // expect(pangu.spaceText('氣溫是-5度左右')).toBe('氣溫是 -5 度左右');
    // expect(pangu.spaceText('Nasdaq-100本週下跌-13.44%')).toBe('Nasdaq-100 本週下跌 -13.44%');
  });
});
