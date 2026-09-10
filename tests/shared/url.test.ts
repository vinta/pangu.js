import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('HTTP URLs', () => {
  it('leave the inside of a URL untouched', () => {
    // Issue 155
    expect(pangu.spaceText('https://xxxxx/自动加空格.html')).toBe('https://xxxxx/自动加空格.html');
    // Issue 149
    expect(pangu.spaceText('你https://%E5%A6%82')).toBe('你 https://%E5%A6%82');
    // Issue 147
    expect(pangu.spaceText('第三條的內容為http://se.360.cn/')).toBe('第三條的內容為 http://se.360.cn/');
    // prettier-ignore
    expect(pangu.spaceText('打開此連結，https://www.google.com/search?q=%E5%9B%BD%E5%AF%86SM2%2F3%2F4%E7%AE%97%E6%B3%95+360'))
                       .toBe('打開此連結，https://www.google.com/search?q=%E5%9B%BD%E5%AF%86SM2%2F3%2F4%E7%AE%97%E6%B3%95+360');
    expect(pangu.spaceText('https://www.google.com/search?q=中文&hl=zh-TW')).toBe('https://www.google.com/search?q=中文&hl=zh-TW');
    expect(pangu.spaceText('https://zh.wikipedia.org/w/index.php?title=中文&action=history')).toBe('https://zh.wikipedia.org/w/index.php?title=中文&action=history');
    expect(pangu.spaceText('網址是https://zh.wikipedia.org/wiki/%E4%B8%AD%E6%96%87')).toBe('網址是 https://zh.wikipedia.org/wiki/%E4%B8%AD%E6%96%87');
    expect(pangu.spaceText('https://zh.wikipedia.org/wiki/中文#歷史')).toBe('https://zh.wikipedia.org/wiki/中文#歷史');
    expect(pangu.spaceText('參考https://zh.wikipedia.org/wiki/中文#歷史的說明')).toBe('參考 https://zh.wikipedia.org/wiki/中文#歷史的說明');
    expect(pangu.spaceText('https://zh.wikipedia.org/wiki/盤古')).toBe('https://zh.wikipedia.org/wiki/盤古');
  });

  it('space a URL from CJK on its left only', () => {
    // CJK characters continue the URL, so CJK prose written tight after a URL stays tight. See ADR 0026
    expect(pangu.spaceText('搜尋https://www.google.com/search?q=pangu.js&hl=zh-TW看看')).toBe('搜尋 https://www.google.com/search?q=pangu.js&hl=zh-TW看看');
    expect(pangu.spaceText('看https://github.com/vinta/pangu.js/issues/155這個issue')).toBe('看 https://github.com/vinta/pangu.js/issues/155這個issue');
    // prettier-ignore
    expect(pangu.spaceText('文件在https://developer.mozilla.org/zh-TW/docs/Web/API/URL/canParse_static這裡'))
                       .toBe('文件在 https://developer.mozilla.org/zh-TW/docs/Web/API/URL/canParse_static這裡');
    expect(pangu.spaceText('請看https://vinta.ws/code/的文章')).toBe('請看 https://vinta.ws/code/的文章');
  });

  it('stop a URL at CJK punctuation, quotes, and brackets', () => {
    expect(pangu.spaceText('請看https://vinta.ws/code/。')).toBe('請看 https://vinta.ws/code/。');
    expect(pangu.spaceText('請看https://vinta.ws/code/，謝謝')).toBe('請看 https://vinta.ws/code/，謝謝');
    expect(pangu.spaceText('（https://vinta.ws/code/）')).toBe('（https://vinta.ws/code/）');
    expect(pangu.spaceText('(https://vinta.ws/code/)')).toBe('(https://vinta.ws/code/)');
    expect(pangu.spaceText('「https://vinta.ws/code/」')).toBe('「https://vinta.ws/code/」');
  });

  it('leave trailing half-width punctuation outside the URL', () => {
    expect(pangu.spaceText('詳見https://vinta.ws/code/.')).toBe('詳見 https://vinta.ws/code/.');
  });

  it('leave a URL inside an attribute value untouched', () => {
    expect(pangu.spaceText('<a href="https://zh.wikipedia.org/wiki/中文#歷史">中文</a>')).toBe('<a href="https://zh.wikipedia.org/wiki/中文#歷史">中文</a>');
    // prettier-ignore
    expect(pangu.spaceText('<a href="http://vinta.ws/中文網址with英文.html">oh一個超連結with英文，網址包含中文</a>'))
                       .toBe('<a href="http://vinta.ws/中文網址with英文.html">oh 一個超連結 with 英文，網址包含中文</a>');
  });

  it('space a hashtag on a line that also holds a URL', () => {
    expect(pangu.spaceText('看完這篇#pangu 的介紹 https://vinta.ws/code/')).toBe('看完這篇 #pangu 的介紹 https://vinta.ws/code/');
  });

  it('leave a URL with no CJK contact untouched', () => {
    expect(pangu.spaceText('see https://vinta.ws/code/ and 中文')).toBe('see https://vinta.ws/code/ and 中文');
  });
});
