import { D as DEFAULT_SETTINGS } from "./utils/settings.js";
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
