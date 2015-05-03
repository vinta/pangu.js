# 為什麼你們就是不能加個空格呢？

[![Build Status](http://img.shields.io/travis/vinta/paranoid-auto-spacing.svg?style=flat-square)](https://travis-ci.org/vinta/paranoid-auto-spacing)
[![Coverage Status](http://img.shields.io/coveralls/vinta/paranoid-auto-spacing.svg?style=flat-square)](https://coveralls.io/r/vinta/paranoid-auto-spacing)
[![Dependency Status](http://img.shields.io/gemnasium/vinta/paranoid-auto-spacing.svg?style=flat-square)](https://gemnasium.com/vinta/paranoid-auto-spacing#development-dependencies)

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個外掛（支援 Chrome 和 Firefox）正是你在網路世界走跳所需要的東西，它會自動替你在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。

漢學家稱這個空白字元為「盤古之白」，因為它劈開了全形字和半形字之間的混沌。另有研究顯示，打字的時候不喜歡在中文和英文之間加空格的人，感情路都走得很辛苦，有七成的比例會在 34 歲的時候跟自己不愛的人結婚，而其餘三成的人最後只能把遺產留給自己的貓。畢竟愛情跟書寫都需要適時地留白。

與大家共勉之。

## Installation

### for Users

* [Google Chrome](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd) (2014-12-10 updated)
* [Mozilla Firefox](https://github.com/vinta/paranoid-auto-spacing/raw/master/browser_extensions/firefox/paranoid-auto-spacing.user.js) (2014-12-06 updated)

### for Developers

* Go version: [pangu.go](https://github.com/vinta/pangu)
* Java version: [pangu.java](https://github.com/vinta/pangu.java)
* JavaScript version: [pangu.js](https://github.com/vinta/paranoid-auto-spacing/blob/master/src/pangu.js)
* Node.js version: [pangu.node](https://github.com/huei90/pangu.node)
* Python version: [pangu.py](https://github.com/vinta/pangu.py)

![Pangu](https://raw.github.com/vinta/paranoid-auto-spacing/master/browser_extensions/chrome/images/pangu_260.jpg)

## Usage

``` bash
$ bower install pangu
```

``` html
<head>
  <meta charset="UTF-8">
  <script src="bower_components/pangu/dist/pangu.min.js"></script>
</head>
<script>
  pangu.page_spacing();
  // or
  pangu.element_spacing('#main');
  // or
  pangu.element_spacing('.comment');
  // or
  pangu.element_spacing('p');
</script>
```

## Run Tests

You need to install [Node.js](http://vinta.ws/code/install-node-js-via-nvm.html).

``` bash
$ gem install sass
$ npm install -g grunt-cli
$ npm install
$ grunt test
```

## License

Released under the [MIT License](http://opensource.org/licenses/MIT).

## Author

* Twitter: [@vinta](https://twitter.com/vinta)
* Website: [vinta.ws](http://vinta.ws/)

## Contributors

[偉哉 Open Source！](https://github.com/vinta/paranoid-auto-spacing/graphs/contributors)

## Related Projects

* Emacs: [pangu-spacing](http://coldnew.github.io/blog/2013/05/20_5cbb7.html)
* Gulp: [gulp-pangu](https://github.com/7kfpun/gulp-pangu)
* JavaScript: [为什么我就是能这样娴熟地加上空格呢？](https://github.com/Dustland/daft-auto-spacing)
* Ruby: [auto-correct](https://github.com/huacnlee/auto-correct)
* Vim: [pangu.vim](https://github.com/hotoo/pangu.vim)
* WordPress: [Space Lover](https://wordpress.org/plugins/space-lover/)
* 知乎: [Mountain Reviewer](http://zhuanlan.zhihu.com/pointless/19744560)
