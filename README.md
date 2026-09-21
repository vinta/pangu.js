# 為什麼你們就是不能加個空格呢？

[![npm Version](https://img.shields.io/npm/v/pangu?style=for-the-badge)](https://www.npmjs.com/package/pangu)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/paphcfdffjnbcgkokihcdjliihicmbpd?style=for-the-badge)](https://chromewebstore.google.com/detail/paphcfdffjnbcgkokihcdjliihicmbpd)<br>
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/paphcfdffjnbcgkokihcdjliihicmbpd?style=for-the-badge&label=rating)](https://chromewebstore.google.com/detail/paphcfdffjnbcgkokihcdjliihicmbpd/reviews)
[![jsDelivr Hits](https://img.shields.io/jsdelivr/npm/hm/pangu?style=for-the-badge)](https://www.jsdelivr.com/package/npm/pangu)
[![npm Downloads](https://img.shields.io/npm/dm/pangu?style=for-the-badge&label=npm)](https://www.npmjs.com/package/pangu)

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個 Google Chrome 外掛正是你在網路世界走跳所需要的東西，它會自動替你在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。

漢學家稱這個空白字元為「盤古之白」，因為它劈開了全形字和半形字之間的混沌。另有研究顯示，打字的時候不喜歡在中文和英文之間加空格的人，感情路都走得很辛苦，有七成的比例會在 34 歲的時候跟自己不愛的人結婚，而其餘三成的人最後只能把遺產留給自己的貓。畢竟愛情跟書寫都需要適時地留白。

與大家共勉之。

[![](browser-extensions/chrome/images/chrome_web_store_badge.png)](https://chromewebstore.google.com/detail/paphcfdffjnbcgkokihcdjliihicmbpd)

## Installation

### For Users

- Official support:
  - [Google Chrome Extension](https://chromewebstore.google.com/detail/paphcfdffjnbcgkokihcdjliihicmbpd)
- Community support:
  - [Paranoid Text Spacing](https://tools.1chooo.com/paranoid-text-spacing)
  - [盤古之白 - 文案排版轉換](https://pangu.serko.dev/)

### For Developers

- Official support:
  - [pangu.js](https://github.com/vinta/pangu.js)
  - [pangu.py](https://github.com/vinta/pangu.py)
  - [pangu.go](https://github.com/vinta/pangu)
  - [pangu.java](https://github.com/vinta/pangu.java)
  - [pangu.space](https://github.com/vinta/pangu.space) (Website and HTTP API)
- Community support:
  - [pangu.clj](https://github.com/coldnew/pangu.clj)
  - [pangu.dart](https://github.com/SemonCat/pangu.dart)
  - [pangu.ex](https://github.com/cataska/pangu.ex)
  - [pangu.objective-c](https://github.com/Cee/pangu.objective-c)
  - [pangu.php](https://github.com/Kunr/pangu.php)
  - [pangu.rb](https://github.com/dlackty/pangu.rb)
  - [pangu.rs](https://github.com/airt/pangu.rs)
  - [pangu.swift](https://github.com/X140Yu/pangu.Swift)
  - [pangu.skill](https://github.com/shihyuho/pangu.skill)

## Chrome Extension

Install [為什麼你們就是不能加個空格呢？](https://chromewebstore.google.com/detail/paphcfdffjnbcgkokihcdjliihicmbpd) and it spaces every page you browse. It also comes with the **AI Spacing** feature:

### AI Spacing

The same symbol can mean totally different things in different contexts:

- For `+`:
  - `這裡沒有18+的內容` means "or more" => `這裡沒有 18+ 的內容`
  - `Switch 2+瑪利歐賽車世界同捆組` joins two things => `Switch 2 + 瑪利歐賽車世界同捆組`
- For `-`:
  - `女朋友今天的氣溫是-273.15度` is a negative number => `女朋友今天的氣溫是 -273.15 度`
  - `博客來-4% 法則：讓錢活得比你久的提領金律` is a separator => `博客來 - 4% 法則：讓錢活得比你久的提領金律`

Regex rules can't distinguish semantic nuances like these, so the extension asks an LLM. It uses Chrome's built-in [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), which runs Gemini Nano on your device. Fully offline, nothing leaves your machine. It's free, btw.

GPT-6 Astra writes the prompts. It runs the [prompt-experiments](.agents/skills/prompt-experiments/SKILL.md) skill: propose a change, then test it against the real Gemini Nano in Chrome. When a case fails, it interviews Gemini Nano for clues. When progress stalls, it searches online for new approaches to test. Prompts for a model, tuned by a bigger model, judged on real data.

## JavaScript Library

Opinionated paranoid text spacing: automatically inserts whitespace between CJK (Chinese, Japanese, Korean) and ANS (alphabetical letters, numerical digits and symbols).

```bash
npm install pangu --save-exact
```

See the [changelog](CHANGELOG.md) or [npm](https://www.npmjs.com/package/pangu) for details.

### Browser

**Make sure to import from `pangu/browser`** in ESM, which is the DOM-aware build (`spaceNode()`, `autoSpacePage()`) with matching TypeScript types and resolves correctly across all bundlers.

```js
import pangu from 'pangu/browser';
// or
// <script src="https://cdn.jsdelivr.net/npm/pangu@latest/dist/browser/pangu.umd.js"></script>

const text = pangu.spaceText('當你凝視著bug，bug也凝視著你');
// text = '當你凝視著 bug，bug 也凝視著你'

pangu.spaceNode(document.getElementById('main'));

if (document.readyState === 'loading') {
  // Start automatic text spacing once the page is ready
  // Consume the stream of DOM mutations and space dynamic content via MutationObserver
  document.addEventListener('DOMContentLoaded', () => pangu.autoSpacePage());
} else {
  pangu.autoSpacePage();
}
```

Also on:

- [jsDelivr](https://www.jsdelivr.com/package/npm/pangu)
  - `https://cdn.jsdelivr.net/npm/pangu@x.y.z/dist/browser/pangu.umd.js`
- [unpkg](https://app.unpkg.com/pangu)
  - `https://unpkg.com/pangu@x.y.z/dist/browser/pangu.umd.js`
- [cdnjs](https://cdnjs.com/libraries/pangu)
  - `https://cdnjs.cloudflare.com/ajax/libs/pangu/x.y.z/browser/pangu.umd.min.js`

Replace `x.y.z` with the version you want to use.

### Node.js

```js
import pangu from 'pangu';
// or
// const pangu = require('pangu');

const text = pangu.spaceText('與PM戰鬥的人，應當小心自己不要成為PM');
// text = '與 PM 戰鬥的人，應當小心自己不要成為 PM'

const content = await pangu.spaceFile('/path/to/text.txt');
```

You **SHOULD NOT** use `pangu.js` to space Markdown documents, this library is specially designed for HTML webpages and plain texts without any markup language. See [issue #127](https://github.com/vinta/pangu.js/issues/127).

### CLI

```bash
$ pangu "不能信任那些Terminal或Editor用白底的人"
不能信任那些 Terminal 或 Editor 用白底的人

$ pangu -t "你在每個commit裡修改的程式碼越多，你在code review時被發現的錯誤就會越少"
你在每個 commit 裡修改的程式碼越多，你在 code review 時被發現的錯誤就會越少

$ pangu -f path/to/file.txt
新來的 Designer 趁特價的時候幫自己買了一本 GoF Design Patterns

$ pangu -c "盤古新聞網：工程師會議中默不作聲，PM恐成最大贏家"; echo $?
Corrected: 盤古新聞網：工程師會議中默不作聲，PM 恐成最大贏家
1

$ echo "他們在release的前一天爆炸" | pangu
他們在 release 的前一天爆炸
```

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

## Author

- GitHub: [@vinta](https://github.com/vinta)
- Twitter: [@vinta](https://twitter.com/vinta)
- Website: [vinta.ws](https://vinta.ws/code/)
