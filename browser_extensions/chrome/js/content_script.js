var is_spacing = false; // 是不是正在插入空格？
var last_spacing_time = 0; // 避免短時間內一直在執行 go_spacing()

function go_spacing() {
    console.log('go_spacing()');

    var _had_spacing = pangu.page_spacing();

    is_spacing = false;
    last_spacing_time = new Date().getTime(); // set last_spacing_time for next change event

    return _had_spacing;
}

var SAY_HELLOS = [
    '空格之神顯靈了',
    '空格之神準備好了',
    '空格之神 在此',
    '空格之神 參見',
    '空格之神 參上',
    '空格之神 登場',
    '空格之神 來也',
    '空格之神 路過',
    '空格之神 駕到',
    '空格之神 報到',
    '空格之神 姍姍來遲',
    '空格之神 粉墨登場',
    '空格之神 強勢登場',
    '空格之神 強勢回歸',
    '空格之神 夜露死苦',
    '空格之神 這不是來了嗎！',
    '空格之神 射出！',
    '空格之神 露出',
    '空格之神 登入'
];

function ask_can_notify(just_notify) {
    if (typeof alertify !== 'undefined') {
        alertify.custom = alertify.extend('custom');

        // var msg = chrome.i18n.getMessage('hello_god_of_spacing');
        var msg = SAY_HELLOS[Math.floor(Math.random() * SAY_HELLOS.length)];

        // just_notify 是給 browser action 用的，強制顯示「空格之神顯靈了」
        if (just_notify) {
            alertify.custom(msg, 1500, true);
        }
        else {
            chrome.runtime.sendMessage({purpose: 'can_notify'},
                function(response) {
                    console.log('can_notify: %O', response.result);

                    if (response.result) {
                        alertify.custom(msg, 1500, true);
                    }
                }
            );
        }
    }
}

function ask_can_spacing() {
    chrome.runtime.sendMessage({purpose: 'can_spacing'},
        function(response) {
            console.log('can_spacing: %O', response.result);

            if (response.result) {
                var had_spacing = go_spacing();

                // 真的有插入空格才提示「空格之神顯靈了」
                if (had_spacing) {
                    ask_can_notify(false);
                }

                /*
                 這一段是為了對付那些 AJAX 加載進來的內容
                 當頁面 DOM 有變動時
                 就再執行一次 spacing

                 要怎麼分辨由 AJAX 引起的 DOM insert 和 spacing 造成的 DOM insert？
                 只好設置一個 timeout 時間
                 */
                var spacing_timer;
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
}

ask_can_spacing();
