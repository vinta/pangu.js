const DEFAULT_SETTINGS = {
  spacing_mode: "spacing_when_load",
  spacing_rule: "blacklists",
  blacklists: [
    // TODO: support regex
    "//docs.google.com",
    "//gist.github.com",
    "/blob/",
    "/commit/",
    "/pull/"
  ],
  whitelists: [],
  is_mute_sound_effects: false
};
chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
});
async function initializeSettings() {
  const items = await chrome.storage.sync.get(null);
  const newSettings = {};
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    if (items[key] === void 0) {
      newSettings[key] = DEFAULT_SETTINGS[key];
    }
  });
  if (Object.keys(newSettings).length > 0) {
    await chrome.storage.sync.set(newSettings);
  }
}
async function getSettings() {
  const items = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return items;
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    const objToSave = {};
    for (const key in changes) {
      objToSave[key] = changes[key].newValue;
    }
    chrome.storage.local.set(objToSave);
  }
});
async function canSpacing(tab) {
  if (!tab || !tab.url) {
    return false;
  }
  const settings = await getSettings();
  if (settings.spacing_mode === "spacing_when_load") {
    const currentUrl = tab.url;
    if (settings.spacing_rule === "blacklists") {
      for (const blacklistUrl of settings.blacklists) {
        if (currentUrl.indexOf(blacklistUrl) >= 0) {
          return false;
        }
      }
      return true;
    } else if (settings.spacing_rule === "whitelists") {
      for (const whitelistUrl of settings.whitelists) {
        if (currentUrl.indexOf(whitelistUrl) >= 0) {
          return true;
        }
      }
      return false;
    }
  } else if (settings.spacing_mode === "spacing_when_click") {
    return false;
  }
  return true;
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.purpose || message.action) {
        case "can_spacing":
          const result = await canSpacing(sender.tab);
          sendResponse({ result });
          break;
        case "get_settings":
          const settings = await getSettings();
          sendResponse({ settings });
          break;
        case "get_setting":
          if (message.key) {
            const value = await chrome.storage.sync.get(message.key);
            sendResponse({ value: value[message.key] });
          } else {
            sendResponse({ error: "No key specified" });
          }
          break;
        default:
          sendResponse({ result: false });
      }
    } catch (error) {
      console.error("Error in message handler:", error);
      sendResponse({ error: error.message });
    }
  })();
  return true;
});
