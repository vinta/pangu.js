import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol +', () => {
  it('handle + symbol as operator', () => {
    expect(pangu.spacingText('前面+後面')).toBe('前面 + 後面');
    expect(pangu.spacingText('陳上進+Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spacingText('Vinta+陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spacingText('你+我=我們')).toBe('你 + 我 = 我們');
    expect(pangu.spacingText('Switch+健身環套組')).toBe('Switch + 健身環套組');
    expect(pangu.spacingText('AI+製造')).toBe('AI + 製造');
    expect(pangu.spacingText('Galaxy S24+上市')).toBe('Galaxy S24 + 上市');
    expect(pangu.spacingText('MacBook Air M2+滑鼠組合')).toBe('MacBook Air M2 + 滑鼠組合');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 + 後面')).toBe('前面 + 後面');
    expect(pangu.spacingText('Vinta + Mollie')).toBe('Vinta + Mollie');
    expect(pangu.spacingText('Vinta + 陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spacingText('陳上進 + Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spacingText('得到一個 A + B 的結果')).toBe('得到一個 A + B 的結果');

    // NOTE: not expected, cannot fix with rules: a digit token before the plus has the same shape as Python 3+, only the sentence decides
    // see the open item in docs/adr/0019

    expect(pangu.spacingText('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2+ 瑪利歐賽車世界同捆組');
    // expect(pangu.spacingText('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2 + 瑪利歐賽車世界同捆組');
  });

  it('handle + symbol as separator', () => {
    // A plus after a word in CJK contact is undecided by any affix, so plus reading spaces it as a separator, in a bundle plan and on a brand line alike
    expect(pangu.spacingText('MOD+影劇館+上架')).toBe('MOD + 影劇館 + 上架');
    expect(pangu.spacingText('Switch OLED+健身環+保護貼')).toBe('Switch OLED + 健身環 + 保護貼');
    expect(pangu.spacingText('Disney+上架了C++課程')).toBe('Disney + 上架了 C++ 課程');
    expect(pangu.spacingText('Disney+上架了A+B')).toBe('Disney + 上架了 A + B');

    // Plus reading runs before the operator rules, so a CJK+A contact flips the line's later joiners too; a line with no contact keeps them
    expect(pangu.spacingText('HiNet光世代+MOD+Wi-Fi全屋通')).toBe('HiNet 光世代 + MOD + Wi-Fi 全屋通');
    expect(pangu.spacingText('陳上進+Vinta+Mollie')).toBe('陳上進 + Vinta + Mollie');
    expect(pangu.spacingText('套餐含MOD+Netflix+Disney')).toBe('套餐含 MOD+Netflix+Disney');

    // NOTE: not expected, cannot fix with rules, but fixed by AI spacing
    // see browser-extensions/chrome/src/ai-spacing/shapes/name-suffix-shape.ts

    expect(pangu.spacingText('Netflix、Disney+、Apple TV+等串流平台')).toBe('Netflix、Disney + 、Apple TV + 等串流平台');
    // expect(pangu.spacingText('Netflix、Disney+、Apple TV+等串流平台')).toBe('Netflix、Disney+、Apple TV+ 等串流平台');

    // prettier-ignore
    expect(pangu.spacingText('HiNet光世代+MOD+影劇館+/全選/自選20/特選餐/豪華餐(5選1)+Wi-Fi全屋通(1台)'))
                       .toBe('HiNet 光世代 + MOD + 影劇館 + /全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)');
    // expect(pangu.spacingText('HiNet光世代+MOD+影劇館+/全選/自選20/特選餐/豪華餐(5選1)+Wi-Fi全屋通(1台)'))
    //                    .toBe('HiNet 光世代 + MOD + 影劇館+/全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)');

    // prettier-ignore
    expect(pangu.spacingText('【速在必行方案】HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)'))
                          .toBe('【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館 + (300M/300M)');
    // expect(pangu.spacingText('【速在必行方案】HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)'))
    //                    .toBe('【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館+ (300M/300M)');
  });

  it('handle + symbol as joiner token', () => {
    expect(pangu.spacingText('Vinta+Mollie')).toBe('Vinta+Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('得到一個A+B的結果')).toBe('得到一個 A+B 的結果');
    expect(pangu.spacingText('答案是5+5的和')).toBe('答案是 5+5 的和');
  });

  it('handle + symbol as preserved pattern', () => {
    expect(pangu.spacingText('得到一個C++的結果')).toBe('得到一個 C++ 的結果');
    expect(pangu.spacingText('得到一個 C++的結果')).toBe('得到一個 C++ 的結果');
    expect(pangu.spacingText('得到一個i++的結果')).toBe('得到一個 i++ 的結果');
    expect(pangu.spacingText('我會寫C++的程式')).toBe('我會寫 C++ 的程式');
  });

  it('handle + symbol as affix', () => {
    // Grades
    expect(pangu.spacingText('得到一個A+的結果')).toBe('得到一個 A+ 的結果');
    expect(pangu.spacingText('得到一個 A+ 的結果')).toBe('得到一個 A+ 的結果');
    expect(pangu.spacingText('成績是A+的等級')).toBe('成績是 A+ 的等級');

    // Sign before digits
    expect(pangu.spacingText('打+886這個號碼')).toBe('打 +886 這個號碼');
    expect(pangu.spacingText('氣溫是+5度左右')).toBe('氣溫是 +5 度左右');

    // Suffix after a digit run
    expect(pangu.spacingText('有100+的選擇')).toBe('有 100+ 的選擇');
    expect(pangu.spacingText('這裡有18+的內容')).toBe('這裡有 18+ 的內容');
    expect(pangu.spacingText('評分3.5+的餐廳')).toBe('評分 3.5+ 的餐廳');
    expect(pangu.spacingText('Python 3+的版本')).toBe('Python 3+ 的版本');

    // NOTE: not expected, cannot fix with rules, but fixed by AI spacing
    // see browser-extensions/chrome/src/ai-spacing/shapes/name-suffix-shape.ts

    expect(pangu.spacingText('Disney+上架了新片')).toBe('Disney + 上架了新片');
    // expect(pangu.spacingText('Disney+上架了新片')).toBe('Disney+ 上架了新片');

    expect(pangu.spacingText('Apple TV+上架了新片')).toBe('Apple TV + 上架了新片');
    // expect(pangu.spacingText('Apple TV+上架了新片')).toBe('Apple TV+ 上架了新片');

    expect(pangu.spacingText('Disney+和Apple TV+都上架了')).toBe('Disney + 和 Apple TV + 都上架了');
    // expect(pangu.spacingText('Disney+和Apple TV+都上架了')).toBe('Disney+ 和 Apple TV+ 都上架了');

    expect(pangu.spacingText('公視+上架了新片')).toBe('公視 + 上架了新片');
    // expect(pangu.spacingText('公視+上架了新片')).toBe('公視+ 上架了新片');

    expect(pangu.spacingText('MOD影劇館+上架了新片')).toBe('MOD 影劇館 + 上架了新片');
    // expect(pangu.spacingText('MOD影劇館+上架了新片')).toBe('MOD 影劇館+ 上架了新片');
  });
});
