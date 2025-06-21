// Content script that runs on web pages to apply spacing
declare global {
  interface Window {
    pangu: {
      autoSpacingPage(): void;
      spacingPage(): void;
    };
  }
}

// Track if spacing has been initialized
let spacingInitialized = false;

// Function to apply spacing
function applySpacing() {
  if (typeof window.pangu !== 'undefined') {
    if (window.pangu.autoSpacingPage) {
      window.pangu.autoSpacingPage();
      spacingInitialized = true;
    } else if (window.pangu.spacingPage) {
      window.pangu.spacingPage();
    }
  }
}

// Handle document ready state
function onDocumentReady() {
  // Since this content script is only injected when auto-spacing is enabled,
  // we can apply spacing directly without checking
  applySpacing();
}

// Check document state and apply spacing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
} else {
  onDocumentReady();
}

// Listen for manual spacing requests from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'manual_spacing') {
    applySpacing();
    sendResponse({ success: true });
  } else if (message.action === 'ping') {
    // Respond to ping to indicate content script is loaded
    sendResponse({ success: true });
  }
  return true;
});