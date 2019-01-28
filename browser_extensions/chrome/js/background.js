/*
 Storage
 */

var SYNC_STORAGE = chrome.storage.sync;
var LOCAL_STORAGE = chrome.storage.local;

var DEFAULT_SETTINGS = {
  'spacing_mode': 'spacing_when_load',
  'spacing_rule': 'blacklists',
  'blacklists': [ // TODO: support regex
    '//docs.google.com',
    '//gist.github.com',
    '/blob/',
    '/commit/',
    '/pull/'
  ],
  'whitelists': [],
  'is_mute': false
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

// 監聽來自 content_script.js 的訊息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.purpose) {
    case 'can_spacing':
      sendResponse({'result': can_spacing(sender.tab)});
      break;
    default:
      sendResponse({'result': false});
  }
});
