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
    if (settings.spacing_rule === 'blacklists' && settings.blacklists.length > 0) {
      // For blacklists, we register for all HTTP/HTTPS URLs and filter in the content script
      // Chrome doesn't support negative matches directly
      contentScript.matches = ['http://*/*', 'https://*/*'];
    } else if (settings.spacing_rule === 'whitelists' && settings.whitelists.length > 0) {
      // For whitelists, we can use specific match patterns
      const matchPatterns: string[] = [];
      for (const url of settings.whitelists) {
        // Convert URL fragments to match patterns
        if (url.includes('://')) {
          matchPatterns.push(url.includes('*') ? url : `*://*${url}*`);
        } else {
          matchPatterns.push(`*://*${url}*`);
        }
      }
      contentScript.matches = matchPatterns.length > 0 ? matchPatterns : ['http://*/*', 'https://*/*'];
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

// Get settings from storage
async function getSettings(): Promise<Settings> {
  return (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
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
    const relevantKeys = ['spacing_mode', 'spacing_rule', 'blacklists', 'whitelists'];
    const hasRelevantChanges = Object.keys(changes).some((key) => relevantKeys.includes(key));

    if (hasRelevantChanges) {
      await registerContentScripts();
    }
  }
});

// Check if spacing should be applied to the given tab
async function canSpacing(tab: chrome.tabs.Tab | undefined): Promise<boolean> {
  if (!tab || !tab.url) {
    return false;
  }

  const settings = await getSettings();

  if (settings.spacing_mode === 'spacing_when_load') {
    const currentUrl = tab.url;

    if (settings.spacing_rule === 'blacklists') {
      for (const blacklistUrl of settings.blacklists) {
        if (currentUrl.indexOf(blacklistUrl) >= 0) {
          return false;
        }
      }
      return true;
    } else if (settings.spacing_rule === 'whitelists') {
      for (const whitelistUrl of settings.whitelists) {
        if (currentUrl.indexOf(whitelistUrl) >= 0) {
          return true;
        }
      }
      return false;
    }
  } else if (settings.spacing_mode === 'spacing_when_click') {
    return false;
  }

  return true;
}

// Message types
interface MessageRequest {
  purpose?: string;
  action?: string;
  key?: string;
}

interface MessageResponse {
  result?: boolean;
  settings?: Settings;
  value?: unknown;
  error?: string;
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: MessageRequest, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
  // Handle async response
  (async () => {
    try {
      switch (message.purpose || message.action) {
        case 'can_spacing':
          const result = await canSpacing(sender.tab);
          sendResponse({ result });
          break;

        case 'get_settings':
          const settings = await getSettings();
          sendResponse({ settings });
          break;

        case 'get_setting':
          if (message.key) {
            const value = await chrome.storage.sync.get(message.key);
            sendResponse({ value: value[message.key] });
          } else {
            sendResponse({ error: 'No key specified' });
          }
          break;

        default:
          sendResponse({ result: false });
      }
    } catch (error) {
      console.error('Error in message handler:', error);
      sendResponse({ error: (error as Error).message });
    }
  })();

  // Return true to indicate async response
  return true;
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
