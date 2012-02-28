console.log('options.js');

var BG_PAGE = chrome.extension.getBackgroundPage();
var EXTENTION_NAME = chrome.i18n.getMessage("extensions_name");

function init_options_page() {
    $('#options_page_title').html(EXTENTION_NAME);
}

// DOM 載入後就觸發
$(document).ready(function() {
    init_options_page();
    
    $('#spacing_when_load').click(function () {
        alert('when_load');
        BG_PAGE.localStorage.spacing_mode = 'when_load';
    });
    
    $('#spacing_when_click').click(function () {
        alert('when_click');
        BG_PAGE.localStorage.spacing_mode = 'when_click';
    });
});

// DOM 裡頭的元素（例如圖片）載入完才會觸發
$(window).load(function() {
    // do something
});
