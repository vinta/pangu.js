// ==UserScript==
// @name         為什麼你們就是不能加個空格呢？
// @description  自動在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。（攤手）沒辦法，處女座都有強迫症。
// @author       Vinta
// @version      1.4
// @include      http*://*
// ==/UserScript==

/*
 Author: Vinta <http://vinta.ws/>
 Source: <https://github.com/gibuloto/paranoid-auto-spacing>
 License: [GNU General Public License v3.0 (GPL-3.0)](http://www.gnu.org/copyleft/gpl.html)
 */


function insert_space(text) {
    // 英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
    // 中文 ([\u4E00-\u9FFF])
    // 日文 ([\u3040-\u30FF])
    // http://www.diybl.com/course/6_system/linux/Linuxjs/20090426/165435.html

    // 中文在前
    text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])([a-z0-9@#&;=_\[\$\%\^\*\-\+\(\/])/ig, '$1 $2');

    // 中文在後
    text = text.replace(/([a-z0-9#!~&;=_\]\,\.\:\?\$\%\^\*\-\+\)\/])([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $2');

    // 考慮增加 - + / * 前後的空白
    return text;
}


function traversal_and_spacing() {
    var current_documant = window.document;

    /*
     // >> 選擇任意位置的某個節點
     . >> 自己這個節點
     .. >> 父節點
     text() >> 尋找某點的文字型別，例如 hello 之於 <tag>hello</tag>
     normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白

     另外 XML 是 case-sensitive 的
     試試 [translate(name(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="html"]
     而 lower-case(name(..)) 不起作用
     */

    var xpath_query = '//text()[normalize-space(.)][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="script"][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="style"]';

    var nodes = current_documant.evaluate(xpath_query, current_documant, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

    // snapshotLength 要配合 XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE 使用
    var nodes_length = nodes.snapshotLength;

    for (var i = 0; i < nodes_length; ++i) {
        var current_node = nodes.snapshotItem(i);

        // .data 是 XML DOM 的屬性
        // http://www.w3school.com.cn/xmldom/dom_text.asp
        current_node.data = insert_space(current_node.data);
    }
}


function request_spacing() {
    traversal_and_spacing();
}


/*
 這一段是為了對付那些 AJAX 加載進來的內容
 當頁面 DOM 有變動時
 就再執行一次 spacing

 但是我要怎麼分辨由 ajax 引起的 DOM insert 和 spacing 造成的 DOM insert？
 */
var had_spacing; // 是不是剛剛執行完 spacing
var last_spacing_time = 0; // 0 means there were never any requests sent
document.addEventListener('DOMNodeInserted', function () {
    var d = new Date();
    var current_time = d.getTime(); // get the time of this change event
    var interval = current_time - last_spacing_time; // how many milliseconds since the last request

    if (interval >= 1000) { // more than 1 second
        last_spacing_time = current_time; // set last_spacing_time for next change event

        if (!had_spacing) {
            had_spacing = setTimeout(function () {
                request_spacing();
                had_spacing = null;
            }, 1000);
        }
    }
}, false);


// 網頁載入後就先判斷一次要不要執行 spacing
request_spacing();