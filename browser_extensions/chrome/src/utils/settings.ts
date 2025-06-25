import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  spacing_mode: 'spacing_when_load',
  filter_mode: 'blacklist',
  blacklist: [
    // Default blacklist with valid match patterns
    '*://docs.google.com/*',
    '*://gist.github.com/*',
    '*://github.com/*/blob/*',
    '*://github.com/*/commit/*',
    '*://github.com/*/pull/*',
  ],
  whitelist: [],
  is_mute_sound_effects: false,
  is_enable_detect_cjk: false,
};

// Module-level state for settings cache
let cachedSettings: Settings = { ...DEFAULT_SETTINGS };
let cacheInitialized = false;

export async function getCachedSettings() {
  if (!cacheInitialized) {
    cachedSettings = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
    cacheInitialized = true;
  }
  return cachedSettings;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && cacheInitialized) {
    // Only update cache after it's been initialized
    for (const [key, change] of Object.entries(changes)) {
      if (key in cachedSettings) {
        // Create a new object to satisfy TypeScript's type checking
        cachedSettings = {
          ...cachedSettings,
          [key]: change.newValue,
        };
      }
    }
  }
});
