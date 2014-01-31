var is_spacing = false; // 是不是正在加入空格
var last_spacing_time = 0; // 避免短時間內一直在執行 go_spacing()

function go_spacing() {
    console.log('go_spacing()');

    pangu.page_spacing();

    is_spacing = false;
    last_spacing_time = new Date().getTime(); // set last_spacing_time for next change event
}

/*
 這一段是為了對付那些 AJAX 加載進來的內容
 當頁面 DOM 有變動時
 就再執行一次 spacing

 要怎麼分辨由 AJAX 引起的 DOM insert 和 spacing 造成的 DOM insert？
 只好設置一個 timeout 時間
 */
var spacing_timer;
chrome.runtime.sendMessage({purpose: 'can_spacing'},
    function(response) {
        console.log('can_spacing: %O', response.result);

        if (response.result) {
            if (alertify) {
                alertify.custom = alertify.extend('custom');
                alertify.custom('空格之神顯靈了', 1800, true);
            }

            go_spacing();

            $('body').on('DOMNodeInserted', function(event) {
                var interval = new Date().getTime() - last_spacing_time; // how many milliseconds since the last request
                if (interval >= 1000) { // more than 1 second
                    if (!is_spacing) {
                        clearTimeout(spacing_timer);
                        spacing_timer = setTimeout(function() {
                            go_spacing();
                        }, 500);
                    }
                }
            });
        }
    }
);
