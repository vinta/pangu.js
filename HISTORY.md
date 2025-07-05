# History

## v7.2.0 / 2025-07-05

- 趁末日前更新一下，不然以後就沒機會了
- 修正在 Google Calendar 會不小心在 CSS 隱藏元素與中文之間加空格的問題

## v7.0.0 / 2025-07-02

- 各位觀眾！Paranoid Text Spacing 演算法 v7 橫空出世！
  - 會自動判斷某些元素是不是被 CSS 隱藏來決定要不要加空格
  - 不會把半形的標點符號轉成全形了
- 史詩級性能提升！
  - 把 XPath 換成 [TreeWalker](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)，快他媽 5 倍！
  - 比較慢的操作都丟到 [requestIdleCallback()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)，內容太多的網站終於不卡了！

## v6.1.3 / 2025-07-01

- 修正 Asana 的 comments 會被重複加空格的問題

## v6.1.2 / 2025-06-30

- 修正 Node.js imports

## v6.1.0 / 2025-06-30

- 各位觀眾！Paranoid Text Spacing 演算法 v6.1
  - 好啦好啦，我要去玩死亡擱淺 2 了

## v6.0.0 / 2025-06-28

- 各位觀眾！Paranoid Text Spacing 演算法 v6
  - 特別處理了各種括號 `()` `[]` `{}` `<>` 和 `/` 的問題，仁至義盡了

## v5.3.2 / 2025-06-27

- 在 popup 加了一個方便把目前的網址加到黑名單的按鈕

## v5.2.0 / 2025-06-26

- 各位觀眾！Paranoid Text Spacing 演算法 v5

## v5.1.1 / 2025-06-24

- 偉哉 Claude Code，精雕細琢的 v5.1.0 終於推出啦！
- 雖然看起來好像只是換了一個新 UI，但是爽啦！

## v5.0.0 / 2025-06-17

- 請 Claude Code 把 Chrome extension 升級成 Manifest v3 了
- 請 Claude Code 幫我把 codebase 改寫成 TypeScript 了

## v4.0.7 / 2019-02-15

- 修正 `“ ”` 的問題

## v4.0.6 / 2019-02-04

- 修正 `,` 的問題
- 新增 `pangu` 指令

## v4.0.5 / 2019-01-30

- 修正 `<pre>` 的問題

## v4.0.4 / 2019-01-29

- 修正 Bilibili 影片會消失的問題

## v4.0.3 / 2019-01-29

- 修正 `node.isContentEditable` 的問題

## v4.0.2 / 2019-01-29

- 修正 `<code>` 的問題
- 修正 `<i>` 的問題
- 修正 `・` 的問題

## v4.0.0 / 2019-01-27

- 各位觀眾！Paranoid Text Spacing 演算法 v4
- 大幅地改進 Chrome extension 的效能，使用 `MutationObserver` 和 `debounce`
- 忍痛拿掉「空格之神顯靈了」
- 修正 `Pangu.spacingText()` 的 error callback
- 新增 `BrowserPangu.autoSpacingPage()`

## v3.3.0 / 2016-12-28

- 修個 bug 好過年
- 修正在 Twitter 上跟 Buffer 一起使用時會隨機出現的錯誤問題

## v3.2.1 / 2016-06-26

- 又他媽改善效能問題

## v3.2.0 / 2016-06-26

- 修正效能問題

## v3.1.1 / 2016-06-26

- 剛吃完烤肉來改進一下 Paranoid Text Spacing 演算法

## v3.1.0 / 2016-06-25

- `NodePangu` 新增 `spacingFile()`，支援 callback 與 promise
- `NodePangu` 新增 `spacingFileSync()`

## v3.0.0 / 2016-01-10

- Isomorphic!

## v2.5.6 / 2015-05-13

- 大家好，很抱歉這麼快又跟大家見面了

## v2.5.5 / 2015-05-13

- 持續改進 Paranoid Text Spacing 演算法

## v2.5.1 / 2015-05-11

- 再次改進 Paranoid Text Spacing 演算法

## v2.5.0 / 2015-05-11

- 改進 Paranoid Text Spacing 演算法

## v2.4.2 / 2014-12-10

- 修正 Facebook 留言框的空格錯位

## v2.4.1 / 2014-12-10

- 修正 `<title>` 網頁標題的加空格
- 修正 `'` 單引號的加空格

## v2.4.0 / 2014-12-08

- 改進效能
- 完善對雙引號的處理
- 修正 Popup Page 的 CSS 問題

## v2.3.4 / 2014-03-01

- 再度完善 Paranoid Text Spacing 演算法
- 修正 Options Page 的小錯誤

## v2.3.3 / 2014-02-16

- 完善 Paranoid Text Spacing 演算法

## v2.3.2 / 2014-02-12

- 心血來潮，加個版本號！

## v2.3.1 / 2014-02-10

- 真的不會對 `<code>` 和 `<pre>` 裡的文字加空格了

## v2.3.0 / 2014-02-08

- 威力加強版！
- 解決特定情況下在同一個地方會一直加空格的問題

## v2.2.3 / 2014-02-07

- 不會在 Google+ 的輸入框裡加空格
- 記事本不懂 Vim 的黑

## v2.2.2 / 2014-02-07

- 銀河大客車指南！

## v2.2.1 / 2014-02-05

- 改進 Paranoid Text Spacing 演算法

## v2.1.2 / 2014-02-01

- 不會對 `<textarea>` 裡的文字加空格！

## v2.1.1 / 2014-01-31

- 不對 `_` 加空格
- 對 `|` 加空格
- 新增 Popup Page
- 空格之神 姍姍來遲

## v2.1.0 / 2014-01-29

- 解決在 Facebook、Twitter、QQ 空间、百度贴吧等網站輸入文字時游標會亂衝的問題
- 支援 `file:///` 開頭的網頁

## v2.0.2 / 2014-01-26

- 遇到 `<br>` 就不加空格

## v2.0.1 / 2014-01-25

- 拿掉 `console.log()`
- 修正 Option Page footer 裡的超連結

## v2.0.0 / 2014-01-24

- 新年新氣象，翻新 Option Page 的 UI 和 Icon
- 網址黑白名單可以使用 Chrome 的同步功能（Chrome Storage API）
- 修正在 Gmail 中加空格的問題
- 改善效率問題

## v1.8 / 2013-09-17

- 修正在 Google Docs 中游標錯位的問題
- 網址黑、白名單支援 `//` 前綴

## v1.7 / 2012-04-08

- 減少 Chrome extension 的大小

## v1.6 / 2012-04-04

- 感謝 [@jiefoxi](https://github.com/jiefoxi)，現在英文超連結和中文之間也會加上空格了

## v1.5 / 2012-04-04

- 新增 Firefox 版本
- 目前支援「中文（繁體、簡體）」、「日文（漢字、平假名、片假名）」加空格
- 修正網址黑白名單沒有作用的問題

## v1.3 / 2012-03-20

- 根據 [@Fenng](https://github.com/Fenng) 的回報，修正了「新浪微博的 `@` 符號之後不要加空格」的問題
- 新增「簡體中文」語系

## v1.0 / 第一份工作的某一個下班日

- Paranoid Text Spacing 演算法橫空出世
