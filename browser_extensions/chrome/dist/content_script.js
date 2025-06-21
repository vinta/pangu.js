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
  chrome.runtime.sendMessage({ purpose: "can_spacing" }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Extension context invalidated");
      return;
    }
    if (!response?.result) {
      return;
    }
    applySpacing();
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDocumentReady);
} else {
  onDocumentReady();
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "manual_spacing") {
    applySpacing();
    sendResponse({ success: true });
  }
  return true;
});
