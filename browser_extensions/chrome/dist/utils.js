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
  sounds = {
    Hadouken: "sounds/StreetFighter-Hadouken.mp3",
    Shouryuuken: "sounds/StreetFighter-Shouryuuken.mp3",
    YeahBaby: "sounds/AustinPowers-YeahBaby.mp3",
    WahWahWaaah: "sounds/ManciniPinkPanther-WahWahWaaah.mp3"
  };
  constructor() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && this.cacheInitialized) {
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
  async getCachedSettings() {
    if (!this.cacheInitialized) {
      this.cachedSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      this.cacheInitialized = true;
    }
    return this.cachedSettings;
  }
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
