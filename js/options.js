console.log('options.js');

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
    
    // textarea 的 change event 只有 blur 之後才會觸發
    $('#exception_url_list').change(function() {
        var arrayOfLines = $(this).val().split('\n');
    });
    
    // 提交（儲存）按鈕
    $('#submit').click(function() {
        play_sound('YeahBaby');
    });
});

// DOM 裡頭的元素（例如圖片）載入完才會觸發
$(window).load(function() {
    // do something
});
