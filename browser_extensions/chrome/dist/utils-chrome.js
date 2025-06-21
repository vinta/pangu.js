let settingsCache = {};
let cacheInitialized = false;
async function initializeCache() {
  if (!cacheInitialized) {
    const response = await chrome.runtime.sendMessage({ action: "get_settings" });
    if (response && response.settings) {
      settingsCache = response.settings;
      cacheInitialized = true;
    }
  }
  return settingsCache;
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    for (const key in changes) {
      settingsCache[key] = changes[key].newValue;
    }
  }
});
const utils_chrome = {
  // Get cached settings (async)
  getCachedSettings: async function() {
    return await initializeCache();
  },
  // Get a specific setting (async)
  getSetting: async function(key) {
    const settings = await initializeCache();
    return settings[key];
  },
  // Direct access to chrome.storage.sync for setting values
  SYNC_STORAGE: chrome.storage.sync,
  // Get i18n message
  get_i18n: function(message_name) {
    return chrome.i18n.getMessage(message_name);
  },
  // Debug helper to print sync storage
  print_sync_storage: function() {
    chrome.storage.sync.get(null, function(items) {
      console.log("SYNC_STORAGE: %O", items);
    });
  },
  // Toggle auto spacing mode with consistent sound effects
  toggleAutoSpacing: async function(isEnabled) {
    const spacing_mode = isEnabled ? "spacing_when_load" : "spacing_when_click";
    await this.SYNC_STORAGE.set({ spacing_mode });
    await this.playSound(isEnabled ? "Shouryuuken" : "Hadouken");
  },
  // Play sound effects
  playSound: async function(name) {
    const settings = await this.getCachedSettings();
    if (!settings.is_mute_sound_effects) {
      const sounds = {
        "Hadouken": "sounds/StreetFighter-Hadouken.mp3",
        "Shouryuuken": "sounds/StreetFighter-Shouryuuken.mp3",
        "YeahBaby": "sounds/AustinPowers-YeahBaby.mp3",
        "WahWahWaaah": "sounds/ManciniPinkPanther-WahWahWaaah.mp3"
      };
      const audio = new Audio(chrome.runtime.getURL(sounds[name]));
      audio.play().catch((e) => console.log("Sound play failed:", e));
    }
  }
};
window.utils_chrome = utils_chrome;
export {
  utils_chrome as u
};
