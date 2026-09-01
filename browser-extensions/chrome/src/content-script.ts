import type { HyphenSignCandidate } from '../../../src/browser/hyphen-sign';
import { getSettings } from './utils/settings';
import type { ClassifySpansMessage, ClassifySpansResponse, ContentScriptLoadedMessage, ContentScriptResponse, MessageToContentScript } from './utils/types';

// `Window.pangu` is declared globally in src/browser/pangu.umd.ts
// The pangu object is injected by pangu.umd.js which loads before this script

// One CLASSIFY_SPANS round trip per spacing batch. A batch that has not answered by then is abandoned: the rules output stands and the late answer is dropped
const CLASSIFY_DEADLINE_MS = 30 * 1000;

// The first no is final for this page. An absent model, an availability other than 'available', and a create() that fails are all conditions that will not change while the page is open, so there is
// nothing to gain from waking the service worker again
let isModelPathDisabled = false;

async function classifySpans(spans: ClassifySpansMessage['spans']): Promise<ClassifySpansResponse | null> {
  const message: ClassifySpansMessage = { type: 'CLASSIFY_SPANS', spans };
  const deadline = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), CLASSIFY_DEADLINE_MS);
  });

  try {
    return await Promise.race([chrome.runtime.sendMessage<ClassifySpansMessage, ClassifySpansResponse>(message), deadline]);
  } catch (error) {
    // No worker to answer, e.g. the extension was reloaded while this page stayed open. Same verdict as any other no
    return { ok: false, error: String(error) };
  }
}

// The model layer's page-side half: the rules already spaced these spans, and the ones read as signed numbers get that space taken back out
async function fixHyphenSigns(pangu: NonNullable<Window['pangu']>, candidates: HyphenSignCandidate[]) {
  if (isModelPathDisabled) {
    return;
  }

  const response = await classifySpans(candidates.map(({ sentence, at }) => ({ sentence, at })));
  if (response === null) {
    return;
  }
  if (!response.ok) {
    isModelPathDisabled = true;
    return;
  }

  // Answers zip against the candidates by index
  const signedNumbers = candidates.filter((_candidate, index) => response.spans[index]?.answer === 'signed-number');
  if (signedNumbers.length > 0) {
    pangu.applyHyphenSignFixes(signedNumbers);
  }
}

async function autoSpacingPage() {
  const pangu = window.pangu;
  if (!pangu) {
    return;
  }

  // Assigned before the sweep starts, so the initial pass is captured too
  const settings = await getSettings();
  if (settings.is_enable_ai_spacing) {
    pangu.onHyphenSpans = (candidates) => {
      void fixHyphenSigns(pangu, candidates);
    };
  }

  pangu.autoSpacingPage();
}

function spacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.spacingPage();
  }
}

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
