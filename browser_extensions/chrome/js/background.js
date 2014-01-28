/*
 Storage
 */

var syncStorage = chrome.storage.sync;
var loStorage = chrome.storage.local;

var DEFAULT_SETTINGS = {
    'spacing_mode': 'spacing_when_load', // or spacing_when_click
    'spacing_rule': 'blacklists', // or whitelists
    'blacklists': [
        '//drive.google.com',
        '//docs.google.com',
        'http://vinta.ws',
        'http://heelsfetishism.com'
    ],
    'whitelists': [],
    'wschar': ' '
};
var CACHED_SETTINGS = Object.create(DEFAULT_SETTINGS);
var SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

function refresh_cached_settings() {
    syncStorage.get(null, function(items) {
        CACHED_SETTINGS = items;
    });
}

function merge_settings() {
    syncStorage.get(null, function(items) {
        var old_settings = items;
        var new_settings = {};
        var is_changed = false;

        SETTING_KEYS.forEach(function(key) {
            if (old_settings[key] === undefined) {
                new_settings[key] = DEFAULT_SETTINGS[key];
            }
            else {
                new_settings[key] = old_settings[key];
            }
        });

        // 如果 new_settings 跟 old_settings 一樣的話，並不會觸發 chrome.storage.onChanged
        // 所以這裡強制 refresh，確保 CACHED_SETTINGS 一定有東西
        syncStorage.set(new_settings, function() {
            refresh_cached_settings();
        });
    });
}

chrome.storage.onChanged.addListener(
    function(changes, areaName) {
        if (areaName === 'sync') {
            refresh_cached_settings();

            // chrome.storage.sync 同步更新到 chrome.storage.local
            obj_to_save = {}
            for (key in changes) {
                obj_to_save[key] = changes[key].newValue;
            }
            loStorage.set(obj_to_save);
        }
    }
);

merge_settings();

/*
 Utils
 */

// 判斷能不能對這個頁面插入空格
function can_spacing(tab) {
    var current_url = tab.url;

    if (current_url.search(/^http(s?)/i) == -1) {
        return false;
    }
    else if (CACHED_SETTINGS['spacing_mode'] === 'spacing_when_load') {
        if (CACHED_SETTINGS['spacing_rule'] === 'blacklists') {
            for (var i in CACHED_SETTINGS['blacklists']) {
                var blacklist_url = CACHED_SETTINGS['blacklists'][i];
                if (current_url.indexOf(blacklist_url) >= 0) {
                    return false;
                }
            }

            return true;
        }
        else if (CACHED_SETTINGS['spacing_rule'] === 'whitelists') {
            for (var j in CACHED_SETTINGS['whitelists']) {
                var whitelist_url = CACHED_SETTINGS['whitelists'][j];
                if (current_url.indexOf(whitelist_url) >= 0) {
                    return true;
                }
            }

            return false;
        }
    }
    else if (CACHED_SETTINGS['spacing_mode'] === 'spacing_when_click') {
        return false;
    }

    return true;
}

/*
 Message Passing
 */

// 監聽來自 content_script.js 的訊息
chrome.runtime.onMessage.addListener(
    // https://crxdoc-zh.appspot.com/extensions/runtime.html#event-onMessage
    function(message_obj, sender, sendResponse) {
        var purpose = message_obj.purpose;

        switch (purpose) {
            case 'can_spacing':
                result = can_spacing(sender.tab);
                sendResponse({result: result, wschar: CACHED_SETTINGS['wschar']});
                break;
        }
    }
);

/*
 Content Script
 */

// 當頁面載入完成後就注入 JavaScript 程式碼
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.tabs.executeScript(tab.id, {file: 'vendors/jquery/jquery-1.10.2.min.js', allFrames: true});
        chrome.tabs.executeScript(tab.id, {file: 'vendors/pangu.min.js', allFrames: true});
        chrome.tabs.executeScript(tab.id, {file: 'js/content_script.js', allFrames: true});
    }
});

/*
 Browser Action
 */

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {code: 'is_spacing = true;'});
    chrome.tabs.executeScript(tab.id, {code: 'go_spacing();'});
});
