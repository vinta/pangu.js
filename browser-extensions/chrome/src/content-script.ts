import { applyAiSpacing, warmUpAiSpacing } from './ai-spacing/content-script';
import type { ContentScriptResponse, MessageToContentScript } from './messages';
import { getSettings } from './settings/storage';

const pangu = window.pangu;

async function autoSpacingPage() {
  if (document.readyState === 'loading') {
    await new Promise<void>((resolve) => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }));
  }

  // Assigned before the sweep starts, so the initial pass is captured too
  const settings = await getSettings();
  if (settings.is_enable_ai_spacing) {
    pangu.onTextNodesSettled = (settledTextNodes) => {
      void applyAiSpacing(settledTextNodes);
    };
    warmUpAiSpacing();
  }

  pangu.autoSpacingPage();
}

// Manual spacing must wait too, or its first sweep loses the original text before the AI callback can capture it
const initialization = autoSpacingPage();
void initialization.catch((error: unknown) => console.error('Spacing initialization failed:', error));

async function spacingPage() {
  await initialization;
  pangu.spacingPage();
}

// Listen for messages from the popup
// This allows manual spacing even when auto-spacing is disabled
chrome.runtime.onMessage.addListener((message: MessageToContentScript, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'PING') {
    // PING is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'MANUAL_SPACING') {
    // MANUAL_SPACING is requested by user clicking button in popup
    void spacingPage().then(
      () => sendResponse({ success: true }),
      (error: unknown) => {
        console.error('Manual spacing failed:', error);
        sendResponse({ success: false });
      },
    );
    return true;
  }

  return false;
});

// Make this file a module to enable global type declarations
export {};
