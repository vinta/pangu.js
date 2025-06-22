function autoSpacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.autoSpacingPage();
  }
}
function spacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.spacingPage();
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoSpacingPage);
} else {
  autoSpacingPage();
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "manual_spacing") {
    spacingPage();
    sendResponse({ success: true });
  } else if (message.action === "ping") {
    sendResponse({ success: true });
  }
  return true;
});
