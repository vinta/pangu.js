/*
 Storage
 */

var SYNC_STORAGE = chrome.storage.sync;
var LOCAL_STORAGE = chrome.storage.local;

var DEFAULT_SETTINGS = {
  'spacing_mode': 'spacing_when_load', // or spacing_when_click
  'spacing_rule': 'blacklists', // or whitelists
  'blacklists': [
    '//drive.google.com',
    '//docs.google.com',
    '&tbm=isch'
  ],
  'whitelists': [],
  'is_mute': false,
  'can_notify': false
};
var CACHED_SETTINGS = Object.create(DEFAULT_SETTINGS);
var SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

function refresh_cached_settings() {
  SYNC_STORAGE.get(null, function(items) {
    CACHED_SETTINGS = items;
  });
}

function merge_settings() {
  SYNC_STORAGE.get(null, function(items) {
    var old_settings = items;
    var new_settings = {};

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
    SYNC_STORAGE.set(new_settings, function() {
      refresh_cached_settings();
    });
  });
}

chrome.storage.onChanged.addListener(
  function(changes, areaName) {
    if (areaName === 'sync') {
      refresh_cached_settings();

      // chrome.storage.sync 同步更新到 chrome.storage.local
      var obj_to_save = {};
      for (var key in changes) {
        obj_to_save[key] = changes[key].newValue;
      }
      LOCAL_STORAGE.set(obj_to_save);
    }
  }
);

merge_settings();

/*
 Message Passing
 */

// 判斷能不能對這個頁面插入空格
function can_spacing(tab) {
  if (tab === undefined) {
    return false;
  }

  if (CACHED_SETTINGS['spacing_mode'] === 'spacing_when_load') {
    var current_url = tab.url;

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

// 要不要顯示「空格之神顯靈了」
function can_notify() {
  return CACHED_SETTINGS['can_notify'];
}

// 監聽來自 content_script.js 的訊息
chrome.runtime.onMessage.addListener(
  // https://crxdoc-zh.appspot.com/extensions/runtime.html#event-onMessage
  function(message_obj, sender, sendResponse) {
    var purpose = message_obj.purpose;
    var result = null;

    switch (purpose) {
      case 'can_spacing':
        result = can_spacing(sender.tab);
        sendResponse({result: result});
        break;
      case 'can_notify':
        result = can_notify();
        sendResponse({result: result});
        break;
    }
  }
);
