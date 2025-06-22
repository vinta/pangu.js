import type { BrowserPangu } from '../../../src/browser/pangu';
import type { ContentScriptMessage, ContentScriptResponse } from './types';

declare global {
  interface Window {
    pangu: BrowserPangu;
  }
}

// Apply auto-spacing with continuous DOM monitoring
function autoSpacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.autoSpacingPage();
  }
}

// Apply manual spacing (runs once)
function spacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.spacingPage();
  }
}

// Apply auto-spacing when the content script loads
// This only happens when auto-spacing is enabled and the page matches the filter rules
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoSpacingPage);
} else {
  autoSpacingPage();
}

// Listen for manual spacing requests from popup
chrome.runtime.onMessage.addListener((message: ContentScriptMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'manual_spacing') {
    spacingPage();
    sendResponse({ success: true });
  } else if (message.action === 'ping') {
    // Respond to ping to indicate content script is loaded
    sendResponse({ success: true });
  }
  return true;
});

export {};
