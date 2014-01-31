/*
 Chrome
 */

var SYNC_Storage = chrome.storage.sync;
var BG_PAGE = chrome.extension.getBackgroundPage();
var CACHED_SETTINGS = BG_PAGE.CACHED_SETTINGS;

function print_sync_storage() {
    SYNC_Storage.get(null, function(items) {
        console.log('SYNC_Storage: %O', items);
    });
}

function get_i18n(message_name) {
    return chrome.i18n.getMessage(message_name);
}

// TODO
// (function(utils_chrome) {
// }(window.utils_chrome = window.utils_chrome || {}));
