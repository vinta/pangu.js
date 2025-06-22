// NOTE: In service workers, we can't export directly, everything goes through messages
import type { Settings } from './types';
import { DEFAULT_SETTINGS } from './utils';

const SCRIPT_ID = 'pangu-auto-spacing';

async function initializeSettings() {
  const syncedSettings = await chrome.storage.sync.get();

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

async function unregisterAllContentScripts() {
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

async function registerContentScripts() {
  await unregisterAllContentScripts();

  const settings = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
  if (settings.spacing_mode === 'spacing_when_load') {
    const contentScript: chrome.scripting.RegisteredContentScript = {
      id: SCRIPT_ID,
      js: ['vendors/pangu/pangu.umd.js', 'dist/content-script.js'],
      matches: ['http://*/*', 'https://*/*'],
      runAt: 'document_idle',
    };

    if (settings.filter_mode === 'blacklist' && settings.blacklist.length > 0) {
      contentScript.excludeMatches = settings.blacklist;
    } else if (settings.filter_mode === 'whitelist' && settings.whitelist.length > 0) {
      contentScript.matches = settings.whitelist;
    }

    try {
      await chrome.scripting.registerContentScripts([contentScript]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Duplicate script ID')) {
        console.warn('Script already registered, skipping:', SCRIPT_ID);
      } else {
        console.error('Error registering content scripts:', error);
      }
    }
  } else {
    await unregisterAllContentScripts();
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  // Initialize settings when extension is installed or updated to a new version
  await initializeSettings();
  await registerContentScripts();
});

chrome.runtime.onStartup.addListener(async () => {
  // Also register content scripts when extension starts
  await registerContentScripts();
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  // Re-register content scripts when relevant settings change
  if (areaName === 'sync') {
    const relevantKeys: (keyof Settings)[] = ['spacing_mode', 'filter_mode', 'blacklist', 'whitelist'];
    const hasRelevantChanges = Object.keys(changes).some((key) => relevantKeys.includes(key as keyof Settings));

    if (hasRelevantChanges) {
      await registerContentScripts();
    }
  }
});
