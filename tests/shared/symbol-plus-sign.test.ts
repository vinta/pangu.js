import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol +', () => {
  it('handle + symbol as operator', () => {
    expect(pangu.spaceText('前面+後面')).toBe('前面 + 後面');
    expect(pangu.spaceText('陳上進+Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spaceText('Vinta+陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spaceText('你+我=我們')).toBe('你 + 我 = 我們');
    expect(pangu.spaceText('Switch+健身環套組')).toBe('Switch + 健身環套組');
    expect(pangu.spaceText('MacBook Air M2+滑鼠組合')).toBe('MacBook Air M2 + 滑鼠組合');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 + 後面')).toBe('前面 + 後面');
    expect(pangu.spaceText('Vinta + Mollie')).toBe('Vinta + Mollie');
    expect(pangu.spaceText('Vinta + 陳上進')).toBe('Vinta + 陳上進');
    expect(pangu.spaceText('陳上進 + Vinta')).toBe('陳上進 + Vinta');
    expect(pangu.spaceText('得到一個 A + B 的結果')).toBe('得到一個 A + B 的結果');
  });

  it('handle + symbol as separator', () => {
    // A plus after a word in CJK contact is undecided by any affix, so plus reading spaces it as a separator, in a bundle plan and on a brand line alike
    expect(pangu.spaceText('Switch OLED+健身環+保護貼')).toBe('Switch OLED + 健身環 + 保護貼');

    // Plus reading runs before the operator rules, so a CJK+A contact flips the line's later joiners too; a line with no contact keeps them
    expect(pangu.spaceText('陳上進+Vinta+Mollie')).toBe('陳上進 + Vinta + Mollie');
    expect(pangu.spaceText('HiNet光世代+MOD+Wi-Fi全屋通')).toBe('HiNet 光世代 + MOD + Wi-Fi 全屋通');
    expect(pangu.spaceText('套餐含MOD+Netflix+Disney')).toBe('套餐含 MOD+Netflix+Disney');
    expect(pangu.spaceText('如何使用PTS+（公視+）註冊與觀看？')).toBe('如何使用 PTS+（公視+）註冊與觀看？');
    expect(pangu.spaceText('MOD+影劇館+上架')).toBe('MOD + 影劇館+ 上架');
    expect(pangu.spaceText('Disney+上架了C++課程')).toBe('Disney+ 上架了 C++ 課程');
    expect(pangu.spaceText('Disney+上架了A+B')).toBe('Disney+ 上架了 A + B');
    expect(pangu.spaceText('中+NotAB+|中文')).toBe('中 + NotAB + | 中文');
    expect(pangu.spaceText('Netflix、Disney+、Apple TV+等串流平台')).toBe('Netflix、Disney+、Apple TV+ 等串流平台');

    // prettier-ignore
    expect(pangu.spaceText('HiNet光世代+MOD+影劇館+/全選/自選20/特選餐/豪華餐(5選1)+Wi-Fi全屋通(1台)'))
                       .toBe('HiNet 光世代 + MOD + 影劇館+/全選/自選 20/特選餐/豪華餐 (5 選 1) + Wi-Fi 全屋通 (1 台)');

    // prettier-ignore
    expect(pangu.spaceText('【速在必行方案】HiNet光世代+Wi-Fi全屋通1台+MOD影劇館+(300M/300M)'))
                          .toBe('【速在必行方案】HiNet 光世代 + Wi-Fi 全屋通 1 台 + MOD 影劇館+ (300M/300M)');

    // On a line with two or more pluses, a plus after a closing bracket is a separator even before an opening full-width quote, which takes no space on its side; one plus stays tight
    // prettier-ignore
    expect(pangu.spaceText('HiNet光世代+MOD+自選餐(全選)+「影劇館+」'))
                       .toBe('HiNet 光世代 + MOD + 自選餐 (全選) +「影劇館+」');
  });

  // FIXME
  it.todo('handle + symbol as separator after a closing bracket on a single-plus line', () => {
    expect(pangu.spaceText('自選餐(全選)+「影劇館」')).toBe('自選餐 (全選) +「影劇館」');
  });

  // FIXME
  it.todo('handle + symbol as separator after a product name ending in a digit', () => {
    expect(pangu.spaceText('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2 + 瑪利歐賽車世界同捆組');
  });

  it('handle + symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta+Mollie')).toBe('Vinta+Mollie'); // If no CJK, DO NOT change
    expect(pangu.spaceText('前面A+B後面')).toBe('前面 A+B 後面');
    expect(pangu.spaceText('得到一個A+B的結果')).toBe('得到一個 A+B 的結果');
    expect(pangu.spaceText('答案是5+5的和')).toBe('答案是 5+5 的和');
  });

  it('handle + symbol as preserved pattern', () => {
    expect(pangu.spaceText('得到一個C++的結果')).toBe('得到一個 C++ 的結果');
    expect(pangu.spaceText('得到一個 C++的結果')).toBe('得到一個 C++ 的結果');
    expect(pangu.spaceText('得到一個i++的結果')).toBe('得到一個 i++ 的結果');
    expect(pangu.spaceText('我會寫C++的程式')).toBe('我會寫 C++ 的程式');
  });

  it('handle + symbol as affix', () => {
    // Grades
    expect(pangu.spaceText('得到一個A+的結果')).toBe('得到一個 A+ 的結果');
    expect(pangu.spaceText('得到一個 A+ 的結果')).toBe('得到一個 A+ 的結果');
    expect(pangu.spaceText('成績是A+的等級')).toBe('成績是 A+ 的等級');

    // Sign before digits
    expect(pangu.spaceText('打+886這個號碼')).toBe('打 +886 這個號碼');
    expect(pangu.spaceText('氣溫是+5度左右')).toBe('氣溫是 +5 度左右');

    // Suffix after a digit run
    expect(pangu.spaceText('有100+的選擇')).toBe('有 100+ 的選擇');
    expect(pangu.spaceText('這裡有18+的內容')).toBe('這裡有 18+ 的內容');
    expect(pangu.spaceText('評分3.5+的餐廳')).toBe('評分 3.5+ 的餐廳');
    expect(pangu.spaceText('Python 3+的版本')).toBe('Python 3+ 的版本');

    expect(pangu.spaceText('Disney+上架了新片')).toBe('Disney+ 上架了新片');
    expect(pangu.spaceText('Apple TV+上架了新片')).toBe('Apple TV+ 上架了新片');
    expect(pangu.spaceText('Disney+和Apple TV+都上架了')).toBe('Disney+ 和 Apple TV+ 都上架了');
    expect(pangu.spaceText('公視+上架了新片')).toBe('公視+ 上架了新片');
    expect(pangu.spaceText('MOD影劇館+上架了新片')).toBe('MOD 影劇館+ 上架了新片');
  });
});
