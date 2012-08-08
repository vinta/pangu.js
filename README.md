# 為什麼你們就是不能加個空格呢？

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個外掛（支援 Chrome 和 Firefox）正是你在網路世界走跳所需要的東西，它會自動替你在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。

漢學家稱這個空白字元為「盤古之白」，因為它劈開了全形字和半形字之間的混沌。另有研究顯示，打字的時候不喜歡在中文和英文之間加空格的人，感情路都走得很辛苦，有七成的比例會在 34 歲的時候跟自己不愛的人結婚，而其餘三成的人最後只能把遺產留給自己的貓。畢竟愛情跟書寫都需要適時地留白。

與大家共勉之。


## Installation

### for Users

* [Google Chrome (Extension)](https://chrome.google.com/webstore/detail/paphcfdffjnbcgkokihcdjliihicmbpd)
* [Mozilla Firefox (Userscript)](http://userscripts.org/scripts/show/129555) by [jiefoxi](https://github.com/jiefoxi)

### for Developers

* [paranoid_spacing.js](https://github.com/gibuloto/paranoid-auto-spacing/blob/master/thirdparty/paranoid_spacing.js)

``` js
// whole page spacing
paranoid_spacing.page_spacing();

// TODO
paranoid_spacing.element_spacing('#title');
paranoid_spacing.element_spacing('.comment');
paranoid_spacing.element_spacing('p');
```

插入空格的核心功能已經從 extension 中獨立出來 。不嫌棄的話，你可以在你的 project 中使用。


## License

Released under the [MIT License](http://opensource.org/licenses/MIT).


## Issues

### 尚未解決的問題：

1. 只針對特定的 id, class 或 tag 裡面的文字做 spacing
2. 在 Google Docs 中輸入英文或符號之後會發生游標錯亂的問題
3. 解析 DOM 的過程有時候會讓頁面反應變得有點遲鈍

### 解決不了的問題：

1. 需求變更（抖）
2. 準確地估算時程
3. 聽說人品不好程式就容易當


## Contact

* Twitter: [@vinta](https://twitter.com/vinta)
* Blog: [科學的愛情](http://gibuloto.com/)