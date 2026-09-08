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

  const startAutoSpacing = () => {
    if (settings.is_enable_ai_spacing) {
      warmUpAiSpacing();
    }
    pangu.autoSpacingPage();
  };

  // Content script registration only applies at page load, so the navigation listener must check the URL policy when the URL changes as well
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

// The manual spacing button runs auto spacing unconditionally, until the URL changes. Never rejects: the popup reports { success: false } as a failed click
async function startManualSpacing() {
  const url = location.href;
  try {
    const startAutoSpacing = await initialization;
    if (location.href !== url) {
      return { success: false };
    }
    startAutoSpacing();
    return { success: true };
  } catch (error) {
    console.error('Failed to start auto spacing on %s:', url, error);
    return { success: false };
  }
}

chrome.runtime.onMessage.addListener((message: MessageToContentScript, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'PING') {
    // PING is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'MANUAL_SPACING') {
    // Chrome closes the message channel when a listener returns a promise, so return true and let startManualSpacing() answer
    void startManualSpacing().then(sendResponse);
    return true;
  }

  return false;
});

// Make this file a module to enable global type declarations
export {};
