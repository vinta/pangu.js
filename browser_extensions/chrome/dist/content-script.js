function applySpacing() {
  if (typeof window.pangu !== "undefined") {
    if (window.pangu.autoSpacingPage) {
      window.pangu.autoSpacingPage();
    } else if (window.pangu.spacingPage) {
      window.pangu.spacingPage();
    }
  }
}
function onDocumentReady() {
  applySpacing();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDocumentReady);
} else {
  onDocumentReady();
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "manual_spacing") {
    applySpacing();
    sendResponse({ success: true });
  } else if (message.action === "ping") {
    sendResponse({ success: true });
  }
  return true;
});
