import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Brackets & Quotes', () => {
  describe('成對符號：相異', () => {
    it('handle < > symbols', () => {
      expect(pangu.spacingText('前面<中文123漢字>後面')).toBe('前面 <中文 123 漢字> 後面');
      expect(pangu.spacingText('前面<中文123>後面')).toBe('前面 <中文 123> 後面');
      expect(pangu.spacingText('前面<123漢字>後面')).toBe('前面 <123 漢字> 後面');
      expect(pangu.spacingText('前面<中文123> tail')).toBe('前面 <中文 123> tail');
      expect(pangu.spacingText('head <中文123漢字>後面')).toBe('head <中文 123 漢字> 後面');
      expect(pangu.spacingText('head <中文123漢字> tail')).toBe('head <中文 123 漢字> tail');
    });

    it('handle < > as HTML tags', () => {
      expect(pangu.spacingText('<p>一行文本</p>')).toBe('<p>一行文本</p>');
      expect(pangu.spacingText('<p>文字<strong>加粗</strong></p>')).toBe('<p>文字<strong>加粗</strong></p>');
      expect(pangu.spacingText('<div>測試<span>內容</span>結束</div>')).toBe('<div>測試<span>內容</span>結束</div>');
      expect(pangu.spacingText('<a href="#">連結</a>')).toBe('<a href="#">連結</a>');
      expect(pangu.spacingText('<input value="測試123">')).toBe('<input value="測試 123">');
      expect(pangu.spacingText('<img src="test.jpg" alt="測試圖片">')).toBe('<img src="test.jpg" alt="測試圖片">');

      // Multiple tags
      expect(pangu.spacingText('<p>第一段</p><p>第二段</p>')).toBe('<p>第一段</p><p>第二段</p>');
      expect(pangu.spacingText('<h1>標題</h1><p>內容</p>')).toBe('<h1>標題</h1><p>內容</p>');

      // Nested tags
      expect(pangu.spacingText('<div><p>嵌套<strong>測試</strong></p></div>')).toBe('<div><p>嵌套<strong>測試</strong></p></div>');

      // Self-closing tags
      expect(pangu.spacingText('文字<br>換行')).toBe('文字<br>換行');
      expect(pangu.spacingText('水平線<hr>分隔')).toBe('水平線<hr>分隔');
      expect(pangu.spacingText('水平線<hr />分隔')).toBe('水平線<hr />分隔');

      // prettier-ignore
      // FIXME
      // expect(pangu.spacingText('<attackOnJava>那一天，人類終於回想起了，曾經一度被XML所支配的恐懼</attackOnJava> <!--進擊的Java-->'))
      //                    .toBe('<attackOnJava>那一天，人類終於回想起了，曾經一度被 XML 所支配的恐懼</attackOnJava> <!--進擊的 Java-->');
    });

    it('handle ( ) symbols', () => {
      expect(pangu.spacingText('前面(中文123漢字)後面')).toBe('前面 (中文 123 漢字) 後面');
      expect(pangu.spacingText('前面(中文123)後面')).toBe('前面 (中文 123) 後面');
      expect(pangu.spacingText('前面(123漢字)後面')).toBe('前面 (123 漢字) 後面');
      expect(pangu.spacingText('前面(中文123) tail')).toBe('前面 (中文 123) tail');
      expect(pangu.spacingText('head (中文123漢字)後面')).toBe('head (中文 123 漢字) 後面');
      expect(pangu.spacingText('head (中文123漢字) tail')).toBe('head (中文 123 漢字) tail');
      expect(pangu.spacingText('(or simply "React")')).toBe('(or simply "React")');
      expect(pangu.spacingText('function(123)')).toBe('function(123)');
      expect(pangu.spacingText('我看过的电影(1404)')).toBe('我看过的电影 (1404)');

      // prettier-ignore
      expect(pangu.spacingText('預定於繳款截止日114/07/02(遇假日順延)之次一營業日進行扣款'))
                         .toBe('預定於繳款截止日 114/07/02 (遇假日順延) 之次一營業日進行扣款');

      // prettier-ignore
      expect(pangu.spacingText("OperationalError: (2006, 'MySQL server has gone away')"))
                         .toBe("OperationalError: (2006, 'MySQL server has gone away')");

      // prettier-ignore
      expect(pangu.spacingText('Chang Stream(变更记录流)是指collection(数据库集合)的变更事件流'))
                         .toBe('Chang Stream (变更记录流) 是指 collection (数据库集合) 的变更事件流');

      // prettier-ignore
      expect(pangu.spacingText('从结果来看，当a.b销毁后，`a.getB()`返回值为null'))
                         .toBe('从结果来看，当 a.b 销毁后，`a.getB()` 返回值为 null');

      // prettier-ignore
      expect(pangu.spacingText("后续会直接用iframe window.addEventListener('message')"))
                         .toBe("后续会直接用 iframe window.addEventListener('message')");
    });

    it('handle { } symbols', () => {
      expect(pangu.spacingText('前面{中文123漢字}後面')).toBe('前面 {中文 123 漢字} 後面');
      expect(pangu.spacingText('前面{中文123}後面')).toBe('前面 {中文 123} 後面');
      expect(pangu.spacingText('前面{123漢字}後面')).toBe('前面 {123 漢字} 後面');
      expect(pangu.spacingText('前面{中文123} tail')).toBe('前面 {中文 123} tail');
      expect(pangu.spacingText('head {中文123漢字}後面')).toBe('head {中文 123 漢字} 後面');
      expect(pangu.spacingText('head {中文123漢字} tail')).toBe('head {中文 123 漢字} tail');
    });

    it('handle [ ] symbols', () => {
      expect(pangu.spacingText('前面[中文123漢字]後面')).toBe('前面 [中文 123 漢字] 後面');
      expect(pangu.spacingText('前面[中文123]後面')).toBe('前面 [中文 123] 後面');
      expect(pangu.spacingText('前面[123漢字]後面')).toBe('前面 [123 漢字] 後面');
      expect(pangu.spacingText('前面[中文123] tail')).toBe('前面 [中文 123] tail');
      expect(pangu.spacingText('head [中文123漢字]後面')).toBe('head [中文 123 漢字] 後面');
      expect(pangu.spacingText('head [中文123漢字] tail')).toBe('head [中文 123 漢字] tail');
    });

    // \u201c
    // \u201d
    it('handle English with “ ” symbols', () => {
      expect(pangu.spacingText('阿里云开源“计算王牌”Blink，实时计算时代已来')).toBe('阿里云开源 “计算王牌” Blink，实时计算时代已来');
      expect(pangu.spacingText('苹果撤销Facebook“企业证书”后者股价一度短线走低')).toBe('苹果撤销 Facebook “企业证书” 后者股价一度短线走低');
      expect(pangu.spacingText('【UCG中字】“數毛社”DF的《戰神4》全新演示解析')).toBe('【UCG 中字】“數毛社” DF 的《戰神 4》全新演示解析');
    });
  });

  describe('成對符號：相同', () => {
    it('handle ` ` symbols', () => {
      expect(pangu.spacingText('前面`中間`後面')).toBe('前面 `中間` 後面');
    });

    it('handle # # symbols as Weibo-like hashtags', () => {
      // TODO:
      // expect(pangu.spacingText('前面#H2G2#後面')).toBe('前面 #H2G2# 後面');
      // expect(pangu.spacingText('前面#銀河閃電霹靂車指南#後面')).toBe('前面 #銀河閃電霹靂車指南# 後面');
    });

    it('handle " " symbols', () => {
      expect(pangu.spacingText('前面"中文123漢字"後面')).toBe('前面 "中文 123 漢字" 後面');
      expect(pangu.spacingText('前面"中文123"後面')).toBe('前面 "中文 123" 後面');
      expect(pangu.spacingText('前面"中文abc"後面')).toBe('前面 "中文 abc" 後面');
      expect(pangu.spacingText('前面"123漢字"後面')).toBe('前面 "123 漢字" 後面');
      expect(pangu.spacingText('前面"中文123" tail')).toBe('前面 "中文 123" tail');
      expect(pangu.spacingText('head "中文123漢字"後面')).toBe('head "中文 123 漢字" 後面');
      expect(pangu.spacingText('head "中文123漢字" tail')).toBe('head "中文 123 漢字" tail');
    });

    it("handle ' ' symbols", () => {
      expect(pangu.spacingText("陳上進 likes 林依諾's status.")).toBe("陳上進 likes 林依諾's status.");

      // prettier-ignore
      expect(pangu.spacingText("Why are Python's 'private' methods not actually private?"))
                         .toBe("Why are Python's 'private' methods not actually private?");

      // prettier-ignore
      expect(pangu.spacingText("举个栗子，如果一道题只包含'A' ~ 'Z'意味着字符集大小是"))
                         .toBe("举个栗子，如果一道题只包含 'A' ~ 'Z' 意味着字符集大小是");

      // Single quotes around Chinese text should not have spaces added
      expect(pangu.spacingText("Remove '铁蕾' from 1 Folder?")).toBe("Remove '铁蕾' from 1 Folder?");
    });

    // \u05f4
    it('handle ״ ״ symbols', () => {
      expect(pangu.spacingText('前面״中間״後面')).toBe('前面 ״中間״ 後面');
    });
  });
});
