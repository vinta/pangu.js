/*
 * Background Service Worker for Manifest V3
 * Service workers don't have persistent state, so we rely on chrome.storage
 */

const DEFAULT_SETTINGS = {
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

// Initialize settings on installation
chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
});

// Initialize or merge settings with defaults
async function initializeSettings() {
  const items = await chrome.storage.sync.get(null);
  const newSettings = {};
  
  Object.keys(DEFAULT_SETTINGS).forEach(key => {
    if (items[key] === undefined) {
      newSettings[key] = DEFAULT_SETTINGS[key];
    }
  });
  
  // Only set if there are new settings to add
  if (Object.keys(newSettings).length > 0) {
    await chrome.storage.sync.set(newSettings);
  }
}

// Get settings from storage
async function getSettings() {
  const items = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return items;
}

// Sync storage.sync changes to storage.local
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    // Sync to local storage
    const objToSave = {};
    for (const key in changes) {
      objToSave[key] = changes[key].newValue;
    }
    chrome.storage.local.set(objToSave);
  }
});

// Check if spacing should be applied to the given tab
async function canSpacing(tab) {
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

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate async response
  return true;
});

// Export functions for use by popup and options (via message passing)
// Note: In service workers, we can't export directly, everything goes through messages