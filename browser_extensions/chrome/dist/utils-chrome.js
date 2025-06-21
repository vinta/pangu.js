let settingsCache = {};
let cacheInitialized = false;
async function initializeCache() {
  if (!cacheInitialized) {
    const response = await chrome.runtime.sendMessage({ action: "get_settings" });
    if (response && response.settings) {
      settingsCache = response.settings;
      cacheInitialized = true;
    }
  }
  return settingsCache;
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    for (const key in changes) {
      settingsCache[key] = changes[key].newValue;
    }
  }
});
const utils_chrome = {
  // Get cached settings (async)
  getCachedSettings: async function() {
    return await initializeCache();
  },
  // Get a specific setting (async)
  getSetting: async function(key) {
    const settings = await initializeCache();
    return settings[key];
  },
  // Direct access to chrome.storage.sync for setting values
  SYNC_STORAGE: chrome.storage.sync,
  // Get i18n message
  get_i18n: function(message_name) {
    return chrome.i18n.getMessage(message_name);
  },
  // Debug helper to print sync storage
  print_sync_storage: function() {
    chrome.storage.sync.get(null, function(items) {
      console.log("SYNC_STORAGE: %O", items);
    });
  }
};
window.utils_chrome = utils_chrome;
export {
  utils_chrome as u
};
