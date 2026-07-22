import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol < >', () => {
  it('handle < > symbols as angle brackets', () => {
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
    // prettier-ignore
    expect(pangu.spacingText('<div><p>嵌套<strong>測試</strong></p></div>'))
                       .toBe('<div><p>嵌套<strong>測試</strong></p></div>');

    // Self-closing tags
    expect(pangu.spacingText('文字<br>換行')).toBe('文字<br>換行');
    expect(pangu.spacingText('水平線<hr>分隔')).toBe('水平線<hr>分隔');
    expect(pangu.spacingText('水平線<hr />分隔')).toBe('水平線<hr />分隔');

    // A bare unpaired non-void tag is a tag mention: spaced from CJK as one unit
    expect(pangu.spacingText('在這裡插入一個<div>標籤')).toBe('在這裡插入一個 <div> 標籤');
    expect(pangu.spacingText('型別是List<String>的容器')).toBe('型別是 List<String> 的容器');
    expect(pangu.spacingText('把文字包在<span>裡面')).toBe('把文字包在 <span> 裡面');
    expect(pangu.spacingText('每個<li>代表一個列表項目')).toBe('每個 <li> 代表一個列表項目');
    expect(pangu.spacingText('用<table>排版是過時的做法')).toBe('用 <table> 排版是過時的做法');
    expect(pangu.spacingText('HTML的<head>放的是metadata')).toBe('HTML 的 <head> 放的是 metadata');
    expect(pangu.spacingText('<html>是整份文件的根元素')).toBe('<html> 是整份文件的根元素');

    // Generic type parameters read as tag mentions too
    expect(pangu.spacingText('回傳Promise<string>就好')).toBe('回傳 Promise<string> 就好');
    expect(pangu.spacingText('用Vec<u8>儲存位元組')).toBe('用 Vec<u8> 儲存位元組');
    expect(pangu.spacingText('先引入<iostream>標頭檔')).toBe('先引入 <iostream> 標頭檔');

    // A mention next to real markup: only the mention is spaced
    expect(pangu.spacingText('<p>用<code>標記程式碼</p>')).toBe('<p>用 <code> 標記程式碼</p>');

    // <br> must stay untouched
    expect(pangu.spacingText('文字<br>換行')).toBe('文字<br>換行');
    expect(pangu.spacingText('文字<br />換行')).toBe('文字<br />換行');

    // Real-world markup stays untouched
    expect(pangu.spacingText('<ul><li>第一項</li><li>第二項</li></ul>')).toBe('<ul><li>第一項</li><li>第二項</li></ul>');
    expect(pangu.spacingText('<button disabled>送出表單</button>')).toBe('<button disabled>送出表單</button>');
    expect(pangu.spacingText('<img src="photo.jpg">上面是圖片')).toBe('<img src="photo.jpg">上面是圖片');
    expect(pangu.spacingText('這裡放<Spinner />元件')).toBe('這裡放<Spinner />元件');

    // prettier-ignore
    // FIXME
    // expect(pangu.spacingText('<attackOnJava>那一天，人類終於回想起了，曾經一度被XML所支配的恐懼</attackOnJava> <!-- 進擊的Java -->'))
    //                    .toBe('<attackOnJava>那一天，人類終於回想起了，曾經一度被 XML 所支配的恐懼</attackOnJava> <!-- 進擊的 Java -->');
  });
});
