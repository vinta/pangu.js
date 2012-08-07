/*
 Name: paranoid_spacing.js
 Version: 1.7
 URL: https://github.com/gibuloto/paranoid-auto-spacing
 Author: Vinta
 License: GNU General Public License v3.0 (GPL-3.0)

 Description:
 在網頁中的中文字和半形的英文、數字、符號之間插入空白。（攤手）沒辦法，處女座都有強迫症。

 Usage:
 paranoid_spacing.page_spacing();

 // 以下功能尚未完成，喔，應該說根本還沒開始做
 paranoid_spacing.element_spacing('#title');
 paranoid_spacing.element_spacing('.comment');
 paranoid_spacing.element_spacing('p');
 */

(function(paranoid_spacing) {

    /* Private Methods */

    function insert_space(text) {
        // 英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
        // 中文 ([\u4E00-\u9FFF])
        // 日文 ([\u3040-\u30FF])
        // http://www.diybl.com/course/6_system/linux/Linuxjs/20090426/165435.html

        // 中文在前
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])([a-z0-9@&;=_\[\$\%\^\*\-\+\(\/])/ig, '$1 $2');

        // 中文在後
        text = text.replace(/([a-z0-9!~&;=_\]\,\.\:\?\$\%\^\*\-\+\)\/])([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $2');

        // 考慮增加 - + / * 前後的空白

        return text;
    }


    /* Public Methods */

    /*
     對整個 window.document 加空格
     */
    paranoid_spacing.page_spacing = function() {
        var firstTextChild = function (parentNode, targetChild) {
            var childNodes = parentNode.childNodes;
            for (var i = 0; i < childNodes.length && childNodes[i] != targetChild; i++) {
                if (childNodes[i].nodeType != 8 && childNodes[i].textContent) {
                    return childNodes[i];
                }
            }

            return targetChild;
        };

        var lastTextChild = function (parentNode, targetChild) {
            var childNodes = parentNode.childNodes;
            for (var i = childNodes.length - 1; i > -1 && childNodes[i] != targetChild; i--) {
                if (childNodes[i].nodeType != 8 && childNodes[i].textContent) {
                    return childNodes[i];
                }
            }

            return targetChild;
        };

        var current_document = window.document;

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

        var nodes = current_document.evaluate(xpath_query, current_document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

        // snapshotLength 要配合 XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE 使用
        var nodes_length = nodes.snapshotLength;

        var next_node;

        for (var i = nodes_length - 1; i > -1; --i) {
            var current_node = nodes.snapshotItem(i);

            // .data 是 XML DOM 的屬性
            // http://www.w3school.com.cn/xmldom/dom_text.asp
            current_node.data = insert_space(current_node.data);

            if (next_node) {
                var text = current_node.data.toString().substr(-1) + next_node.data.toString().substr(0, 1);
                var newText = insert_space(text);

                if (text != newText) {
                    var next_temp = next_node;
                    while (next_temp.parentNode && next_temp.nodeName.search(/^(a|u)$/i) == -1 && firstTextChild(next_temp.parentNode, next_temp) == next_temp) {
                        next_temp = next_temp.parentNode;
                    }

                    var current_temp = current_node;
                    while (current_temp.parentNode && current_temp.nodeName.search(/^(a|u)$/i) == -1 && lastTextChild(current_temp.parentNode, current_temp) == current_temp) {
                        current_temp = current_temp.parentNode;
                    }

                    if (next_temp.nodeName.search(/^(a|u)$/i) == -1) {
                        next_node.data = " " + next_node.data;
                    } else if (current_temp.nodeName.search(/^(a|u)$/i) == -1) {
                        current_node.data = current_node.data + " ";
                    } else {
                        next_temp.parentNode.insertBefore(document.createTextNode(" "), next_temp);
                    }
                }
            }

            next_node = current_node;
        }
    };


    /*
     TO-DO
     page_spacing() 是對整個 document 做 spacing
     應該要有一個 method 是像 jQuery selector 那樣可以對某個 id, class, tag 裡面的文字做 spacing
     */
    // paranoid_spacing.element_spacing = function(element) {
    //     getElementById()
    //     getElementsByTagName()
    // };

}(window.paranoid_spacing = window.paranoid_spacing || {}));