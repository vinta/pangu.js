console.log('options.js');

var BG_PAGE = chrome.extension.getBackgroundPage();
VAR STORAGE = BG_PAGE.localStorage;

function init_options_page() {
    var i18n_extensions_name = chrome.i18n.getMessage('extensions_name');
    var i18n_spacing_when_load = chrome.i18n.getMessage('spacing_when_load');
    var i18n_spacing_when_click = chrome.i18n.getMessage('spacing_when_click');
    
    $('#options_page_title').html(i18n_extensions_name);
    
    $('#spacing_when_load').html(i18n_spacing_when_load);
    $('#spacing_when_click').html(i18n_spacing_when_click);
    
    if (STORAGE['spacing_mode'] == 'spacing_when_click') {
        $('#now_spacing_when').html(chrome.i18n.getMessage(spacing_when));
    }
}

function switch_spacing_mode() {
}

// DOM 載入後就觸發
$(document).ready(function() {
    init_options_page();
    
    $('.spacing_when').click(function() {
        var spacing_when = $(this).attr('id');
        
        STORAGE['spacing_mode'] = spacing_when;
        
        $('#now_spacing_when').html(chrome.i18n.getMessage(spacing_when));
    });
    
    $('#now_spacing_when').click(function() {
        if (STORAGE['spacing_mode'] == 'spacing_when_load') {
            STORAGE['spacing_mode'] = 'spacing_when_click';
            $('#now_spacing_when').html(chrome.i18n.getMessage(STORAGE['spacing_mode']));
        }
    });
});

// DOM 裡頭的元素（例如圖片）載入完才會觸發
$(window).load(function() {
    // do something
});
