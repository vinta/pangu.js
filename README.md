# 為什麼你們就是不能加個空格呢？

[![](https://data.jsdelivr.com/v1/package/npm/pangu/badge)](https://www.jsdelivr.com/package/npm/pangu)
[![](https://img.shields.io/travis/vinta/pangu.js.svg?style=flat-square)](https://travis-ci.org/vinta/pangu.js)
[![](https://img.shields.io/codecov/c/github/vinta/pangu.js/master.svg?style=flat-square)](https://codecov.io/github/vinta/pangu.js)
[![](https://img.shields.io/npm/v/pangu.svg?style=flat-square)](https://www.npmjs.com/package/pangu)
[![](https://img.shields.io/badge/made%20with-%e2%9d%a4-ff69b4.svg?style=flat-square)](https://vinta.ws/code/)

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個外掛（支援 Chrome 和 Firefox）正是你在網路世界走跳所需要的東西，它會自動替你在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。

漢學家稱這個空白字元為「盤古之白」，因為它劈開了全形字和半形字之間的混沌。另有研究顯示，打字的時候不喜歡在中文和英文之間加空格的人，感情路都走得很辛苦，有七成的比例會在 34 歲的時候跟自己不愛的人結婚，而其餘三成的人最後只能把遺產留給自己的貓。畢竟愛情跟書寫都需要適時地留白。

與大家共勉之。

[![](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_340x96.png)](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd)

## Installation

### For Users

- [Google Chrome](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd) (**2019-02-09 UPDATED**)
- [Mozilla Firefox](https://github.com/vinta/pangu.js/blob/master/browser_extensions/firefox/paranoid-auto-spacing.user.js) (**2019-02-09 UPDATED**)

### For Developers

- Official supports:
  - [pangu.go](https://github.com/vinta/pangu) (Go)
  - [pangu.java](https://github.com/vinta/pangu.java) (Java)
  - [pangu.js](https://github.com/vinta/pangu.js) (JavaScript)
  - [pangu.py](https://github.com/vinta/pangu.py) (Python)
  - [pangu.space](https://github.com/vinta/pangu.space) (Web API)

- Community supports:
  - [pangu.clj](https://github.com/coldnew/pangu.clj) (Clojure)
  - [pangu.dart](https://github.com/SemonCat/pangu.dart) (Dart)
  - [pangu.ex](https://github.com/cataska/pangu.ex) (Elixir)
  - [pangu.objective-c](https://github.com/Cee/pangu.objective-c) (Objective-C)
  - [pangu.php](https://github.com/Kunr/pangu.php) (PHP)
  - [pangu.rb](https://github.com/dlackty/pangu.rb) (Ruby)
  - [pangu.rs](https://github.com/airt/pangu.rs) (Rust)
  - [pangu.swift](https://github.com/X140Yu/pangu.Swift) (Swift)

## Usage

```bash
$ npm install pangu --save
# or
$ yarn add pangu
```

### Browser

Files are located in `./node_modules/pangu/dist/browser/`.

```html
<head>
  <script src="pangu.min.js"></script>
</head>
<script>
  const text = pangu.spacing("當你凝視著bug，bug也凝視著你");
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

`pangu.js` is also available on [jsDelivr](https://www.jsdelivr.com/package/npm/pangu) and [cdnjs](https://cdnjs.com/libraries/pangu):

```html
<script src="https://cdn.jsdelivr.net/npm/pangu@4.0.7/dist/browser/pangu.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pangu@4.0.7/dist/browser/pangu.min.js"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pangu/4.0.7/pangu.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pangu/4.0.7/pangu.min.js"></script>
```

### Node.js

Learn more on [npm](https://www.npmjs.com/package/pangu).

```js
const pangu = require('pangu');

const text = pangu.spacing('與PM戰鬥的人，應當小心自己不要成為PM');
// text = '與 PM 戰鬥的人，應當小心自己不要成為 PM'

pangu.spacingFile('/path/to/text.txt', (err, data) => {
  console.log(data);
});

pangu.spacingFile('/path/to/text.txt')
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    console.error(err);
  });

const data = pangu.spacingFileSync('/path/to/text.txt');
```

You **SHOULD NOT** use `pangu.js` directly to spacing Markdown documents, this library is specially designed for HTML webpages and plain texts without any markup language. See [issue #127](https://github.com/vinta/pangu.js/issues/127).

### CLI

```console
$ pangu "不能信任那些Terminal或Editor用白底的人"
不能信任那些 Terminal 或 Editor 用白底的人

$ pangu --help
usage: pangu [-h] [-v] [-t] [-f] text_or_path

pangu.js -- Paranoid text spacing for good readability, to automatically insert whitespace
between CJK and half-width characters (alphabetical letters, numerical digits and symbols).

positional arguments:
  text_or_path   the text or file path to perform spacing

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -t, --text     specify the input value is a text
  -f, --file     specify the input value is a file path
```

## Testing

You need to install [Node.js](https://vinta.ws/code/install-node-js-via-nvm.html).

```bash
$ git clone git@github.com:vinta/pangu.js.git && cd pangu.js
$ npm install
$ npm run test
```

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

## Author

- GitHub: [@vinta](https://github.com/vinta)
- Twitter: [@vinta](https://twitter.com/vinta)
- Website: [vinta.ws](https://vinta.ws/code/)
