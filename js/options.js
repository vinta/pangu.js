console.log('options.js');

/*
 usage:
 submit_msg = "小心！那是 {0} 啊！".format('驗孕棒');
 */
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

function init_options_page() {
    $('#options_page_title').html(get_i18n('extensions_name'));
    
    $('#now_spacing_when').html(get_i18n(BG_PAGE.localStorage['spacing_mode']));
    $('#spacing_when_load').html(get_i18n('spacing_when_load'));
    $('#spacing_when_click').html(get_i18n('spacing_when_click'));
    
    $('#now_exception').html(get_i18n(BG_PAGE.localStorage['exception_mode']));
    $('#exception_whitelist').html(get_i18n('exception_whitelist'));
    $('#exception_blacklist').html(get_i18n('exception_blacklist'));
    
    var now = new Date();
    $('#copyleft_year').html(now.getFullYear());
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

// DOM 載入後就觸發
$(document).ready(function() {
    init_options_page();
    
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
            BG_PAGE.localStorage['exception_mode'] = 'blacklist';
        }
        else {
            BG_PAGE.localStorage['exception_mode'] = 'whitelist';
        }
        
        $('#now_exception').html(get_i18n(BG_PAGE.localStorage['exception_mode']));
    });
    
    // 提交（儲存）按鈕
    $('#submit').click(function() {
        var lines = $('#exception_url_list').val().split('\n');
        var url_list = [];
        
        var submit_status = true;
        var submit_label_class = 'label-success';
        var submit_msg = '恭喜你，設定已經儲存';
        
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
        
        if (submit_status) {
            play_sound('YeahBaby');
        }
        else {
            play_sound('WahWahWaaah');
        }
        
        $('#submit_result')
        .removeClass() // 移除所有的 class
        .addClass('label ' + submit_label_class)
        .html(submit_msg);
    });
    
    $('a').tooltip();
});

// DOM 裡頭的元素（例如圖片）載入完才會觸發
$(window).load(function() {
    // do something
});
