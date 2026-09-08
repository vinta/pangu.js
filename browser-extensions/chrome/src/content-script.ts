import { applyAiSpacing, warmUpAiSpacing } from './ai-spacing/content-script';
import type { ContentScriptResponse, MessageToContentScript } from './messages';
import { getSettings, type Settings } from './settings/storage';
import { shouldAutoSpacing } from './settings/urls';

const pangu = window.pangu;

function startAutoSpacing(settings: Settings) {
  if (settings.is_enable_ai_spacing) {
    warmUpAiSpacing();
  }
  pangu.autoSpacingPage();
}

// Content script registration only applies at page load, so the navigation listener must check the URL policy when the URL changes as well
function applyAutoSpacingUrlPolicy(settings: Settings) {
  if (shouldAutoSpacing(settings, location.href)) {
    startAutoSpacing(settings);
  } else {
    pangu.stopAutoSpacingPage();
  }
}

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

  navigation.addEventListener('currententrychange', (event) => {
    // Same-URL history updates must not cancel manual activation.
    if (event.from.url !== location.href) {
      applyAutoSpacingUrlPolicy(settings);
    }
  });
  return settings;
}

const initialization = init();

// spacing_when_load: registration injected this script, so apply the URL policy once at load
async function startAutoSpacingByUrlPolicy() {
  try {
    const settings = await initialization;
    applyAutoSpacingUrlPolicy(settings);
  } catch (error) {
    console.error('Failed to initialize auto spacing', error);
  }
}

void startAutoSpacingByUrlPolicy();

// spacing_when_click: the popup injected this script and sends MANUAL_SPACING. Runs auto spacing unconditionally, until the URL changes. Never rejects: the popup reports { success: false } as a failed click
async function startManualSpacing() {
  const url = location.href;
  try {
    const settings = await initialization;
    if (location.href !== url) {
      return { success: false };
    }
    startAutoSpacing(settings);
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
