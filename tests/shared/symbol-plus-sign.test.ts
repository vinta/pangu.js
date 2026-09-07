import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol +', () => {
  it('handle + symbol as operator', () => {
    expect(pangu.spacingText('前面+後面')).toBe('前面 + 後面');
    expect(pangu.spacingText('陳上進+Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spacingText('你+我=我們')).toBe('你 + 我 = 我們');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 + 後面')).toBe('前面 + 後面');
    expect(pangu.spacingText('Vinta + Mollie')).toBe('Vinta + Mollie');
    expect(pangu.spacingText('Vinta + 陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spacingText('陳上進 + Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spacingText('得到一個 A + B 的結果')).toBe('得到一個 A + B 的結果');

    // Rare cases, ignore
    // expect(pangu.spacingText('Vinta+陳上進')).toBe('Vinta + 陳上進');
  });

  it('handle + symbol as separator', () => {
    // Two or more pluses in CJK contact read the line as a bundle plan, so the plus after a word is a separator, not a suffix
    expect(pangu.spacingText('MOD+影劇館+上架')).toBe('MOD + 影劇館 + 上架');
    expect(pangu.spacingText('Switch OLED+健身環+保護貼')).toBe('Switch OLED + 健身環 + 保護貼');
    expect(pangu.spacingText('HiNet光世代+MOD+影劇館+/全選/自選20/特選餐/豪華餐(5選1)+Wi-Fi全屋通(1台)')).toBe(
      'HiNet 光世代 + MOD + 影劇館 + /全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)',
    );

    // One plus in CJK contact keeps the suffix reading: an enumeration plus touches punctuation, a ++ run never counts, a joiner token has no contact
    expect(pangu.spacingText('Netflix、Disney+、Apple TV+等串流平台')).toBe('Netflix、Disney+、Apple TV+ 等串流平台');
    expect(pangu.spacingText('Disney+上架了C++課程')).toBe('Disney+ 上架了 C++ 課程');
    expect(pangu.spacingText('Disney+上架了A+B')).toBe('Disney+ 上架了 A+B');

    // NOTE: not expected, but cannot fix with rules, see below
    expect(pangu.spacingText('Disney+和Apple TV+都上架了')).toBe('Disney + 和 Apple TV + 都上架了');

    // NOTE: fixed by AI spacing, see browser-extensions/chrome/src/ai-spacing/shapes/brand-suffix-shape.ts
    // expect(pangu.spacingText('Disney+和Apple TV+都上架了')).toBe('Disney+ 和 Apple TV+ 都上架了');
    // expect(pangu.spacingText('HiNet光世代+MOD+影劇館+/全選/自選20/特選餐/豪華餐(5選1)+Wi-Fi全屋通(1台)')).toBe('HiNet 光世代 + MOD + 影劇館+/全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)');
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

    // Suffix after ANS
    expect(pangu.spacingText('有100+的選擇')).toBe('有 100+ 的選擇');
    expect(pangu.spacingText('這裡有18+的內容')).toBe('這裡有 18+ 的內容');
    expect(pangu.spacingText('Disney+上架了新片')).toBe('Disney+ 上架了新片');
    expect(pangu.spacingText('Apple TV+上架了新片')).toBe('Apple TV+ 上架了新片');

    // NOTE: not expected, but cannot fix with rules, see below
    expect(pangu.spacingText('公視+上架了新片')).toBe('公視 + 上架了新片');
    expect(pangu.spacingText('MOD影劇館+上架了新片')).toBe('MOD 影劇館 + 上架了新片');

    // NOTE: fixed by AI spacing, see browser-extensions/chrome/src/ai-spacing/shapes/brand-suffix-shape.ts
    // expect(pangu.spacingText('公視+上架了新片')).toBe('公視+ 上架了新片');
    // expect(pangu.spacingText('MOD影劇館+上架了新片')).toBe('MOD 影劇館+ 上架了新片');
    // expect(pangu.spacingText('【速在必行方案】HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)')).toBe('【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館+ (300M/300M)');
  });
});
