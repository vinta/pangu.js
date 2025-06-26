(function() {
  "use strict";
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
