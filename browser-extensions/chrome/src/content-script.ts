import { applyAiSpacing, warmUpAiSpacing } from './ai-spacing/content-script';
import type { ContentScriptResponse, MessageToContentScript } from './messages';
import { getSettings } from './settings/storage';
import { shouldAutoSpace } from './settings/urls';

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
  }

  // Chrome matches the registration's url patterns only when a document is created, and single-page apps like GitHub change the url without creating one, so the blacklist and whitelist
  // are applied here instead: at load and on every same-document navigation (see docs/adr/0020). Both core calls are idempotent, so the same-url replace events some pages fire are harmless.
  // The model warms up once, on the first url that spaces: an excluded page never needs it
  let warmedUp = false;
  const followUrl = () => {
    if (!shouldAutoSpace(settings, location.href)) {
      pangu.stopAutoSpacingPage();
      return;
    }
    if (settings.is_enable_ai_spacing && !warmedUp) {
      warmedUp = true;
      warmUpAiSpacing();
    }
    pangu.autoSpacingPage();
  };
  navigation.addEventListener('currententrychange', followUrl);
  followUrl();
}

void init();

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
