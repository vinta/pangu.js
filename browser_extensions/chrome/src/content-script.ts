import type { BrowserPangu } from '../../../src/browser/pangu';
import { DEFAULT_SETTINGS } from './utils/settings';
import type { MessageToContentScript, ContentScriptResponse, ContentScriptLoadedMessage, Settings } from './utils/types';

// Extend the global Window interface to include the pangu object
// The pangu object is injected by pangu.umd.js which loads before this script
declare global {
  interface Window {
    pangu: BrowserPangu;
  }
}

async function autoSpacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    const settings = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
    console.log(`pangu.js settings:`, settings);
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

// Notify that content script has loaded
const loadedMessage: ContentScriptLoadedMessage = { type: 'CONTENT_SCRIPT_LOADED' };
chrome.runtime.sendMessage(loadedMessage);

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
chrome.runtime.onMessage.addListener((message: MessageToContentScript, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'PING') {
    // PING is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'MANUAL_SPACING') {
    // MANUAL_SPACING is requested by user clicking button in popup
    spacingPage();
    sendResponse({ success: true });
  }

  // Return true only when sending response asynchronously
  // Return nothing (or false) when sending response synchronously
});

// Make this file a module to enable global type declarations
export {};
