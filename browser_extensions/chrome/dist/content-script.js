function applyAutoSpacing() {
  const pangu = window.pangu;
  if (typeof pangu !== "undefined") {
    pangu.autoSpacingPage();
  }
}
function applyManualSpacing() {
  const pangu = window.pangu;
  if (typeof pangu !== "undefined") {
    pangu.spacingPage();
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyAutoSpacing);
} else {
  applyAutoSpacing();
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "manual_spacing") {
    applyManualSpacing();
    sendResponse({ success: true });
  } else if (message.action === "ping") {
    sendResponse({ success: true });
  }
  return true;
});
