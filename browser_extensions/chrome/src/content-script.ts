// Content script that runs on web pages to apply spacing

// Type definition for the pangu global object
interface PanguGlobal {
  autoSpacingPage(): void;
  spacingPage(): void;
}

// Apply auto-spacing with continuous monitoring
function applyAutoSpacing() {
  const pangu = (window as { pangu?: PanguGlobal }).pangu;
  if (typeof pangu !== 'undefined') {
    pangu.autoSpacingPage();
  }
}

// Apply manual spacing (runs once)
function applyManualSpacing() {
  const pangu = (window as { pangu?: PanguGlobal }).pangu;
  if (typeof pangu !== 'undefined') {
    pangu.spacingPage();
  }
}

// Apply auto-spacing when the content script loads
// This only happens when auto-spacing is enabled and the page matches the filter rules
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyAutoSpacing);
} else {
  applyAutoSpacing();
}

// Listen for manual spacing requests from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'manual_spacing') {
    applyManualSpacing();
    sendResponse({ success: true });
  } else if (message.action === 'ping') {
    // Respond to ping to indicate content script is loaded
    sendResponse({ success: true });
  }
  return true;
});