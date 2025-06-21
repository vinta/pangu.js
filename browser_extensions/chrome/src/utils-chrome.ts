/*
 * Utilities for popup.js and options.js
 * Updated for Manifest V3 - using message passing instead of getBackgroundPage()
 */

import { ExtensionSettings } from './types';

interface UtilsChrome {
  getCachedSettings(): Promise<ExtensionSettings>;
  getSetting(key: keyof ExtensionSettings): Promise<any>;
  SYNC_STORAGE: chrome.storage.SyncStorageArea;
  get_i18n(message_name: string): string;
  print_sync_storage(): void;
}

// Cache for settings to reduce message passing
let settingsCache: ExtensionSettings = {} as ExtensionSettings;
let cacheInitialized = false;

// Initialize settings cache
async function initializeCache(): Promise<ExtensionSettings> {
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
      (settingsCache as any)[key] = changes[key].newValue;
    }
  }
});

const utils_chrome: UtilsChrome = {
  // Get cached settings (async)
  getCachedSettings: async function(): Promise<ExtensionSettings> {
    return await initializeCache();
  },
  
  // Get a specific setting (async)
  getSetting: async function(key: keyof ExtensionSettings): Promise<any> {
    const settings = await initializeCache();
    return settings[key];
  },
  
  // Direct access to chrome.storage.sync for setting values
  SYNC_STORAGE: chrome.storage.sync,
  
  // Get i18n message
  get_i18n: function(message_name: string): string {
    return chrome.i18n.getMessage(message_name);
  },
  
  // Debug helper to print sync storage
  print_sync_storage: function(): void {
    chrome.storage.sync.get(null, function(items) {
      console.log('SYNC_STORAGE: %O', items);
    });
  }
};

// Export as global for compatibility with existing code
(window as any).utils_chrome = utils_chrome;

export default utils_chrome;