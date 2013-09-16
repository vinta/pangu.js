/*
 Name: pangu.js (paranoid_spacing.js)
 Version: 1.7.2
 URL: https://github.com/gibuloto/paranoid-auto-spacing
 Author: Vinta
 License: MIT License
 Description: Insert a white space between full-width characters (Chinese, Japanese, etc.) and half-width alphanumeric characters

 Usage:
 pangu.page_spacing();
 pangu.element_spacing('#id_name');
 pangu.element_spacing('.class_name');
 pangu.element_spacing('tag_name');
 */

(function(pangu) {

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
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])([a-z0-9@&=_\[\$\%\^\*\-\+\(\/\\])/ig, '$1 $2');

        // 中文在後
        text = text.replace(/([a-z0-9!~&;=_\]\,\.\:\?\$\%\^\*\-\+\)\/\\])([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $2');

        // 字"字"字 >> 字 "字" 字
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30FF])(\"|\'(\S+))/ig, '$1 $2');
        text = text.replace(/((\S+)\'|\")([\u4e00-\u9fa5\u3040-\u30FF])/ig, '$1 $3'); // $2 是 (\S+)

        return text;
    }

    function spacing(xpath_query) {
        // https://developer.mozilla.org/en-US/docs/DOM/document.evaluate
        var nodes = document.evaluate(xpath_query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

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
                    }
                    else if (current_temp.nodeName.search(/^(a|u)$/i) == -1) {
                        current_node.data = current_node.data + " ";
                    }
                    else {
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
    pangu.page_spacing = function() {
        /*
         // >> 選擇任意位置的節點
         . >> 自己這個節點
         .. >> 父節點
         text() >> 節點的文字內容，例如 hello 之於 <tag>hello</tag>
         normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白
         translate() >> 將所查詢的字串轉換成小寫，因為 XML 是 case-sensitive 的
         */

        // 撈出所有節點（但是不包刮 <script>）的文字內容
        var xpath_query = '//*[not(@contenteditable)]/text()[normalize-space(.)][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="script"][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="style"]';

        spacing(xpath_query);
    };


    /*
     對特定 element 加空格
     */
    pangu.element_spacing = function(selector_string) {
        /*
         http://www.w3schools.com/xpath/xpath_examples.asp
         http://zh.wikipedia.org/wiki/XPath
         http://mi.hosp.ncku.edu.tw/km/index.php/dotnet/48-netdisk/57-xml-xpath
         http://stackoverflow.com/questions/1390568/xpath-how-to-match-attributes-that-contain-a-certain-string
         */

        var xpath_query;

        if (selector_string.indexOf('#') === 0) {
            var target_id = selector_string.substr(1, selector_string.length - 1);

            // ex: id("id_name")//text()
            xpath_query = 'id("' + target_id + '")//text()';
        }
        else if (selector_string.indexOf('.') === 0) {
            var target_class = selector_string.slice(1);

            // ex: //*[contains(concat(' ', normalize-space(@class), ' '), ' class_name ')]/text()
            xpath_query = '//*[contains(concat(" ", normalize-space(@class), " "), " ' + target_class + ' ")]/text()';
        }
        else {
            var target_tag = selector_string;

            // ex: //tag_name/text()
            xpath_query = '//' + target_tag + '/text()';
        }

        // console.log(xpath_query);

        spacing(xpath_query);
    };

}(window.pangu = window.pangu || {}));
