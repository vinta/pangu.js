import { D as DEFAULT_SETTINGS } from "./utils.js";
chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
  await registerContentScripts();
});
chrome.runtime.onStartup.addListener(async () => {
  await registerContentScripts();
});
async function initializeSettings() {
  const syncedSettings = await chrome.storage.sync.get(null);
  const missingSettings = {};
  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in syncedSettings)) {
      missingSettings[key] = defaultValue;
    }
  }
  if (Object.keys(missingSettings).length > 0) {
    await chrome.storage.sync.set(missingSettings);
  }
}
async function getSettings() {
  return await chrome.storage.sync.get(DEFAULT_SETTINGS);
}
async function unregisterAllContentScripts() {
  try {
    const existingScripts = await chrome.scripting.getRegisteredContentScripts();
    if (existingScripts.length > 0) {
      const scriptIds = existingScripts.map((script) => script.id);
      await chrome.scripting.unregisterContentScripts({ ids: scriptIds });
    }
  } catch (error) {
    console.warn("Failed to unregister existing scripts:", error);
  }
}
async function registerContentScripts() {
  const SCRIPT_ID = "pangu-auto-spacing";
  await unregisterAllContentScripts();
  const settings = await getSettings();
  if (settings.spacing_mode === "spacing_when_load") {
    const contentScript = {
      id: SCRIPT_ID,
      js: ["vendors/pangu/pangu.umd.js", "dist/content-script.js"],
      matches: ["http://*/*", "https://*/*"],
      runAt: "document_idle"
    };
    if (settings.filter_mode === "blacklist" && settings.blacklist.length > 0) {
      contentScript.excludeMatches = settings.blacklist;
    } else if (settings.filter_mode === "whitelist" && settings.whitelist.length > 0) {
      contentScript.matches = settings.whitelist;
    }
    try {
      await chrome.scripting.registerContentScripts([contentScript]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Duplicate script ID")) {
        console.warn("Script already registered, skipping:", SCRIPT_ID);
      } else {
        console.error("Error registering content scripts:", error);
      }
    }
  } else {
    await unregisterAllContentScripts();
  }
}
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync") {
    const objToSave = {};
    for (const key in changes) {
      objToSave[key] = changes[key].newValue;
    }
    chrome.storage.local.set(objToSave);
    const relevantKeys = ["spacing_mode", "filter_mode", "blacklist", "whitelist"];
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
    return true;
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
