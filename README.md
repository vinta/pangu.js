# 為什麼你們就是不能加個空格呢？

[![](https://data.jsdelivr.com/v1/package/npm/pangu/badge)](https://www.jsdelivr.com/package/npm/pangu)
[![](https://img.shields.io/npm/v/pangu.svg?style=flat-square)](https://www.npmjs.com/package/pangu)
[![](https://img.shields.io/badge/made%20with-%e2%9d%a4-ff69b4.svg?style=flat-square)](https://vinta.ws/code/)

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個 Google Chrome 外掛正是你在網路世界走跳所需要的東西，它會自動替你在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。

漢學家稱這個空白字元為「盤古之白」，因為它劈開了全形字和半形字之間的混沌。另有研究顯示，打字的時候不喜歡在中文和英文之間加空格的人，感情路都走得很辛苦，有七成的比例會在 34 歲的時候跟自己不愛的人結婚，而其餘三成的人最後只能把遺產留給自己的貓。畢竟愛情跟書寫都需要適時地留白。

與大家共勉之。

[![](browser-extensions/chrome/images/chrome_web_store_badge.png)](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd)

## Installation

### For Users

- Official support:

  - [Google Chrome Extension](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd)

- Community support:

  - [Paranoid Text Spacing](https://tools.1chooo.com/paranoid-text-spacing)
  - [盤古之白 - 文案排版轉換](https://pangu.serko.dev/)

### For Developers

- Official support:

  - [pangu.go](https://github.com/vinta/pangu)
  - [pangu.java](https://github.com/vinta/pangu.java)
  - [pangu.js](https://github.com/vinta/pangu.js)
  - [pangu.py](https://github.com/vinta/pangu.py)
  - [pangu.space](https://github.com/vinta/pangu.space)

- Community support:
  - [pangu.clj](https://github.com/coldnew/pangu.clj)
  - [pangu.dart](https://github.com/SemonCat/pangu.dart)
  - [pangu.ex](https://github.com/cataska/pangu.ex)
  - [pangu.objective-c](https://github.com/Cee/pangu.objective-c)
  - [pangu.php](https://github.com/Kunr/pangu.php)
  - [pangu.rb](https://github.com/dlackty/pangu.rb)
  - [pangu.rs](https://github.com/airt/pangu.rs)
  - [pangu.swift](https://github.com/X140Yu/pangu.Swift)

## Usage

```bash
npm install pangu --save-exact
```

Learn more on [npm](https://www.npmjs.com/package/pangu).

### Browser

#### UMD (Script Tag)

```html
<script src="pangu/dist/browser/pangu.umd.js"></script>
<script>
  const text = pangu.spacingText('當你凝視著bug，bug也凝視著你');
  // text = '當你凝視著 bug，bug 也凝視著你'

  pangu.spacingElementById('main');
  pangu.spacingElementByClassName('comment');
  pangu.spacingElementByTagName('p');

  document.addEventListener('DOMContentLoaded', () => {
    // listen to any DOM change and automatically perform spacing via MutationObserver()
    pangu.autoSpacingPage();
  });
</script>
```

#### ES Modules

```html
<script type="module">
  import { pangu } from 'pangu/browser';

  const text = pangu.spacingText('這個人老是在寫程式，是不是有bin啊？');
  // text = '這個人老是在寫程式，是不是有 bin 啊？'

  pangu.spacingElementById('main');
  pangu.spacingElementByClassName('comment');
  pangu.spacingElementByTagName('p');
</script>
```

Also on:

- https://cdn.jsdelivr.net/npm/pangu@7.2.0/dist/browser/pangu.umd.js
- https://unpkg.com/pangu@7.2.0/dist/browser/pangu.umd.js

### Node.js

```js
import pangu from 'pangu';
// or
const pangu = require('pangu');

const text = pangu.spacingText('不能信任那些Terminal或Editor用白底的人');
// text = '不能信任那些 Terminal 或 Editor 用白底的人'

const content = await pangu.spacingFile('/path/to/text.txt');
```

You **SHOULD NOT** use `pangu.js` to spacing Markdown documents, this library is specially designed for HTML webpages and plain texts without any markup language. See [issue #127](https://github.com/vinta/pangu.js/issues/127).

### CLI

```console
$ pangu "與PM戰鬥的人，應當小心自己不要成為PM"
與 PM 戰鬥的人，應當小心自己不要成為 PM

$ pangu --check "盤古新聞網：工程師會議中默不作聲，PM 恐成最大贏家"

$ pangu --help
usage: pangu [-h] [-v] [-t] [-f] [-c] text_or_path

pangu.js -- Paranoid text spacing for good readability, to automatically
insert whitespace between CJK and half-width characters (alphabetical letters,
numerical digits and symbols).

positional arguments:
  text_or_path   the text or file path to apply spacing

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -t, --text     specify the input value is a text
  -f, --file     specify the input value is a file path
  -c, --check    check if text has proper spacing (exit 0 if yes, 1 if no)
```

## Testing

You need to install [Node.js](https://vinta.ws/code/install-node-js-via-nvm.html).

```bash
$ git clone https://github.com/vinta/pangu.js.git && cd pangu.js
$ npm install
$ npm run test
```

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

## Author

- GitHub: [@vinta](https://github.com/vinta)
- Twitter: [@vinta](https://twitter.com/vinta)
- Website: [vinta.ws](https://vinta.ws/code/)
