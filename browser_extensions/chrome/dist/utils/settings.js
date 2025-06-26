const spacing_mode = "spacing_when_load";
const filter_mode = "blacklist";
const blacklist = ["*://docs.google.com/*", "*://gist.github.com/*", "*://github.com/*/blob/*", "*://github.com/*/commit/*", "*://github.com/*/pull/*"];
const whitelist = [];
const is_mute_sound_effects = false;
const is_enable_detect_cjk = false;
const DEFAULT_SETTINGS_JSON = {
  spacing_mode,
  filter_mode,
  blacklist,
  whitelist,
  is_mute_sound_effects,
  is_enable_detect_cjk
};
const DEFAULT_SETTINGS = DEFAULT_SETTINGS_JSON;
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
