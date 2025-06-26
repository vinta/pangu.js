(function() {
  "use strict";
  const DEFAULT_SETTINGS = {
    spacing_mode: "spacing_when_load",
    filter_mode: "blacklist",
    blacklist: [
      "https://calendar.google.com/*",
      "https://docs.google.com/*",
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
  ({ ...DEFAULT_SETTINGS });
  chrome.storage.onChanged.addListener((changes, areaName) => {
  });
  async function autoSpacingPage() {
    const pangu = window.pangu;
    if (pangu) {
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      if (settings.is_enable_detect_cjk) {
        pangu.smartAutoSpacingPage();
      } else {
        pangu.autoSpacingPage();
      }
    }
  }
  function spacingPage() {
    const pangu = window.pangu;
    if (pangu) {
      pangu.spacingPage();
    }
  }
  const loadedMessage = { type: "CONTENT_SCRIPT_LOADED" };
  chrome.runtime.sendMessage(loadedMessage);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoSpacingPage);
  } else {
    autoSpacingPage();
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "PING") {
      sendResponse({ success: true });
    } else if (message.action === "MANUAL_SPACING") {
      spacingPage();
      sendResponse({ success: true });
    }
  });
})();
