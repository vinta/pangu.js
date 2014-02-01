// ==UserScript==
// @name         為什麼你們就是不能加個空格呢？
// @namespace    http://vinta.ws/
// @description  自動在網頁中所有的中文和半形的英文、數字、符號之間插入空白。（攤手）沒辦法，處女座都有強迫症。
// @version      2.1.2
// @include      *
//
// @author       Vinta
// @homepage     https://github.com/vinta/paranoid-auto-spacing
// @contributor  https://github.com/vinta/paranoid-auto-spacing/graphs/contributors
// @license      The MIT License (MIT); http://opensource.org/licenses/MIT
// ==/UserScript==

var is_spacing = false; // 是不是正在插入空格？
var last_spacing_time = 0; // 避免短時間內一直在執行 go_spacing()

(function(pangu) {

    /*
     1.
     硬幹 contentEditable 元素的 child nodes 還是會被 spacing 的問題
     contentEditable 的值可能是 'true', 'false', 'inherit'
     如果沒有顯式地指定 contentEditable 的值
     一般都會是 'inherit' 而不是 'false'

     2.
     不要對 <code>、<pre> 或 <textarea> 裡的文字加空格
     關於這個我還不是很確定
     所以先註解掉

     TODO:
     太暴力了，應該有更好的解法
     */
    function can_ignore_node(node) {
        var parent_node = node.parentNode;
        // var stop_tags = /^(code|pre|textarea)$/i;
        var stop_tags = /^(textarea)$/i;
        while (parent_node) {
            if (parent_node.contentEditable === 'true') {
                return true;
            }
            else if (parent_node.nodeName.search(stop_tags) >= 0) {
                return true;
            }
            else {
                parent_node = parent_node.parentNode;
            }
        }

        return false;
    }

    /*
     nodeType: http://www.w3schools.com/dom/dom_nodetype.asp
     1: ELEMENT_NODE
     3: TEXT_NODE
     8: COMMENT_NODE
     */
    function is_first_text_child(parent_node, target_node) {
        var child_nodes = parent_node.childNodes;

        // 只判斷第一個含有 text 的 node
        for (var i = 0; i < child_nodes.length; i++) {
            child_node = child_nodes[i];
            if (child_node.nodeType != 8 && child_node.textContent) {
                return child_node == target_node;
            }
        }

        return false;
    }

    function is_last_text_child(parent_node, target_node) {
        var child_nodes = parent_node.childNodes;

        // 只判斷倒數第一個含有 text 的 node
        for (var i = child_nodes.length - 1; i > -1; i--) {
            child_node = child_nodes[i];
            if (child_node.nodeType != 8 && child_node.textContent) {
                return child_node == target_node;
            }
        }

        return false;
    }

    function insert_space(text) {
        /*
         英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
         中文 ([\u4E00-\u9FFF])
         日文 ([\u3040-\u30FF])
         http://www.diybl.com/course/6_system/linux/Linuxjs/20090426/165435.html
         */

        // 前面"字"後面 >> 前面 "字" 後面
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])(["'](\S+))/ig, '$1 $2');
        text = text.replace(/((\S+)["'])([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $3'); // $2 是 (\S+)

        // 前面#字#後面 >> 前面 #字# 後面
        // ex: 新浪微博的 hashtag 格式
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])(#(\S+))/ig, '$1 $2');
        text = text.replace(/((\S+)#)([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $3'); // $2 是 (\S+)

        // 中文在前
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])([a-z0-9@&=\|\[\$\%\^\*\-\+\(\/\\])/ig, '$1 $2');

        // 中文在後
        text = text.replace(/([a-z0-9!~&;=\|\]\,\.\:\?\$\%\^\*\-\+\)\/\\])([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $2');

        return text;
    }

    function spacing(xpath_query) {
        // 是否加了空格
        var had_spacing = false;

        /*
         因為 xpath_query 用的是 text()，所以這些 nodes 是 text 而不是 DOM element
         https://developer.mozilla.org/en-US/docs/DOM/document.evaluate
         http://www.w3cschool.cn/dom_xpathresult.html

         snapshotLength 要配合 XPathResult.ORDERED_NODE_SNAPSHOT_TYPE 使用
         */
        var text_nodes = document.evaluate(xpath_query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        var nodes_length = text_nodes.snapshotLength;

        var next_text_node;

        // 從最下面、最裡面的節點開始
        for (var i = nodes_length - 1; i > -1; --i) {
            var current_text_node = text_nodes.snapshotItem(i);
            // console.log('current_text_node: %O, nextSibling: %O', current_text_node, current_text_node.nextSibling);
            // console.log('next_text_node: %O', next_text_node);

            if (can_ignore_node(current_text_node)) {
                continue;
            }

            /*
             .data 是 XML text node 的屬性
             http://www.w3school.com.cn/xmldom/dom_text.asp
             */
            var new_data = insert_space(current_text_node.data);
            if (current_text_node.data != new_data) {
                had_spacing = true;
                current_text_node.data = new_data;
            }

            // 處理嵌套的 <tag> 中的文字
            if (next_text_node) {
                /*
                 TODO:
                 現在只是簡單地判斷相鄰的下一個 node 是不是 <br>
                 萬一遇上嵌套的標籤就不行了
                 */
                if (current_text_node.nextSibling) {
                    if (current_text_node.nextSibling.nodeName.search(/^br$/i) >= 0) {
                        continue;
                    }
                }

                // current_text_node 的最後一個字 + next_text_node 的第一個字
                var text = current_text_node.data.toString().substr(-1) + next_text_node.data.toString().substr(0, 1);
                var new_text = insert_space(text);

                var outside_spacing_tags = /^(a|del|p|s|strike|u)$/i;

                if (text != new_text) {
                    had_spacing = true;

                    /*
                     往上找 next_text_node 的 parent node
                     直到遇到 outside_spacing_tags
                     而且 next_text_node 必須是第一個 text child
                     才能把空格加在 next_text_node 的前面
                     */
                    var next_node = next_text_node;
                    while (next_node.parentNode
                        && next_node.nodeName.search(outside_spacing_tags) == -1
                        && is_first_text_child(next_node.parentNode, next_node)) {
                        next_node = next_node.parentNode;
                    }

                    var current_node = current_text_node;
                    while (current_node.parentNode
                        && current_node.nodeName.search(outside_spacing_tags) == -1
                        && is_last_text_child(current_node.parentNode, current_node)) {
                        current_node = current_node.parentNode;
                    }

                    /*
                     不要把空格加在 <not_spacing_tag> 裡文字的開頭或結尾
                     因為會有底線

                     X: <p><a>漢字 </a>abc</p>
                     O: <p><a>漢字</a> abc</p>
                     */
                    if (next_node.nodeName.search(outside_spacing_tags) == -1) {
                        next_text_node.data = " " + next_text_node.data;
                    }
                    else if (current_node.nodeName.search(outside_spacing_tags) == -1) {
                        current_text_node.data = current_text_node.data + " ";
                    }
                    else {
                        /*
                         避免 <p>123</p> <p>漢字</p> 的情況發生
                         空格會被加在兩個 <p> 之間
                         */
                        if (next_node.nodeName.search(/^(p)$/i) == -1 ) {
                            next_node.parentNode.insertBefore(document.createTextNode(" "), next_node);
                        }
                    }
                }
            }

            next_text_node = current_text_node;
        }

        // console.log('had_spacing: %O', had_spacing);

        return had_spacing;
    }

    // 對整個 window.document 加空格
    pangu.page_spacing = function() {
        // var start = new Date().getTime();

        /*
         // >> 選擇任意位置的節點
         . >> 自己這個節點
         .. >> 父節點
         text() >> 節點的文字內容，例如 hello 之於 <tag>hello</tag>
         normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白
         translate() >> 將所查詢的字串轉換成小寫，因為 XML 是 case-sensitive 的
         */

        // 不要處理 <script> 和 <style> 裡的內容
        var not_parse_tags = ['script', 'style'];
        var extra_query = '';
        not_parse_tags.forEach(function(tag) {
            // ex: [translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="script"]
            extra_query += '[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="' + tag + '"]';
        });

        // 處理 <title>
        var xpath_query_title = '/html/head/title/text()';
        spacing(xpath_query_title);

        /*
         1. 只處理 <body> 底下的節點 >> var xpath_query = '/html/body//text()[normalize-space(.)]' + extra_query;
         2. 略過 contentEditable 的節點
         */
        var xpath_query = '/html/body//*[not(@contenteditable)]/text()[normalize-space(.)]' + extra_query;
        var had_spacing = spacing(xpath_query);

        // var end = new Date().getTime();
        // console.log(end - start);

        return had_spacing;
    };

}(window.pangu = window.pangu || {}));

function go_spacing() {
    is_spacing = true;
    pangu.page_spacing();
    is_spacing = false;
    last_spacing_time = new Date().getTime(); // set last_spacing_time for next change event
}

go_spacing();

/*
 這一段是為了對付那些 AJAX 加載進來的內容
 當頁面 DOM 有變動時
 就再執行一次 spacing

 要怎麼分辨由 AJAX 引起的 DOM insert 和 spacing 造成的 DOM insert？
 只好設置一個 timeout 時間
 */
var spacing_timer;
document.addEventListener('DOMNodeInserted', function() {
    var interval = new Date().getTime() - last_spacing_time; // how many milliseconds since the last request
    if (interval >= 1000) { // more than 1 second
        if (!is_spacing) {
            clearTimeout(spacing_timer);
            spacing_timer = setTimeout(function() {
                go_spacing();
            }, 500);
        }
    }
}, false);
