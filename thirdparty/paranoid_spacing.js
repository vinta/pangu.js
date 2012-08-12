/*
 Name: paranoid_spacing.js
 Version: 1.7.1
 URL: https://github.com/gibuloto/paranoid-auto-spacing
 Author: Vinta
 License: MIT License
 Description: Insert a white space between full-width characters (Chinese, Japanese, etc.) and half-width alphanumeric characters

 Usage:
 paranoid_spacing.page_spacing();
 */

(function(paranoid_spacing) {

    /* Private Methods */

    function first_text_child(parentNode, targetChild) {
        var childNodes = parentNode.childNodes;
        for (var i = 0; i < childNodes.length && childNodes[i] != targetChild; i++) {
            if (childNodes[i].nodeType != 8 && childNodes[i].textContent) {
                return childNodes[i];
            }
        }

        return targetChild;
    }

    function last_text_child(parentNode, targetChild) {
        var childNodes = parentNode.childNodes;
        for (var i = childNodes.length - 1; i > -1 && childNodes[i] != targetChild; i--) {
            if (childNodes[i].nodeType != 8 && childNodes[i].textContent) {
                return childNodes[i];
            }
        }

        return targetChild;
    }

    function insert_space(text) {
        /*
         英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
         中文 ([\u4E00-\u9FFF])
         日文 ([\u3040-\u30FF])
         http://www.diybl.com/course/6_system/linux/Linuxjs/20090426/165435.html
         */

        // 中文在前
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])([a-z0-9@&;=_\[\$\%\^\*\-\+\(\/])/ig, '$1 $2');

        // 中文在後
        text = text.replace(/([a-z0-9!~&;=_\]\,\.\:\?\$\%\^\*\-\+\)\/])([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $2');

        // TODO: 增加 - + / * 前後的空白

        return text;
    }

    function spacing(element_obj) {
        var working_element = element_obj;

        /*
         // >> 選擇任意位置的某個節點
         . >> 自己這個節點
         .. >> 父節點
         text() >> 尋找某點的文字型別，例如 hello 之於 <tag>hello</tag>
         normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白

         XML 是 case-sensitive 的
         */
        var xpath_query = '//text()[normalize-space(.)][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="script"][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="style"]';

        var nodes = working_element.evaluate(xpath_query, working_element, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

        // snapshotLength 要配合 XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE 使用
        var nodes_length = nodes.snapshotLength;

        var next_node;

        for (var i = nodes_length - 1; i > -1; --i) {
            var current_node = nodes.snapshotItem(i);

            /*
             .data 是 XML DOM 的屬性
             http://www.w3school.com.cn/xmldom/dom_text.asp
             */
            current_node.data = insert_space(current_node.data);

            if (next_node) {
                var text = current_node.data.toString().substr(-1) + next_node.data.toString().substr(0, 1);
                var newText = insert_space(text);

                if (text != newText) {
                    var next_temp = next_node;
                    while (next_temp.parentNode && next_temp.nodeName.search(/^(a|u)$/i) == -1 && first_text_child(next_temp.parentNode, next_temp) == next_temp) {
                        next_temp = next_temp.parentNode;
                    }

                    var current_temp = current_node;
                    while (current_temp.parentNode && current_temp.nodeName.search(/^(a|u)$/i) == -1 && last_text_child(current_temp.parentNode, current_temp) == current_temp) {
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
    }


    /* Public Methods */

    /*
     對整個 window.document 加空格
     */
    paranoid_spacing.page_spacing = function() {
        spacing(document); // window.document
    };


    /*
     TODO:
     page_spacing() 是對整個 document 做 spacing
     應該要有一個 method 是像 jQuery selector 那樣可以對某個 id, class, tag 裡面的文字做 spacing
     */
    paranoid_spacing.element_spacing = function(selector_string) {
        var element = document.getElementById(selector_string);

        // getElementById();
        // getElementsByClassName();
        // getElementsByTagName();

        spacing(element);
    };

}(window.paranoid_spacing = window.paranoid_spacing || {}));