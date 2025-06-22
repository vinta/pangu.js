import type { BrowserPangu } from '../../../src/browser/pangu';
import type { ContentScriptMessage, ContentScriptResponse } from './types';

// Extend the global Window interface to include the pangu object
// The pangu object is injected by pangu.umd.js which loads before this script
declare global {
  interface Window {
    pangu: BrowserPangu;
  }
}

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

// Document Loading Lifecycle:
// loading → (DOM parsing completes) → DOMContentLoaded event fires →
// interactive → (resources load) → load event fires → complete
if (document.readyState === 'loading') {
  // DOMContentLoaded only fires once -> autoSpacingPage() only runs once
  document.addEventListener('DOMContentLoaded', autoSpacingPage);
} else {
  // this content script only runs once -> autoSpacingPage() only runs once
  autoSpacingPage();
}

// Listen for messages from the popup
// This allows manual spacing even when auto-spacing is disabled
chrome.runtime.onMessage.addListener((message: ContentScriptMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'ping') {
    // ping is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'manual_spacing') {
    // manual_spacing is requested by user clicking button in popup
    spacingPage();
    sendResponse({ success: true });
  }

  // Return true only when sending response asynchronously
  // Return nothing (or false) when sending response synchronously
});

// Make this file a module to enable global type declarations
export {};
