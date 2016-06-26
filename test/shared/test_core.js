const assert = require('chai').assert;

const pangu = require('../../dist/shared/core');

describe('Pangu', () => {
  describe('spacing()', () => {
    it('處理 Latin-1 Supplement', () => {
      assert.equal(pangu.spacing('中文Ø漢字'), '中文 Ø 漢字');
      assert.equal(pangu.spacing('中文 Ø 漢字'), '中文 Ø 漢字');
    });

    it('處理 General Punctuation', () => {
      assert.equal(pangu.spacing('中文•漢字'), '中文 • 漢字');
      assert.equal(pangu.spacing('中文 • 漢字'), '中文 • 漢字');
    });

    it('處理 Number Forms', () => {
      assert.equal(pangu.spacing('中文Ⅶ漢字'), '中文 Ⅶ 漢字');
      assert.equal(pangu.spacing('中文 Ⅶ 漢字'), '中文 Ⅶ 漢字');
    });

    it('處理 CJK Radicals Supplement', () => {
      assert.equal(pangu.spacing('abc⻤123'), 'abc ⻤ 123');
      assert.equal(pangu.spacing('abc ⻤ 123'), 'abc ⻤ 123');
    });

    it('處理 Kangxi Radicals', () => {
      assert.equal(pangu.spacing('abc⾗123'), 'abc ⾗ 123');
      assert.equal(pangu.spacing('abc ⾗ 123'), 'abc ⾗ 123');
    });

    it('處理 Hiragana', () => {
      assert.equal(pangu.spacing('abcあ123'), 'abc あ 123');
      assert.equal(pangu.spacing('abc あ 123'), 'abc あ 123');
    });

    it('處理 Katakana', () => {
      assert.equal(pangu.spacing('abcア123'), 'abc ア 123');
      assert.equal(pangu.spacing('abc ア 123'), 'abc ア 123');
    });

    it('處理 Bopomofo', () => {
      assert.equal(pangu.spacing('abcㄅ123'), 'abc ㄅ 123');
      assert.equal(pangu.spacing('abc ㄅ 123'), 'abc ㄅ 123');
    });

    it('處理 Enclosed CJK Letters And Months', () => {
      assert.equal(pangu.spacing('abc㈱123'), 'abc ㈱ 123');
      assert.equal(pangu.spacing('abc ㈱ 123'), 'abc ㈱ 123');
    });

    it('處理 CJK Unified Ideographs Extension-A', () => {
      assert.equal(pangu.spacing('abc㐂123'), 'abc 㐂 123');
      assert.equal(pangu.spacing('abc 㐂 123'), 'abc 㐂 123');
    });

    it('處理 CJK Unified Ideographs', () => {
      assert.equal(pangu.spacing('abc丁123'), 'abc 丁 123');
      assert.equal(pangu.spacing('abc 丁 123'), 'abc 丁 123');
    });

    it('處理 CJK Compatibility Ideographs', () => {
      assert.equal(pangu.spacing('abc車123'), 'abc 車 123');
      assert.equal(pangu.spacing('abc 車 123'), 'abc 車 123');
    });

    it('處理 ~ 符號', () => {
      assert.equal(pangu.spacing('前面~後面'), '前面~ 後面');
      assert.equal(pangu.spacing('前面 ~ 後面'), '前面 ~ 後面');
      assert.equal(pangu.spacing('前面~ 後面'), '前面~ 後面');
    });

    it('處理 ` 符號', () => {
      assert.equal(pangu.spacing('前面`後面'), '前面 ` 後面');
    });

    it('處理 ! 符號', () => {
      assert.equal(pangu.spacing('前面!後面'), '前面! 後面');
      assert.equal(pangu.spacing('前面 ! 後面'), '前面 ! 後面');
      assert.equal(pangu.spacing('前面!後面'), '前面! 後面');
    });

    it('處理 @ 符號', () => {
      // https://twitter.com/vinta
      // http://weibo.com/vintalines
      assert.equal(pangu.spacing('請@vinta吃大便'), '請 @vinta 吃大便');
      assert.equal(pangu.spacing('請@陳上進 吃大便'), '請 @陳上進 吃大便');
    });

    it('處理 # 符號', () => {
      assert.equal(pangu.spacing('前面#H2G2後面'), '前面 #H2G2 後面');
      assert.equal(pangu.spacing('前面 #銀河便車指南 後面'), '前面 #銀河便車指南 後面');
      assert.equal(pangu.spacing('前面#銀河便車指南 後面'), '前面 #銀河便車指南 後面');
      assert.equal(pangu.spacing('前面#銀河公車指南 #銀河拖吊車指南 後面'), '前面 #銀河公車指南 #銀河拖吊車指南 後面');
      assert.equal(pangu.spacing('前面#H2G2#後面'), '前面 #H2G2# 後面');
      assert.equal(pangu.spacing('前面#銀河閃電霹靂車指南#後面'), '前面 #銀河閃電霹靂車指南# 後面');
    });

    it('處理 $ 符號', () => {
      assert.equal(pangu.spacing('前面$後面'), '前面 $ 後面');
      assert.equal(pangu.spacing('前面 $ 後面'), '前面 $ 後面');
      assert.equal(pangu.spacing('前面$100後面'), '前面 $100 後面');
    });

    it('處理 % 符號', () => {
      assert.equal(pangu.spacing('前面%後面'), '前面 % 後面');
      assert.equal(pangu.spacing('前面 % 後面'), '前面 % 後面');
      assert.equal(pangu.spacing('前面100%後面'), '前面 100% 後面');
    });

    it('處理 ^ 符號', () => {
      assert.equal(pangu.spacing('前面^後面'), '前面 ^ 後面');
      assert.equal(pangu.spacing('前面 ^ 後面'), '前面 ^ 後面');
    });

    it('處理 & 符號', () => {
      assert.equal(pangu.spacing('前面&後面'), '前面 & 後面');
      assert.equal(pangu.spacing('前面 & 後面'), '前面 & 後面');
      assert.equal(pangu.spacing('Vinta&Mollie'), 'Vinta&Mollie');
      assert.equal(pangu.spacing('Vinta&陳上進'), 'Vinta & 陳上進');
      assert.equal(pangu.spacing('陳上進&Vinta'), '陳上進 & Vinta');
      assert.equal(pangu.spacing('得到一個A&B的結果'), '得到一個 A&B 的結果');
    });

    it('處理 * 符號', () => {
      assert.equal(pangu.spacing('前面*後面'), '前面 * 後面');
      assert.equal(pangu.spacing('前面 * 後面'), '前面 * 後面');
      assert.equal(pangu.spacing('Vinta*Mollie'), 'Vinta*Mollie');
      assert.equal(pangu.spacing('Vinta*陳上進'), 'Vinta * 陳上進');
      assert.equal(pangu.spacing('陳上進*Vinta'), '陳上進 * Vinta');
      assert.equal(pangu.spacing('得到一個A*B的結果'), '得到一個 A*B 的結果');
    });

    it('處理 ( ) 符號', () => {
      assert.equal(pangu.spacing('前面(中文123漢字)後面'), '前面 (中文 123 漢字) 後面');
      assert.equal(pangu.spacing('前面(中文123)後面'), '前面 (中文 123) 後面');
      assert.equal(pangu.spacing('前面(123漢字)後面'), '前面 (123 漢字) 後面');
      assert.equal(pangu.spacing('前面(中文123) tail'), '前面 (中文 123) tail');
      assert.equal(pangu.spacing('head (中文123漢字)後面'), 'head (中文 123 漢字) 後面');
      assert.equal(pangu.spacing('head (中文123漢字) tail'), 'head (中文 123 漢字) tail');
      assert.equal(pangu.spacing('(or simply "React")'), '(or simply "React")');
      assert.equal(pangu.spacing("OperationalError: (2006, 'MySQL server has gone away')"), "OperationalError: (2006, 'MySQL server has gone away')");
    });

    it('處理 - 符號', () => {
      assert.equal(pangu.spacing('前面-後面'), '前面 - 後面');
      assert.equal(pangu.spacing('前面 - 後面'), '前面 - 後面');
      assert.equal(pangu.spacing('Vinta-Mollie'), 'Vinta-Mollie');
      assert.equal(pangu.spacing('Vinta-陳上進'), 'Vinta - 陳上進');
      assert.equal(pangu.spacing('陳上進-Vinta'), '陳上進 - Vinta');
      assert.equal(pangu.spacing('得到一個A-B的結果'), '得到一個 A-B 的結果');
    });

    it('略過 _ 符號', () => {
      assert.equal(pangu.spacing('前面_後面'), '前面_後面');
      assert.equal(pangu.spacing('前面 _ 後面'), '前面 _ 後面');
    });

    it('處理 + 符號', () => {
      assert.equal(pangu.spacing('前面+後面'), '前面 + 後面');
      assert.equal(pangu.spacing('前面 + 後面'), '前面 + 後面');
      assert.equal(pangu.spacing('Vinta+Mollie'), 'Vinta+Mollie');
      assert.equal(pangu.spacing('Vinta+陳上進'), 'Vinta + 陳上進');
      assert.equal(pangu.spacing('陳上進+Vinta'), '陳上進 + Vinta');
      assert.equal(pangu.spacing('得到一個A+B的結果'), '得到一個 A+B 的結果');
      // assert.equal(pangu.spacing('得到一個C+的結果'), '得到一個 C+ 的結果');
      assert.equal(pangu.spacing('得到一個C++的結果'), '得到一個 C++ 的結果');
    });

    it('處理 = 符號', () => {
      assert.equal(pangu.spacing('前面=後面'), '前面 = 後面');
      assert.equal(pangu.spacing('前面 = 後面'), '前面 = 後面');
      assert.equal(pangu.spacing('Vinta=Mollie'), 'Vinta=Mollie');
      assert.equal(pangu.spacing('Vinta=陳上進'), 'Vinta = 陳上進');
      assert.equal(pangu.spacing('陳上進=Vinta'), '陳上進 = Vinta');
      assert.equal(pangu.spacing('得到一個A=B的結果'), '得到一個 A=B 的結果');
    });

    it('處理 { } 符號', () => {
      assert.equal(pangu.spacing('前面{中文123漢字}後面'), '前面 {中文 123 漢字} 後面');
      assert.equal(pangu.spacing('前面{中文123}後面'), '前面 {中文 123} 後面');
      assert.equal(pangu.spacing('前面{123漢字}後面'), '前面 {123 漢字} 後面');
      assert.equal(pangu.spacing('前面{中文123} tail'), '前面 {中文 123} tail');
      assert.equal(pangu.spacing('head {中文123漢字}後面'), 'head {中文 123 漢字} 後面');
      assert.equal(pangu.spacing('head {中文123漢字} tail'), 'head {中文 123 漢字} tail');
    });

    it('處理 [ ] 符號', () => {
      assert.equal(pangu.spacing('前面[中文123漢字]後面'), '前面 [中文 123 漢字] 後面');
      assert.equal(pangu.spacing('前面[中文123]後面'), '前面 [中文 123] 後面');
      assert.equal(pangu.spacing('前面[123漢字]後面'), '前面 [123 漢字] 後面');
      assert.equal(pangu.spacing('前面[中文123] tail'), '前面 [中文 123] tail');
      assert.equal(pangu.spacing('head [中文123漢字]後面'), 'head [中文 123 漢字] 後面');
      assert.equal(pangu.spacing('head [中文123漢字] tail'), 'head [中文 123 漢字] tail');
    });

    it('處理 | 符號', () => {
      assert.equal(pangu.spacing('前面|後面'), '前面 | 後面');
      assert.equal(pangu.spacing('前面 | 後面'), '前面 | 後面');
      assert.equal(pangu.spacing('Vinta|Mollie'), 'Vinta|Mollie');
      assert.equal(pangu.spacing('Vinta|陳上進'), 'Vinta | 陳上進');
      assert.equal(pangu.spacing('陳上進|Vinta'), '陳上進 | Vinta');
      assert.equal(pangu.spacing('得到一個A|B的結果'), '得到一個 A|B 的結果');
    });

    it('處理 \\ 符號', () => {
      assert.equal(pangu.spacing('前面\\後面'), '前面 \\ 後面');
      assert.equal(pangu.spacing('前面 \\ 後面'), '前面 \\ 後面');
    });

    it('處理 : 符號', () => {
      assert.equal(pangu.spacing('前面:後面'), '前面: 後面');
      assert.equal(pangu.spacing('前面 : 後面'), '前面 : 後面');
      assert.equal(pangu.spacing('前面: 後面'), '前面: 後面');
    });

    it('處理 ; 符號', () => {
      assert.equal(pangu.spacing('前面;後面'), '前面; 後面');
      assert.equal(pangu.spacing('前面 ; 後面'), '前面 ; 後面');
      assert.equal(pangu.spacing('前面; 後面'), '前面; 後面');
    });

    it('處理 " " 符號', () => {
      assert.equal(pangu.spacing('前面"中文123漢字"後面'), '前面 "中文 123 漢字" 後面');
      assert.equal(pangu.spacing('前面"中文123"後面'), '前面 "中文 123" 後面');
      assert.equal(pangu.spacing('前面"123漢字"後面'), '前面 "123 漢字" 後面');
      assert.equal(pangu.spacing('前面"中文123" tail'), '前面 "中文 123" tail');
      assert.equal(pangu.spacing('head "中文123漢字"後面'), 'head "中文 123 漢字" 後面');
      assert.equal(pangu.spacing('head "中文123漢字" tail'), 'head "中文 123 漢字" tail');
    });

    it("處理 ' ' 符號", () => {
      assert.equal(pangu.spacing("陳上進 likes 林依諾's status."), "陳上進 likes 林依諾's status.");
    });

    it('處理 < > 符號', () => {
      assert.equal(pangu.spacing('前面<中文123漢字>後面'), '前面 <中文 123 漢字> 後面');
      assert.equal(pangu.spacing('前面<中文123>後面'), '前面 <中文 123> 後面');
      assert.equal(pangu.spacing('前面<123漢字>後面'), '前面 <123 漢字> 後面');
      assert.equal(pangu.spacing('前面<中文123> tail'), '前面 <中文 123> tail');
      assert.equal(pangu.spacing('head <中文123漢字>後面'), 'head <中文 123 漢字> 後面');
      assert.equal(pangu.spacing('head <中文123漢字> tail'), 'head <中文 123 漢字> tail');
    });

    it('處理 < 符號', () => {
      assert.equal(pangu.spacing('前面<後面'), '前面 < 後面');
      assert.equal(pangu.spacing('前面 < 後面'), '前面 < 後面');
      assert.equal(pangu.spacing('Vinta<Mollie'), 'Vinta<Mollie');
      assert.equal(pangu.spacing('Vinta<陳上進'), 'Vinta < 陳上進');
      assert.equal(pangu.spacing('陳上進<Vinta'), '陳上進 < Vinta');
      assert.equal(pangu.spacing('得到一個A<B的結果'), '得到一個 A<B 的結果');
    });

    it('處理 , 符號', () => {
      assert.equal(pangu.spacing('前面,後面'), '前面, 後面');
      assert.equal(pangu.spacing('前面 , 後面'), '前面 , 後面');
      assert.equal(pangu.spacing('前面, 後面'), '前面, 後面');
    });

    it('處理 > 符號', () => {
      assert.equal(pangu.spacing('前面>後面'), '前面 > 後面');
      assert.equal(pangu.spacing('前面 > 後面'), '前面 > 後面');
      assert.equal(pangu.spacing('Vinta>Mollie'), 'Vinta>Mollie');
      assert.equal(pangu.spacing('Vinta>陳上進'), 'Vinta > 陳上進');
      assert.equal(pangu.spacing('陳上進>Vinta'), '陳上進 > Vinta');
      assert.equal(pangu.spacing('得到一個A>B的結果'), '得到一個 A>B 的結果');
    });

    it('處理 . 符號', () => {
      assert.equal(pangu.spacing('前面.後面'), '前面. 後面');
      assert.equal(pangu.spacing('前面 . 後面'), '前面 . 後面');
      assert.equal(pangu.spacing('前面. 後面'), '前面. 後面');
    });

    it('處理 ? 符號', () => {
      assert.equal(pangu.spacing('前面?後面'), '前面? 後面');
      assert.equal(pangu.spacing('前面 ? 後面'), '前面 ? 後面');
      assert.equal(pangu.spacing('前面? 後面'), '前面? 後面');
    });

    it('處理 / 符號', () => {
      assert.equal(pangu.spacing('前面/後面'), '前面 / 後面');
      assert.equal(pangu.spacing('前面 / 後面'), '前面 / 後面');
      assert.equal(pangu.spacing('Vinta/Mollie'), 'Vinta/Mollie');
      assert.equal(pangu.spacing('Vinta/陳上進'), 'Vinta / 陳上進');
      assert.equal(pangu.spacing('陳上進/Vinta'), '陳上進 / Vinta');
      assert.equal(pangu.spacing('得到一個A/B的結果'), '得到一個 A/B 的結果');
    });

    it('處理特殊字元', () => {
      // \u201c and \u201d
      assert.equal(pangu.spacing('前面“中文123漢字”後面'), '前面 “中文 123 漢字” 後面');

      // \u2026
      assert.equal(pangu.spacing('前面…後面'), '前面… 後面');
      assert.equal(pangu.spacing('前面……後面'), '前面…… 後面');

      // \u2027
      assert.equal(pangu.spacing('前面‧後面'), '前面 ‧ 後面');
    });
  });

  describe('spacingText()', () => {
    it('callback', (done) => {
      pangu.spacingText('中文123漢字abc', (err, newText) => {
        assert.equal(newText, '中文 123 漢字 abc');
        done();
      });
    });

    it('promise', (done) => {
      pangu.spacingText('中文123漢字abc', (err, newText) => {
        assert.equal(newText, '中文 123 漢字 abc');
        done();
      });
    });
  });
});
