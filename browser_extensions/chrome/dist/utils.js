const DEFAULT_SETTINGS = {
  spacing_mode: "spacing_when_load",
  spacing_rule: "blacklist",
  blacklists: [
    // TODO: support regex
    "//docs.google.com",
    "//gist.github.com",
    "/blob/",
    "/commit/",
    "/pull/"
  ],
  whitelists: [],
  blacklist: [
    // Default blacklist with valid match patterns
    "*://docs.google.com/*",
    "*://gist.github.com/*",
    "*://github.com/*/blob/*",
    "*://github.com/*/commit/*",
    "*://github.com/*/pull/*"
  ],
  whitelist: [],
  is_mute_sound_effects: false
};
class Utils {
  cachedSettings = { ...DEFAULT_SETTINGS };
  cacheInitialized = false;
  // Sound file mappings
  sounds = {
    Hadouken: "sounds/StreetFighter-Hadouken.mp3",
    Shouryuuken: "sounds/StreetFighter-Shouryuuken.mp3",
    YeahBaby: "sounds/AustinPowers-YeahBaby.mp3",
    WahWahWaaah: "sounds/ManciniPinkPanther-WahWahWaaah.mp3"
  };
  constructor() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync") {
        for (const key in changes) {
          if (key in this.cachedSettings) {
            const settingsKey = key;
            this.cachedSettings[settingsKey] = changes[key].newValue;
          }
        }
      }
    });
  }
  // Initialize settings cache
  async initializeCache() {
    if (!this.cacheInitialized) {
      const response = await chrome.runtime.sendMessage({ action: "get_settings" });
      if (response && response.settings) {
        this.cachedSettings = response.settings;
        this.cacheInitialized = true;
      }
    }
    return this.cachedSettings;
  }
  // Get cached settings
  async getCachedSettings() {
    return await this.initializeCache();
  }
  // Get a specific setting
  async getSetting(key) {
    const settings = await this.initializeCache();
    return settings[key];
  }
  // Get i18n message
  get_i18n(message_name) {
    return chrome.i18n.getMessage(message_name);
  }
  // Debug helper to print sync storage
  print_sync_storage() {
    chrome.storage.sync.get(null, (items) => {
      console.log("SYNC_STORAGE: %O", items);
    });
  }
  // Toggle auto spacing mode
  async toggleAutoSpacing(isEnabled) {
    const spacing_mode = isEnabled ? "spacing_when_load" : "spacing_when_click";
    await chrome.storage.sync.set({ spacing_mode });
  }
  // Play sound effects
  async playSound(name) {
    const settings = await this.getCachedSettings();
    if (!settings.is_mute_sound_effects) {
      const audio = new Audio(chrome.runtime.getURL(this.sounds[name]));
      audio.play().catch((e) => console.log("Sound play failed:", e));
    }
  }
}
const utils = new Utils();
export {
  DEFAULT_SETTINGS as D,
  utils as u
};
