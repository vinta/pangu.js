console.log('options.js BEGIN');

/*
var EXTENTION_NAME = chrome.i18n.getMessage("extensions_name");

function init_options_page() {
    
    $('#options_page_title').html(EXTENTION_NAME);
    
    console.log(EXTENTION_NAME);
}

init_options_page();
*/

var background_page = chrome.extension.getBackgroundPage();

background_page.default_setuip();

background_page.set_badge('123');

console.log('options.js END');
