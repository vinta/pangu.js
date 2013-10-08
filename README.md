# 為什麼你們就是不能加個空格呢？

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個外掛（支援 Chrome 和 Firefox）正是你在網路世界走跳所需要的東西，它會自動替你在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。

漢學家稱這個空白字元為「盤古之白」，因為它劈開了全形字和半形字之間的混沌。另有研究顯示，打字的時候不喜歡在中文和英文之間加空格的人，感情路都走得很辛苦，有七成的比例會在 34 歲的時候跟自己不愛的人結婚，而其餘三成的人最後只能把遺產留給自己的貓。畢竟愛情跟書寫都需要適時地留白。

與大家共勉之。


## Installation


### for Users

* [Google Chrome (Extension)](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd)
* [Mozilla Firefox (Userscript)](http://userscripts.org/scripts/show/129555)


### for Developers

* [pangu.js](https://github.com/gibuloto/paranoid-auto-spacing/blob/develop/vendors/pangu.js)（盤古）

![Pangu](https://raw.github.com/gibuloto/paranoid-auto-spacing/develop/images/pangu_260.jpg)

``` js
// whole page spacing
pangu.page_spacing();

// by id
pangu.element_spacing('#title');

// by class
pangu.element_spacing('.comment');

// by tag
pangu.element_spacing('p');
```

插入空格的功能已經從 extension 中獨立出來 。不嫌棄的話，你可以在你的 project 中使用。


## License

Released under the [MIT License](http://opensource.org/licenses/MIT).


## Author

* Twitter: [@vinta](https://twitter.com/vinta)
* Blog: [vinta.ws](http://vinta.ws/)


## Contributors

* [ChanCheng](https://github.com/ChanCheng)
* [jiefoxi](https://github.com/jiefoxi)
* [xslidian](https://github.com/xslidian)

偉哉 Open Source！


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/vinta/paranoid-auto-spacing/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

