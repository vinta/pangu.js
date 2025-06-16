import { describe, it, expect } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Pangu', () => {
  describe('spacingText()', () => {
    // 略過

    it('略過 _ 符號', () => {
      expect(pangu.spacingText('前面_後面')).toBe('前面_後面');
      expect(pangu.spacingText('前面 _ 後面')).toBe('前面 _ 後面');
      expect(pangu.spacingText('Vinta_Mollie')).toBe('Vinta_Mollie');
      expect(pangu.spacingText('Vinta _ Mollie')).toBe('Vinta _ Mollie');
    });

    // 兩邊都加空格

    it('處理 Alphabets', () => {
      expect(pangu.spacingText('中文abc')).toBe('中文 abc');
      expect(pangu.spacingText('abc中文')).toBe('abc 中文');
    });

    it('處理 Numbers', () => {
      expect(pangu.spacingText('中文123')).toBe('中文 123');
      expect(pangu.spacingText('123中文')).toBe('123 中文');
    });

    // https://unicode-table.com/en/blocks/latin-1-supplement/
    it('處理 Latin-1 Supplement', () => {
      expect(pangu.spacingText('中文Ø漢字')).toBe('中文 Ø 漢字');
      expect(pangu.spacingText('中文 Ø 漢字')).toBe('中文 Ø 漢字');
    });

    // https://unicode-table.com/en/blocks/greek-coptic/
    it('處理 Greek and Coptic', () => {
      expect(pangu.spacingText('中文β漢字')).toBe('中文 β 漢字');
      expect(pangu.spacingText('中文 β 漢字')).toBe('中文 β 漢字');
      expect(pangu.spacingText('我是α，我是Ω')).toBe('我是 α，我是 Ω');
    });

    // https://unicode-table.com/en/blocks/number-forms/
    it('處理 Number Forms', () => {
      expect(pangu.spacingText('中文Ⅶ漢字')).toBe('中文 Ⅶ 漢字');
      expect(pangu.spacingText('中文 Ⅶ 漢字')).toBe('中文 Ⅶ 漢字');
    });

    // https://unicode-table.com/en/blocks/cjk-radicals-supplement/
    it('處理 CJK Radicals Supplement', () => {
      expect(pangu.spacingText('abc⻤123')).toBe('abc ⻤ 123');
      expect(pangu.spacingText('abc ⻤ 123')).toBe('abc ⻤ 123');
    });

    // https://unicode-table.com/en/blocks/kangxi-radicals/
    it('處理 Kangxi Radicals', () => {
      expect(pangu.spacingText('abc⾗123')).toBe('abc ⾗ 123');
      expect(pangu.spacingText('abc ⾗ 123')).toBe('abc ⾗ 123');
    });

    // https://unicode-table.com/en/blocks/hiragana/
    it('處理 Hiragana', () => {
      expect(pangu.spacingText('abcあ123')).toBe('abc あ 123');
      expect(pangu.spacingText('abc あ 123')).toBe('abc あ 123');
    });

    // https://unicode-table.com/en/blocks/katakana/
    it('處理 Katakana', () => {
      expect(pangu.spacingText('abcア123')).toBe('abc ア 123');
      expect(pangu.spacingText('abc ア 123')).toBe('abc ア 123');
    });

    // https://unicode-table.com/en/blocks/bopomofo/
    it('處理 Bopomofo', () => {
      expect(pangu.spacingText('abcㄅ123')).toBe('abc ㄅ 123');
      expect(pangu.spacingText('abc ㄅ 123')).toBe('abc ㄅ 123');
    });

    // https://unicode-table.com/en/blocks/enclosed-cjk-letters-and-months/
    it('處理 Enclosed CJK Letters And Months', () => {
      expect(pangu.spacingText('abc㈱123')).toBe('abc ㈱ 123');
      expect(pangu.spacingText('abc ㈱ 123')).toBe('abc ㈱ 123');
    });

    // https://unicode-table.com/en/blocks/cjk-unified-ideographs-extension-a/
    it('處理 CJK Unified Ideographs Extension-A', () => {
      expect(pangu.spacingText('abc㐂123')).toBe('abc 㐂 123');
      expect(pangu.spacingText('abc 㐂 123')).toBe('abc 㐂 123');
    });

    // https://unicode-table.com/en/blocks/cjk-unified-ideographs/
    it('處理 CJK Unified Ideographs', () => {
      expect(pangu.spacingText('abc丁123')).toBe('abc 丁 123');
      expect(pangu.spacingText('abc 丁 123')).toBe('abc 丁 123');
    });

    // https://unicode-table.com/en/blocks/cjk-compatibility-ideographs/
    it('處理 CJK Compatibility Ideographs', () => {
      expect(pangu.spacingText('abc車123')).toBe('abc 車 123');
      expect(pangu.spacingText('abc 車 123')).toBe('abc 車 123');
    });

    it('處理 $ 符號', () => {
      expect(pangu.spacingText('前面$後面')).toBe('前面 $ 後面');
      expect(pangu.spacingText('前面 $ 後面')).toBe('前面 $ 後面');
      expect(pangu.spacingText('前面$100後面')).toBe('前面 $100 後面');
    });

    it('處理 % 符號', () => {
      expect(pangu.spacingText('前面%後面')).toBe('前面 % 後面');
      expect(pangu.spacingText('前面 % 後面')).toBe('前面 % 後面');
      expect(pangu.spacingText('前面100%後面')).toBe('前面 100% 後面');
      expect(pangu.spacingText('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾')).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });

    it('處理 ^ 符號', () => {
      expect(pangu.spacingText('前面^後面')).toBe('前面 ^ 後面');
      expect(pangu.spacingText('前面 ^ 後面')).toBe('前面 ^ 後面');
    });

    it('處理 & 符號', () => {
      expect(pangu.spacingText('前面&後面')).toBe('前面 & 後面');
      expect(pangu.spacingText('前面 & 後面')).toBe('前面 & 後面');
      expect(pangu.spacingText('Vinta&Mollie')).toBe('Vinta&Mollie');
      expect(pangu.spacingText('Vinta&陳上進')).toBe('Vinta & 陳上進');
      expect(pangu.spacingText('陳上進&Vinta')).toBe('陳上進 & Vinta');
      expect(pangu.spacingText('得到一個A&B的結果')).toBe('得到一個 A&B 的結果');
    });

    it('處理 * 符號', () => {
      expect(pangu.spacingText('前面*後面')).toBe('前面 * 後面');
      expect(pangu.spacingText('前面 * 後面')).toBe('前面 * 後面');
      expect(pangu.spacingText('前面* 後面')).toBe('前面 * 後面');
      expect(pangu.spacingText('前面 *後面')).toBe('前面 * 後面');
      expect(pangu.spacingText('Vinta*Mollie')).toBe('Vinta*Mollie');
      expect(pangu.spacingText('Vinta*陳上進')).toBe('Vinta * 陳上進');
      expect(pangu.spacingText('陳上進*Vinta')).toBe('陳上進 * Vinta');
      expect(pangu.spacingText('得到一個A*B的結果')).toBe('得到一個 A*B 的結果');
    });

    it('處理 - 符號', () => {
      expect(pangu.spacingText('前面-後面')).toBe('前面 - 後面');
      expect(pangu.spacingText('前面 - 後面')).toBe('前面 - 後面');
      expect(pangu.spacingText('Vinta-Mollie')).toBe('Vinta-Mollie');
      expect(pangu.spacingText('Vinta-陳上進')).toBe('Vinta - 陳上進');
      expect(pangu.spacingText('陳上進-Vinta')).toBe('陳上進 - Vinta');
      expect(pangu.spacingText('得到一個A-B的結果')).toBe('得到一個 A-B 的結果');
      expect(pangu.spacingText('长者的智慧和复杂的维斯特洛- 文章')).toBe('长者的智慧和复杂的维斯特洛 - 文章');

      // TODO
      // expect(pangu.spacing('陳上進--Vinta')).toBe('陳上進 -- Vinta');
    });

    it('處理 = 符號', () => {
      expect(pangu.spacingText('前面=後面')).toBe('前面 = 後面');
      expect(pangu.spacingText('前面 = 後面')).toBe('前面 = 後面');
      expect(pangu.spacingText('Vinta=Mollie')).toBe('Vinta=Mollie');
      expect(pangu.spacingText('Vinta=陳上進')).toBe('Vinta = 陳上進');
      expect(pangu.spacingText('陳上進=Vinta')).toBe('陳上進 = Vinta');
      expect(pangu.spacingText('得到一個A=B的結果')).toBe('得到一個 A=B 的結果');
    });

    it('處理 + 符號', () => {
      expect(pangu.spacingText('前面+後面')).toBe('前面 + 後面');
      expect(pangu.spacingText('前面 + 後面')).toBe('前面 + 後面');
      expect(pangu.spacingText('Vinta+Mollie')).toBe('Vinta+Mollie');
      expect(pangu.spacingText('Vinta+陳上進')).toBe('Vinta + 陳上進');
      expect(pangu.spacingText('陳上進+Vinta')).toBe('陳上進 + Vinta');
      expect(pangu.spacingText('得到一個A+B的結果')).toBe('得到一個 A+B 的結果');
      expect(pangu.spacingText('得到一個C++的結果')).toBe('得到一個 C++ 的結果');

      // TODO
      // expect(pangu.spacing('得到一個A+的結果')).toBe('得到一個 A+ 的結果');
    });

    it('處理 | 符號', () => {
      expect(pangu.spacingText('前面|後面')).toBe('前面 | 後面');
      expect(pangu.spacingText('前面 | 後面')).toBe('前面 | 後面');
      expect(pangu.spacingText('Vinta|Mollie')).toBe('Vinta|Mollie');
      expect(pangu.spacingText('Vinta|陳上進')).toBe('Vinta | 陳上進');
      expect(pangu.spacingText('陳上進|Vinta')).toBe('陳上進 | Vinta');
      expect(pangu.spacingText('得到一個A|B的結果')).toBe('得到一個 A|B 的結果');
    });

    it('處理 \\ 符號', () => {
      expect(pangu.spacingText('前面\\後面')).toBe('前面 \\ 後面');
      expect(pangu.spacingText('前面 \\ 後面')).toBe('前面 \\ 後面');
    });

    it('處理 / 符號', () => {
      expect(pangu.spacingText('前面/後面')).toBe('前面 / 後面');
      expect(pangu.spacingText('前面 / 後面')).toBe('前面 / 後面');
      expect(pangu.spacingText('Vinta/Mollie')).toBe('Vinta/Mollie');
      expect(pangu.spacingText('Vinta/陳上進')).toBe('Vinta / 陳上進');
      expect(pangu.spacingText('陳上進/Vinta')).toBe('陳上進 / Vinta');
      expect(pangu.spacingText('Mollie/陳上進/Vinta')).toBe('Mollie / 陳上進 / Vinta');
      expect(pangu.spacingText('得到一個A/B的結果')).toBe('得到一個 A/B 的結果');
      expect(pangu.spacingText('2016-12-26(奇幻电影节) / 2017-01-20(美国) / 詹姆斯麦卡沃伊')).toBe('2016-12-26 (奇幻电影节) / 2017-01-20 (美国) / 詹姆斯麦卡沃伊');
      expect(pangu.spacingText('/home/和/root是Linux中的頂級目錄')).toBe('/home/ 和 /root 是 Linux 中的頂級目錄');
      expect(pangu.spacingText('當你用cat和od指令查看/dev/random和/dev/urandom的內容時')).toBe('當你用 cat 和 od 指令查看 /dev/random 和 /dev/urandom 的內容時');
    });

    it('處理 < 符號', () => {
      expect(pangu.spacingText('前面<後面')).toBe('前面 < 後面');
      expect(pangu.spacingText('前面 < 後面')).toBe('前面 < 後面');
      expect(pangu.spacingText('Vinta<Mollie')).toBe('Vinta<Mollie');
      expect(pangu.spacingText('Vinta<陳上進')).toBe('Vinta < 陳上進');
      expect(pangu.spacingText('陳上進<Vinta')).toBe('陳上進 < Vinta');
      expect(pangu.spacingText('得到一個A<B的結果')).toBe('得到一個 A<B 的結果');
    });

    it('處理 > 符號', () => {
      expect(pangu.spacingText('前面>後面')).toBe('前面 > 後面');
      expect(pangu.spacingText('前面 > 後面')).toBe('前面 > 後面');
      expect(pangu.spacingText('Vinta>Mollie')).toBe('Vinta>Mollie');
      expect(pangu.spacingText('Vinta>陳上進')).toBe('Vinta > 陳上進');
      expect(pangu.spacingText('陳上進>Vinta')).toBe('陳上進 > Vinta');
      expect(pangu.spacingText('得到一個A>B的結果')).toBe('得到一個 A>B 的結果');
    });

    // 只加左空格

    it('處理 @ 符號', () => {
      // https://twitter.com/vinta
      // https://www.weibo.com/vintalines
      expect(pangu.spacingText('請@vinta吃大便')).toBe('請 @vinta 吃大便');
      expect(pangu.spacingText('請@陳上進 吃大便')).toBe('請 @陳上進 吃大便');
    });

    it('處理 # 符號', () => {
      expect(pangu.spacingText('前面#後面')).toBe('前面 #後面');
      expect(pangu.spacingText('前面C#後面')).toBe('前面 C# 後面');
      expect(pangu.spacingText('前面#H2G2後面')).toBe('前面 #H2G2 後面');
      expect(pangu.spacingText('前面 #銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
      expect(pangu.spacingText('前面#銀河便車指南 後面')).toBe('前面 #銀河便車指南 後面');
      expect(pangu.spacingText('前面#銀河公車指南 #銀河拖吊車指南 後面')).toBe('前面 #銀河公車指南 #銀河拖吊車指南 後面');
    });

    // 只加右空格

    it('處理 ... 符號', () => {
      expect(pangu.spacingText('前面...後面')).toBe('前面... 後面');
      expect(pangu.spacingText('前面..後面')).toBe('前面.. 後面');
    });

    // \u2026
    it('處理 … 符號', () => {
      expect(pangu.spacingText('前面…後面')).toBe('前面… 後面');
      expect(pangu.spacingText('前面……後面')).toBe('前面…… 後面');
    });

    // 換成全形符號

    it('處理 ~ 符號', () => {
      expect(pangu.spacingText('前面~後面')).toBe('前面～後面');
      expect(pangu.spacingText('前面 ~ 後面')).toBe('前面～後面');
      expect(pangu.spacingText('前面~ 後面')).toBe('前面～後面');
      expect(pangu.spacingText('前面 ~後面')).toBe('前面～後面');
    });

    it('處理 ! 符號', () => {
      expect(pangu.spacingText('前面!後面')).toBe('前面！後面');
      expect(pangu.spacingText('前面 ! 後面')).toBe('前面！後面');
      expect(pangu.spacingText('前面! 後面')).toBe('前面！後面');
      expect(pangu.spacingText('前面 !後面')).toBe('前面！後面');
    });

    it('處理 ; 符號', () => {
      expect(pangu.spacingText('前面;後面')).toBe('前面；後面');
      expect(pangu.spacingText('前面 ; 後面')).toBe('前面；後面');
      expect(pangu.spacingText('前面; 後面')).toBe('前面；後面');
      expect(pangu.spacingText('前面 ;後面')).toBe('前面；後面');
    });

    it('處理 : 符號', () => {
      expect(pangu.spacingText('前面:後面')).toBe('前面：後面');
      expect(pangu.spacingText('前面 : 後面')).toBe('前面：後面');
      expect(pangu.spacingText('前面: 後面')).toBe('前面：後面');
      expect(pangu.spacingText('前面 :後面')).toBe('前面：後面');
      expect(pangu.spacingText('電話:123456789')).toBe('電話：123456789');
      expect(pangu.spacingText('前面:)後面')).toBe('前面：) 後面');
      expect(pangu.spacingText('前面:I have no idea後面')).toBe('前面：I have no idea 後面');
      expect(pangu.spacingText('前面: I have no idea後面')).toBe('前面: I have no idea 後面');
    });

    it('處理 , 符號', () => {
      expect(pangu.spacingText('前面,後面')).toBe('前面，後面');
      expect(pangu.spacingText('前面 , 後面')).toBe('前面，後面');
      expect(pangu.spacingText('前面, 後面')).toBe('前面，後面');
      expect(pangu.spacingText('前面 ,後面')).toBe('前面，後面');
      expect(pangu.spacingText('前面,')).toBe('前面，');
      expect(pangu.spacingText('前面, ')).toBe('前面，');
    });

    it('處理 . 符號', () => {
      expect(pangu.spacingText('前面.後面')).toBe('前面。後面');
      expect(pangu.spacingText('前面 . 後面')).toBe('前面。後面');
      expect(pangu.spacingText('前面. 後面')).toBe('前面。後面');
      expect(pangu.spacingText('前面 .後面')).toBe('前面。後面');
      expect(pangu.spacingText('黑人問號.jpg 後面')).toBe('黑人問號.jpg 後面');
    });

    it('處理 ? 符號', () => {
      expect(pangu.spacingText('前面?後面')).toBe('前面？後面');
      expect(pangu.spacingText('前面 ? 後面')).toBe('前面？後面');
      expect(pangu.spacingText('前面? 後面')).toBe('前面？後面');
      expect(pangu.spacingText('前面 ?後面')).toBe('前面？後面');
      expect(pangu.spacingText('所以，請問Jackey的鼻子有幾個?3.14個')).toBe('所以，請問 Jackey 的鼻子有幾個？3.14 個');
    });

    // \u00b7
    it('處理 · 符號', () => {
      expect(pangu.spacingText('前面·後面')).toBe('前面・後面');
      expect(pangu.spacingText('喬治·R·R·馬丁')).toBe('喬治・R・R・馬丁');
      expect(pangu.spacingText('M·奈特·沙马兰')).toBe('M・奈特・沙马兰');
    });

    // \u2022
    it('處理 • 符號', () => {
      expect(pangu.spacingText('前面•後面')).toBe('前面・後面');
      expect(pangu.spacingText('喬治•R•R•馬丁')).toBe('喬治・R・R・馬丁');
      expect(pangu.spacingText('M•奈特•沙马兰')).toBe('M・奈特・沙马兰');
    });

    // \u2027
    it('處理 ‧ 符號', () => {
      expect(pangu.spacingText('前面‧後面')).toBe('前面・後面');
      expect(pangu.spacingText('喬治‧R‧R‧馬丁')).toBe('喬治・R・R・馬丁');
      expect(pangu.spacingText('M‧奈特‧沙马兰')).toBe('M・奈特・沙马兰');
    });

    // 成對符號：相異

    it('處理 < > 符號', () => {
      expect(pangu.spacingText('前面<中文123漢字>後面')).toBe('前面 <中文 123 漢字> 後面');
      expect(pangu.spacingText('前面<中文123>後面')).toBe('前面 <中文 123> 後面');
      expect(pangu.spacingText('前面<123漢字>後面')).toBe('前面 <123 漢字> 後面');
      expect(pangu.spacingText('前面<中文123> tail')).toBe('前面 <中文 123> tail');
      expect(pangu.spacingText('head <中文123漢字>後面')).toBe('head <中文 123 漢字> 後面');
      expect(pangu.spacingText('head <中文123漢字> tail')).toBe('head <中文 123 漢字> tail');
    });

    it('處理 ( ) 符號', () => {
      expect(pangu.spacingText('前面(中文123漢字)後面')).toBe('前面 (中文 123 漢字) 後面');
      expect(pangu.spacingText('前面(中文123)後面')).toBe('前面 (中文 123) 後面');
      expect(pangu.spacingText('前面(123漢字)後面')).toBe('前面 (123 漢字) 後面');
      expect(pangu.spacingText('前面(中文123) tail')).toBe('前面 (中文 123) tail');
      expect(pangu.spacingText('head (中文123漢字)後面')).toBe('head (中文 123 漢字) 後面');
      expect(pangu.spacingText('head (中文123漢字) tail')).toBe('head (中文 123 漢字) tail');
      expect(pangu.spacingText('(or simply "React")')).toBe('(or simply "React")');
      expect(pangu.spacingText("OperationalError: (2006, 'MySQL server has gone away')")).toBe("OperationalError: (2006, 'MySQL server has gone away')");
      expect(pangu.spacingText('我看过的电影(1404)')).toBe('我看过的电影 (1404)');
      expect(pangu.spacingText('Chang Stream(变更记录流)是指collection(数据库集合)的变更事件流')).toBe('Chang Stream (变更记录流) 是指 collection (数据库集合) 的变更事件流');
    });

    it('處理 { } 符號', () => {
      expect(pangu.spacingText('前面{中文123漢字}後面')).toBe('前面 {中文 123 漢字} 後面');
      expect(pangu.spacingText('前面{中文123}後面')).toBe('前面 {中文 123} 後面');
      expect(pangu.spacingText('前面{123漢字}後面')).toBe('前面 {123 漢字} 後面');
      expect(pangu.spacingText('前面{中文123} tail')).toBe('前面 {中文 123} tail');
      expect(pangu.spacingText('head {中文123漢字}後面')).toBe('head {中文 123 漢字} 後面');
      expect(pangu.spacingText('head {中文123漢字} tail')).toBe('head {中文 123 漢字} tail');
    });

    it('處理 [ ] 符號', () => {
      expect(pangu.spacingText('前面[中文123漢字]後面')).toBe('前面 [中文 123 漢字] 後面');
      expect(pangu.spacingText('前面[中文123]後面')).toBe('前面 [中文 123] 後面');
      expect(pangu.spacingText('前面[123漢字]後面')).toBe('前面 [123 漢字] 後面');
      expect(pangu.spacingText('前面[中文123] tail')).toBe('前面 [中文 123] tail');
      expect(pangu.spacingText('head [中文123漢字]後面')).toBe('head [中文 123 漢字] 後面');
      expect(pangu.spacingText('head [中文123漢字] tail')).toBe('head [中文 123 漢字] tail');
    });

    it('處理 " " \\u201c \\u201d 符號', () => {
      expect(pangu.spacingText('前面"中文123漢字"後面')).toBe('前面 "中文 123 漢字" 後面');
    });

    // 成對符號：相同

    it('處理 ` ` 符號', () => {
      expect(pangu.spacingText('前面`中間`後面')).toBe('前面 `中間` 後面');
    });

    it('處理 # # 符號', () => {
      expect(pangu.spacingText('前面#H2G2#後面')).toBe('前面 #H2G2# 後面');
      expect(pangu.spacingText('前面#銀河閃電霹靂車指南#後面')).toBe('前面 #銀河閃電霹靂車指南# 後面');
    });

    it('處理 " " 符號', () => {
      expect(pangu.spacingText('前面"中文123漢字"後面')).toBe('前面 "中文 123 漢字" 後面');
      expect(pangu.spacingText('前面"中文123"後面')).toBe('前面 "中文 123" 後面');
      expect(pangu.spacingText('前面"123漢字"後面')).toBe('前面 "123 漢字" 後面');
      expect(pangu.spacingText('前面"中文123" tail')).toBe('前面 "中文 123" tail');
      expect(pangu.spacingText('head "中文123漢字"後面')).toBe('head "中文 123 漢字" 後面');
      expect(pangu.spacingText('head "中文123漢字" tail')).toBe('head "中文 123 漢字" tail');
    });

    it("處理 ' ' 符號", () => {
      expect(pangu.spacingText("Why are Python's 'private' methods not actually private?")).toBe("Why are Python's 'private' methods not actually private?");
      expect(pangu.spacingText("陳上進 likes 林依諾's status.")).toBe("陳上進 likes 林依諾's status.");
      expect(pangu.spacingText("举个栗子，如果一道题只包含'A' ~ 'Z'意味着字符集大小是")).toBe("举个栗子，如果一道题只包含 'A' ~ 'Z' 意味着字符集大小是");
    });

    it('處理 ״ ״ \\u05f4 \\u05f4 符號', () => {
      expect(pangu.spacingText('前面״中間״後面')).toBe('前面 ״中間״ 後面');
    });

    // 英文與符號

    it('處理英文與 " " \\u201c \\u201d 符號', () => {
      // TODO: Fix spacing after curly quotes followed by English letters
      // This is a known bug in the original pangu.js that needs the QUOTE_AN and AN_QUOTE patterns
      // expect(pangu.spacing('阿里云开源"计算王牌"Blink，实时计算时代已来')).toBe('阿里云开源 "计算王牌" Blink，实时计算时代已来');
      // expect(pangu.spacing('苹果撤销Facebook"企业证书"后者股价一度短线走低')).toBe('苹果撤销 Facebook "企业证书" 后者股价一度短线走低');
      expect(pangu.spacingText('【UCG中字】"數毛社"DF的《戰神4》全新演示解析')).toBe('【UCG 中字】"數毛社" DF 的《戰神 4》全新演示解析');
    });

    it('處理英文與 % 符號', () => {
      expect(pangu.spacingText("丹寧控注意Levi's全館任2件25%OFF滿額再享85折！")).toBe("丹寧控注意 Levi's 全館任 2 件 25% OFF 滿額再享 85 折！");
    });
  });

  describe('spacing()', () => {
    it('should work with multiple texts sequentially', () => {
      const results = [
        pangu.spacing('Xcode 7.1配備了全新的AppleTV開發工具'),
        pangu.spacing('新MacBook Pro有15寸和13寸兩個版本'),
        pangu.spacing('ChromeDriver 2.20支援Chrome v43-48')
      ];

      expect(results).toEqual([
        'Xcode 7.1 配備了全新的 AppleTV 開發工具',
        '新 MacBook Pro 有 15 寸和 13 寸兩個版本',
        'ChromeDriver 2.20 支援 Chrome v43-48'
      ]);
    });
  });
});