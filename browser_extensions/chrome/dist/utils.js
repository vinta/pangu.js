const DEFAULT_SETTINGS = {
  spacing_mode: "spacing_when_load",
  filter_mode: "blacklist",
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
        for (const [key, change] of Object.entries(changes)) {
          if (key in this.cachedSettings) {
            this.cachedSettings = {
              ...this.cachedSettings,
              [key]: change.newValue
            };
          }
        }
      }
    });
  }
  // Get cached settings
  async getCachedSettings() {
    if (!this.cacheInitialized) {
      const response = await chrome.runtime.sendMessage({ action: "get_settings" });
      if (response && response.settings) {
        this.cachedSettings = response.settings;
        this.cacheInitialized = true;
      }
    }
    return this.cachedSettings;
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
