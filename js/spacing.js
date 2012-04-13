function request_notify() {
    // 顯示右上角的 notify alert
    chrome.extension.sendRequest({purpose: 'notify'}, function(response) {
        var notify = response.notify;
    });
}


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


var had_notify;

function traversal_and_spacing() {
    console.log('traversal_and_spacing()');

    if (!had_notify) {
        request_notify();
        had_notify = true;
    }

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
                while (next_temp.parentNode && next_temp.nodeName.search(/^(a|u)$/i) == -1 && next_temp.parentNode.firstChild == next_temp) {
                    next_temp = next_temp.parentNode;
                }

                var current_temp = current_node;
                while (current_temp.parentNode && current_temp.nodeName.search(/^(a|u)$/i) == -1 && current_temp.parentNode.lastChild == current_temp) {
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


// content script 只能用這種方式跟 background page（或其他 tab）溝通
function request_spacing() {
    chrome.extension.sendRequest({purpose: 'spacing_mode'}, function(response) {
        var spacing_mode = response.spacing_mode;

        if (spacing_mode == 'spacing_when_load') {
            chrome.extension.sendRequest({purpose: 'exception_mode'}, function(response) {
                var exception_mode = response.exception_mode;
                var blacklist = JSON.parse(response.blacklist);
                var whitelist = JSON.parse(response.whitelist);

                chrome.extension.sendRequest({purpose: 'current_tab'}, function(response) {
                    var current_tab = response.current_tab;
                    var current_url = current_tab.url;

                    // 開始做例外判斷
                    if (exception_mode == 'blacklist') { // 不要在這些網站作用
                        if (blacklist.length > 0) {
                            var is_found = false;

                            // 如果當前網頁的 url 符合 blacklist 中的任一筆，就不要作用
                            for (var i = 0; i < blacklist.length; i++) {
                                var black_url = blacklist[i];

                                if (current_url.indexOf(black_url) >= 0) {
                                    is_found = true;
                                    break;
                                }
                            }

                            if (!is_found) {
                                traversal_and_spacing();
                            }
                        }
                        else {
                            traversal_and_spacing();
                        }
                    }
                    else { // 只在這些網站作用
                        if (whitelist.length > 0) {
                            var is_found = false;

                            // 當前網頁的 url 符合 whitelist 中的任一筆，才作用
                            for (var i = 0; i < whitelist.length; i++) {
                                var white_url = whitelist[i];

                                if (current_url.indexOf(white_url) >= 0) {
                                    is_found = true;
                                    break;
                                }
                            }

                            if (is_found) {
                                traversal_and_spacing();
                            }
                        }
                    }
                });
            });
        }
    });
}


// 網頁載入後就先判斷一次要不要執行 spacing
request_spacing();


/*
 這一段是為了對付那些 AJAX 加載進來的內容
 當頁面 DOM 有變動時
 就再執行一次 spacing

 但是我要怎麼分辨由 ajax 引起的 DOM insert 和 spacing 造成的 DOM insert？
 */
var had_spacing; // 是不是剛剛執行完 spacing
var last_spacing_time = 0; // 0 means there were never any requests sent

$('body').bind('DOMNodeInserted', function() {
    var d = new Date();
    var current_time = d.getTime(); // get the time of this change event
    var interval = current_time - last_spacing_time; // how many milliseconds since the last request

    if (interval >= 1000) { // more than 1 second
        last_spacing_time = current_time; // set last_spacing_time for next change event

        if (!had_spacing) {
            had_spacing = setTimeout(function() {
                request_spacing();
                had_spacing = null;
            }, 1000);
        }
    }
});


/*
 jquery.ba-resize.min.js
 https://github.com/cowboy/jquery-resize
 */

// $(document).resize(function(e) {
//     console.log('resize');

//     had_spacing = setTimeout(function() {
//         traversal_and_spacing();
//         had_spacing = null;
//     }, 1000);
// });
