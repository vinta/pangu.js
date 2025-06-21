import { D as DEFAULT_SETTINGS } from "./assets/types-CcJ344y1.js";
chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
  await registerContentScripts();
});
chrome.runtime.onStartup.addListener(async () => {
  await registerContentScripts();
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
async function registerContentScripts() {
  try {
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    const scriptIds = scripts.map((script) => script.id);
    if (scriptIds.length > 0) {
      await chrome.scripting.unregisterContentScripts({ ids: scriptIds });
    }
  } catch (error) {
    console.error("Error unregistering content scripts:", error);
  }
  const settings = await getSettings();
  if (settings.spacing_mode === "spacing_when_load") {
    const contentScript = {
      id: "pangu-auto-spacing",
      js: ["vendors/pangu/pangu.umd.js", "dist/content-script.js"],
      matches: ["<all_urls>"],
      runAt: "document_idle"
    };
    if (settings.spacing_rule === "blacklists" && settings.blacklists.length > 0) {
      contentScript.matches = ["<all_urls>"];
    } else if (settings.spacing_rule === "whitelists" && settings.whitelists.length > 0) {
      const matchPatterns = [];
      for (const url of settings.whitelists) {
        if (url.includes("://")) {
          matchPatterns.push(url.includes("*") ? url : `*://*${url}*`);
        } else {
          matchPatterns.push(`*://*${url}*`);
        }
      }
      contentScript.matches = matchPatterns.length > 0 ? matchPatterns : ["<all_urls>"];
    }
    try {
      await chrome.scripting.registerContentScripts([contentScript]);
    } catch (error) {
      console.error("Error registering content scripts:", error);
    }
  }
}
async function getSettings() {
  const items = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return items;
}
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync") {
    const objToSave = {};
    for (const key in changes) {
      objToSave[key] = changes[key].newValue;
    }
    chrome.storage.local.set(objToSave);
    const relevantKeys = ["spacing_mode", "spacing_rule", "blacklists", "whitelists"];
    const hasRelevantChanges = Object.keys(changes).some((key) => relevantKeys.includes(key));
    if (hasRelevantChanges) {
      await registerContentScripts();
    }
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
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keep-alive") {
    console.log("Service worker keep-alive ping");
  }
});
