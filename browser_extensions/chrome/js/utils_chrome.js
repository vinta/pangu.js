/*
 * Utilities for popup.js and options.js
 * Updated for Manifest V3 - using message passing instead of getBackgroundPage()
 */

var utils_chrome = (function() {
  
  // Cache for settings to reduce message passing
  var settingsCache = {};
  var cacheInitialized = false;
  
  // Initialize settings cache
  async function initializeCache() {
    if (!cacheInitialized) {
      const response = await chrome.runtime.sendMessage({ action: 'get_settings' });
      if (response && response.settings) {
        settingsCache = response.settings;
        cacheInitialized = true;
      }
    }
    return settingsCache;
  }
  
  // Listen for storage changes to update cache
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      for (const key in changes) {
        settingsCache[key] = changes[key].newValue;
      }
    }
  });
  
  return {
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
        console.log('SYNC_STORAGE: %O', items);
      });
    }
  };

}());