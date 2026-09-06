import { applyAiSpacing, warmUpAiSpacing } from './ai-spacing/content-script';
import type { ContentScriptResponse, MessageToContentScript } from './messages';
import { getSettings } from './settings/storage';

const pangu = window.pangu;

// This content script is only injected and run once per webpage:
// - when spacing_mode === 'spacing_when_load'
// - when the user clicks the manual spacing button in popup
async function init() {
  // Assigned before the sweep starts, so the initial pass is captured too
  const settings = await getSettings();
  if (settings.is_enable_ai_spacing) {
    pangu.onTextNodesSettled = (settledTextNodes) => {
      void applyAiSpacing(settledTextNodes);
    };
    warmUpAiSpacing();
  }
}

void init().then(() => pangu.autoSpacingPage());

// This allows manual spacing from popup when spacing_mode === 'spacing_when_click'
chrome.runtime.onMessage.addListener((message: MessageToContentScript, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'PING') {
    // PING is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'MANUAL_SPACING') {
    // MANUAL_SPACING is requested by user clicking button in popup
    pangu.spacingPage();
    sendResponse({ success: true });
  }

  // Return true only when sending response asynchronously
  // Return nothing (or false) when sending response synchronously
});

// Make this file a module to enable global type declarations
export {};
