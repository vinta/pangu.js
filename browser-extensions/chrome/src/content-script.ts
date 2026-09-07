import { applyAiSpacing, warmUpAiSpacing } from './ai-spacing/content-script';
import type { ContentScriptResponse, MessageToContentScript } from './messages';
import { getSettings } from './settings/storage';
import { shouldAutoSpacing } from './settings/urls';

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

  let warmedUp = false;
  const startAutoSpacing = () => {
    if (settings.is_enable_ai_spacing && !warmedUp) {
      warmedUp = true;
      warmUpAiSpacing();
    }
    pangu.autoSpacingPage();
  };

  // Registration only handles page loads. A URL change ends the manual override and restores the configured mode (see docs/adr/0020).
  const applyAutoSpacingUrlPolicy = () => {
    if (shouldAutoSpacing(settings, location.href)) {
      startAutoSpacing();
    } else {
      pangu.stopAutoSpacingPage();
    }
  };
  navigation.addEventListener('currententrychange', (event) => {
    // Same-URL history updates must not cancel manual activation.
    if (event.from.url !== location.href) {
      applyAutoSpacingUrlPolicy();
    }
  });
  applyAutoSpacingUrlPolicy();
  return startAutoSpacing;
}

const initialization = init();
void initialization.catch((error) => console.error('Failed to initialize auto spacing', error));

chrome.runtime.onMessage.addListener((message: MessageToContentScript, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'PING') {
    // PING is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'MANUAL_SPACING') {
    // The manual spacing button runs auto spacing unconditionally, until the URL changes.
    const url = location.href;
    initialization
      .then((startAutoSpacing) => {
        if (location.href !== url) {
          sendResponse({ success: false });
          return;
        }
        startAutoSpacing();
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error(`Failed to start auto spacing on ${url}:`, error);
        sendResponse({ success: false });
      });
    return true;
  }

  return false;
});

// Make this file a module to enable global type declarations
export {};
