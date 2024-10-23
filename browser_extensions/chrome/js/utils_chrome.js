/*
 Only for options.js / popup.js
 */

var utils_chrome = (function() {

    return {
        get_i18n: function(message_name) {
            return chrome.i18n.getMessage(message_name);
        },
        print_sync_storage: function() {
            SYNC_STORAGE.get(null, function(items) {
                console.log('SYNC_STORAGE: %O', items);
            });
        }
    };

}());
