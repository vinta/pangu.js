function request_notify() {
    // 顯示右上角的 notify alert
    chrome.extension.sendRequest({purpose: 'notify'}, function(response) {
        var notify = response.notify;
    });
}


var had_notify;

function traversal_and_spacing() {
    console.log('traversal_and_spacing()');

    // 詳見 /vendors/pangu.js
    pangu.page_spacing();

    // 只在第一次 spacing 時顯示「空格之神顯靈了！」
    if (!had_notify) {
        request_notify();
        had_notify = true;
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


// 網頁載入完成後就先判斷一次要不要執行 spacing
request_spacing();


/*
 這一段是為了對付那些 AJAX 加載進來的內容
 當頁面 DOM 有變動時
 就再執行一次 spacing

 要怎麼分辨由 ajax 引起的 DOM insert 和 spacing 造成的 DOM insert？
只好設置一個 timeout 時間
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