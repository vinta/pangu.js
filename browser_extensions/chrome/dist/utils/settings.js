const DEFAULT_SETTINGS = {
  spacing_mode: "spacing_when_load",
  filter_mode: "blacklist",
  blacklist: [
    "https://docs.google.com/*",
    "https://calendar.google.com/*",
    "https://gist.github.com/*",
    "https://github.com/*/blob/*",
    "https://github.com/*/commit/*",
    "https://github.com/*/pull/*",
    "https://github.com/vinta/pangu.js/issues*",
    "https://www.netflix.com/*"
  ],
  whitelist: [],
  is_mute_sound_effects: false,
  is_enable_detect_cjk: false
};
let cachedSettings = { ...DEFAULT_SETTINGS };
let cacheInitialized = false;
async function getCachedSettings() {
  if (!cacheInitialized) {
    cachedSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    cacheInitialized = true;
  }
  return cachedSettings;
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && cacheInitialized) {
    for (const [key, change] of Object.entries(changes)) {
      if (key in cachedSettings) {
        cachedSettings = {
          ...cachedSettings,
          [key]: change.newValue
        };
      }
    }
  }
});
export {
  DEFAULT_SETTINGS as D,
  getCachedSettings as g
};
