import type { Settings } from './types';
import DEFAULT_SETTINGS_JSON from '../default-settings.json';

export const DEFAULT_SETTINGS: Settings = DEFAULT_SETTINGS_JSON as Settings;

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
