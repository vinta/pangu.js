import type { HyphenSignCandidate } from '../../../src/browser/hyphen-sign';
import { getSettings } from './utils/settings';
import type { ClassifySpansMessage, ClassifySpansResponse, ContentScriptLoadedMessage, ContentScriptResponse, MessageToContentScript } from './utils/types';

// `Window.pangu` is declared globally in src/browser/pangu.umd.ts
// The pangu object is injected by pangu.umd.js which loads before this script

// One CLASSIFY_SPANS round trip per spacing batch, awaited with no deadline: a late answer is still safe to apply, because the applier drops any fix whose node changed since it was flagged, and
// the worker has no abort signal, so a deadline could only discard answers the model already paid for
async function classifySpans(spans: ClassifySpansMessage['spans']): Promise<ClassifySpansResponse> {
  const message: ClassifySpansMessage = { type: 'CLASSIFY_SPANS', spans };
  try {
    return await chrome.runtime.sendMessage<ClassifySpansMessage, ClassifySpansResponse>(message);
  } catch (error) {
    // No worker to answer, e.g. the extension was reloaded while this page stayed open. Same verdict as any other no
    return { ok: false, error: String(error) };
  }
}

// The model layer's page-side half: the rules already spaced these spans, and the ones read as signed numbers get that space taken back out.
// Every step logs at debug level (hidden until the console's Verbose level is on), so a wrong verdict on a live page is traceable without a build: this side shows each span's sentence and verdict,
// and the service worker's console shows the exact prompt text and raw model output
async function fixHyphenSigns(candidates: HyphenSignCandidate[]) {
  const response = await classifySpans(candidates.map(({ sentence, at }) => ({ sentence, at })));
  if (!response.ok) {
    // The first no is final for this page. An absent model, an availability other than 'available', and a create() that fails are all conditions that will not change while the page is open, so
    // unassigning the seam stops the finder as well as any further worker wakes
    window.pangu.onHyphenSpans = null;
    console.debug(`[pangu] hyphen-sign: disabled for this page (${response.error})`);
    return;
  }

  // Answers zip against the candidates by index
  const signedNumbers: HyphenSignCandidate[] = [];
  for (const [index, candidate] of candidates.entries()) {
    const span = response.spans[index];
    const verdict = span ? (span.answer ?? `error: ${span.error}`) : 'error: no answer at this index';
    const isSignedNumber = span?.answer === 'signed-number';
    console.debug(`[pangu] hyphen-sign: "${candidate.sentence}" (hyphen at ${candidate.at}) read as ${verdict}${isSignedNumber ? ' -> removing the space after the hyphen' : ''}`);
    if (isSignedNumber) {
      signedNumbers.push(candidate);
    }
  }
  if (signedNumbers.length > 0) {
    window.pangu.applyHyphenSignFixes(signedNumbers);
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
      void fixHyphenSigns(candidates);
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
