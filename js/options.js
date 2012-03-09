console.log('options.js');

String.prototype.format = function() {
    var args = arguments;

    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

var BG_PAGE = chrome.extension.getBackgroundPage();

function get_i18n(message_name) {
    return chrome.i18n.getMessage(message_name);
}

function play_sound(id) {
    var element_id = id || 'sound1';
    var audio = document.getElementById(id);
    audio.play();
}

function is_valid_url(string) {
    var regexp_url = /((([a-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[a-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[a-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/i;

    if (regexp_url.test(string)) {
        return true;
    }
    else {
        return false;
    }
}

function init_options_page() {
    $('#page_title').html(get_i18n('extension_name'));
    $('#header_title').html(get_i18n('extension_name'));
    $('#subtitle').html(get_i18n('subtitle'));
    $('#quote').html(get_i18n('quote'));

    $('#now_spacing_when').html(get_i18n(BG_PAGE.localStorage['spacing_mode']));
    $('#spacing_when_load').html(get_i18n('spacing_when_load'));
    $('#spacing_when_click').html(get_i18n('spacing_when_click'));

    $('#now_exception').html(get_i18n(BG_PAGE.localStorage['exception_mode']));
    $('#exception_whitelist').html(get_i18n('exception_whitelist'));
    $('#exception_blacklist').html(get_i18n('exception_blacklist'));

    var exception_mode = BG_PAGE.localStorage['exception_mode'];
    var textarea = $('#exception_url_list');

    // 把之前暫存的內容再放回 textarea
    if (exception_mode == 'blacklist') {
        var blacklist = JSON.parse(BG_PAGE.localStorage['blacklist']); // array

        if (blacklist.length > 0) {
            textarea.val(blacklist.join("\n"));
        }
        else {
            textarea.val('');
        }
    }
    else {
        var whitelist = JSON.parse(BG_PAGE.localStorage['whitelist']); // array

        if (whitelist.length > 0) {
            textarea.val(whitelist.join("\n"));
        }
        else {
            textarea.val('');
        }
    }

    var now = new Date();
    $('#copyleft_year').html(now.getFullYear());
}

// DOM 載入後就觸發
$(document).ready(function() {
    init_options_page();

    var textarea = $('#exception_url_list');

    // 何時作用？
    $('.spacing_when').click(function() {
        var spacing_when = $(this).attr('id');

        BG_PAGE.localStorage['spacing_mode'] = spacing_when;

        $('#now_spacing_when').html(get_i18n(spacing_when));
    });

    $('#now_spacing_when').click(function() {
        play_sound('Hadouken');

        if (BG_PAGE.localStorage['spacing_mode'] == 'spacing_when_click') {
            BG_PAGE.localStorage['spacing_mode'] = 'spacing_when_load';
        }
        else {
            BG_PAGE.localStorage['spacing_mode'] = 'spacing_when_click';
        }

        $('#now_spacing_when').html(get_i18n(BG_PAGE.localStorage['spacing_mode']));
    });

    // 黑名單、白名單
    $('.exception_target').click(function() {
        var spacing_when = $(this).attr('id');

        BG_PAGE.localStorage['exception_mode'] = spacing_when;

        $('#now_exception').html(get_i18n(spacing_when));
    });

    $('#now_exception').click(function() {
        play_sound('Shouryuuken');

        if (BG_PAGE.localStorage['exception_mode'] == 'whitelist') {
            // 切換 whitelist / backlist 之前先把 textarea 的內容暫存起來
            var whitelist_temp = [];

            // 每次判斷之前，都要再抓一次 textarea.val() 的值
            var raw_textarea = textarea.val();

            if ($.trim(raw_textarea).length > 0) {
                whitelist_temp = raw_textarea.split("\n"); // array
            }

            BG_PAGE.localStorage['whitelist_temp'] = JSON.stringify(whitelist_temp);

            // 把之前暫存的內容再放回 textarea
            var blacklist_temp = JSON.parse(BG_PAGE.localStorage['blacklist_temp']); // array

            if (blacklist_temp.length > 0) {
                textarea.val(blacklist_temp.join("\n"));
            }
            else {
                textarea.val('');
            }

            BG_PAGE.localStorage['exception_mode'] = 'blacklist';
        }
        else {
            var blacklist_temp = [];
            var raw_textarea = textarea.val();

            if ($.trim(raw_textarea).length > 0) {
                blacklist_temp = raw_textarea.split("\n"); // array
            }

            BG_PAGE.localStorage['blacklist_temp'] = JSON.stringify(blacklist_temp);

            var whitelist_temp = JSON.parse(BG_PAGE.localStorage['whitelist_temp']); // array

            if (whitelist_temp.length > 0) {
                textarea.val(whitelist_temp.join("\n"));
            }
            else {
                textarea.val('');
            }

            BG_PAGE.localStorage['exception_mode'] = 'whitelist';
        }

        $('#now_exception').html(get_i18n(BG_PAGE.localStorage['exception_mode']));
    });

    $('#is_notify').change(function() {
        if ($(this).attr("checked") == 'checked') {
            BG_PAGE.localStorage['is_notify'] = 'false'; // 不要顯示 notify alert
        }
        else {
            BG_PAGE.localStorage['is_notify'] = 'true';
        }
    });

    // 提交（儲存）按鈕
    $('#submit').click(function() {
        var raw_textarea = textarea.val();
        var url_list = [];

        var submit_status = true;
        var submit_label_class = 'label-success';
        var submit_msg = '恭喜你，設定完成，你可以繼續上網了';

        if ($.trim(raw_textarea).length > 0) {
            var lines = $('#exception_url_list').val().split('\n');

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                if (is_valid_url(line)) {
                    url_list.push(line);
                }
                else {
                    submit_status = false;
                    submit_label_class = 'label-important';
                    submit_msg = "不要亂輸入好不好？第 {0} 行根本就不是一個合法的網址啊幹".format(i + 1);

                    break;
                }
            }
        }

        if (submit_status) {
            play_sound('YeahBaby');

            $('#submit_result').css('cursor', 'pointer');

            var exception_mode = BG_PAGE.localStorage['exception_mode'];

            if (exception_mode == 'whitelist') {
                // localStorage 只能存字串
                BG_PAGE.localStorage['whitelist'] = JSON.stringify(url_list);
            }
            else {
                BG_PAGE.localStorage['blacklist'] = JSON.stringify(url_list);
            }
        }
        else {
            play_sound('WahWahWaaah');

            $('#submit_result').css('cursor', 'default');
        }

        $('#submit_result')
        .removeClass() // 移除所有的 class
        .addClass('label')
        .addClass(submit_label_class)
        .html(submit_msg);
    });

    $('#submit_result').click(function() {
        var this_element = $(this);

        if (this_element.hasClass('label-success')) {
            this_element.css('cursor', 'default');

            this_element.html('不客氣，我知道你想跟我說謝謝');
        }
    });

// end: $(document).ready(function() {
});

// DOM 裡頭的元素（例如圖片）載入完才會觸發
$(window).load(function() {
    // do something
});
