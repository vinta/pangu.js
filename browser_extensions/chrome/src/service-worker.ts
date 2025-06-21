import type { Settings } from './types';
import { DEFAULT_SETTINGS } from './utils';

// Initialize settings when extension is installed or updated to a new version
chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
  await registerContentScripts();
});

// Also register content scripts when extension starts
chrome.runtime.onStartup.addListener(async () => {
  await registerContentScripts();
});

// Initialize or merge settings with defaults
async function initializeSettings() {
  // Get what's currently in storage
  const syncedSettings = await chrome.storage.sync.get(null);

  // Find missing settings
  const missingSettings: Partial<Settings> = {};
  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in syncedSettings)) {
      missingSettings[key as keyof Settings] = defaultValue;
    }
  }

  // Only write if there are missing settings
  if (Object.keys(missingSettings).length > 0) {
    await chrome.storage.sync.set(missingSettings);
  }
}

// Get settings from storage
async function getSettings(): Promise<Settings> {
  return (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
}

// Unregister all content scripts
async function unregisterAllContentScripts(): Promise<void> {
  try {
    const existingScripts = await chrome.scripting.getRegisteredContentScripts();
    if (existingScripts.length > 0) {
      const scriptIds = existingScripts.map((script) => script.id);
      await chrome.scripting.unregisterContentScripts({ ids: scriptIds });
    }
  } catch (error) {
    console.warn('Failed to unregister existing scripts:', error);
  }
}

// Register content scripts dynamically based on user settings
async function registerContentScripts() {
  const SCRIPT_ID = 'pangu-auto-spacing';

  // First, unregister any existing scripts
  await unregisterAllContentScripts();

  const settings = await getSettings();

  // Only register if auto-spacing is enabled
  if (settings.spacing_mode === 'spacing_when_load') {
    const contentScript: chrome.scripting.RegisteredContentScript = {
      id: SCRIPT_ID,
      js: ['vendors/pangu/pangu.umd.js', 'dist/content-script.js'],
      matches: ['http://*/*', 'https://*/*'],
      runAt: 'document_idle',
    };

    // Apply filtering based on rules
    if (settings.filter_mode === 'blacklist' && settings.blacklist.length > 0) {
      // Use excludeMatches for blacklist
      contentScript.excludeMatches = settings.blacklist;
    } else if (settings.filter_mode === 'whitelist' && settings.whitelist.length > 0) {
      // Use whitelist patterns directly as matches
      contentScript.matches = settings.whitelist;
    }

    try {
      await chrome.scripting.registerContentScripts([contentScript]);
    } catch (error) {
      // Check if it's a duplicate ID error
      if (error instanceof Error && error.message.includes('Duplicate script ID')) {
        console.warn('Script already registered, skipping:', SCRIPT_ID);
      } else {
        console.error('Error registering content scripts:', error);
      }
    }
  } else {
    // If auto-spacing is disabled, ensure all scripts are unregistered
    await unregisterAllContentScripts();
  }
}

// Sync storage.sync changes to storage.local
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync') {
    // Sync to local storage
    const objToSave: Record<string, unknown> = {};
    for (const key in changes) {
      objToSave[key] = changes[key].newValue;
    }
    chrome.storage.local.set(objToSave);

    // Re-register content scripts if relevant settings changed
    const relevantKeys = ['spacing_mode', 'filter_mode', 'blacklist', 'whitelist'];
    const hasRelevantChanges = Object.keys(changes).some((key) => relevantKeys.includes(key));

    if (hasRelevantChanges) {
      await registerContentScripts();
    }
  }
});



// Keep service worker alive during critical operations
// Currently unused but kept for future implementation
// async function keepAlive() {
//   // Use chrome.alarms API instead of setTimeout for persistence
//   chrome.alarms.create('keep-alive', { periodInMinutes: 0.25 });
// }

// Clean up alarms when not needed
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive') {
    // Perform any necessary keep-alive tasks
    console.log('Service worker keep-alive ping');
  }
});

// Export functions for use by popup and options (via message passing)
// Note: In service workers, we can't export directly, everything goes through messages
