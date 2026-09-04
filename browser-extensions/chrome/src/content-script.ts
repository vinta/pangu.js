import { classifyBatch } from './ai-spacing/in-content-script';
import type { ContentScriptResponse, MessageToContentScript } from './messages';
import { getSettings } from './settings/storage';

// `Window.pangu` is declared globally in src/browser/pangu.umd.ts, and pangu.umd.js is always listed before this script in the injection arrays (service worker
// registration and the popup's manual injection), so it is already set when this module runs
const pangu = window.pangu;

async function autoSpacingPage() {
  // Assigned before the sweep starts, so the initial pass is captured too
  const settings = await getSettings();
  if (settings.is_enable_ai_spacing) {
    pangu.onTextNodesSettled = (settledTextNodes) => {
      void classifyBatch(settledTextNodes);
    };
  }

  pangu.autoSpacingPage();
}

function spacingPage() {
  pangu.spacingPage();
}

// Document Loading Lifecycle:
// loading → (DOM parsing completes) → DOMContentLoaded event fires → interactive → (resources load) → load event fires → complete
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
