import type { AmbiguousShape, Candidate, TextEdit } from './utils/ai-spacing';
import { applyTextEdits } from './utils/ai-spacing';
import { hyphenSign } from './utils/hyphen-sign';
import { getSettings } from './utils/settings';
import type { ClassifiedCandidate, ClassifyCandidatesMessage, ClassifyCandidatesResponse, ContentScriptLoadedMessage, ContentScriptResponse, MessageToContentScript } from './utils/types';

// `Window.pangu` is declared globally in src/browser/pangu.umd.ts, and pangu.umd.js is always listed before this script in the injection arrays (service worker
// registration and the popup's manual injection), so it is already set when this module runs
const pangu = window.pangu;

// The core seam's records, read off the singleton rather than imported: the content script is a classic script that cannot import the package at runtime
type SettledTextNode = Parameters<NonNullable<typeof pangu.onTextNodesSettled>>[0][number];
type LateFix = Parameters<typeof pangu.applyLateFixes>[0][number];

// Every ambiguous shape AI spacing reads on a page. Each one is asked in its own message, and the shapes that land on one text node compose into one late fix
const AMBIGUOUS_SHAPES: AmbiguousShape[] = [hyphenSign];

// One CLASSIFY_CANDIDATES round trip per ambiguous shape per batch, awaited with no deadline: a late answer is still safe to apply, because the applier drops any fix whose node changed since it was
// flagged, and the worker has no abort signal, so a deadline could only discard answers the model already paid for
async function classifyCandidates(kind: string, candidates: ClassifyCandidatesMessage['candidates']): Promise<ClassifyCandidatesResponse> {
  const message: ClassifyCandidatesMessage = { type: 'CLASSIFY_CANDIDATES', kind, candidates };
  try {
    return await chrome.runtime.sendMessage<ClassifyCandidatesMessage, ClassifyCandidatesResponse>(message);
  } catch (error) {
    // No worker to answer, e.g. the extension was reloaded while this page stayed open. Same verdict as any other no
    return { ok: false, error: String(error) };
  }
}

// Every occurrence of one ambiguous shape in this batch: flagged on the bytes text spacing read, then resolved against the bytes the batch settled on. A match whose symbol did not end up with the
// inserted gap settles to null and is dropped here, so nothing that is not the extension's own space to take back ever reaches the classifier
function findCandidates(ambiguousShape: AmbiguousShape, settledTextNodes: readonly SettledTextNode[]) {
  const candidates: Candidate[] = [];
  for (const settledTextNode of settledTextNodes) {
    for (const candidateMatch of ambiguousShape.find(settledTextNode.before)) {
      const index = ambiguousShape.settle(settledTextNode.after, candidateMatch);
      if (index !== null) {
        candidates.push({ kind: ambiguousShape.kind, node: settledTextNode.node, sentence: candidateMatch.sentence, at: candidateMatch.at, index, after: settledTextNode.after });
      }
    }
  }
  return candidates;
}

// AI spacing's page-side half: the rules already spaced these text nodes, and the candidates whose label calls for a fix get that space taken back out.
// Every step logs at debug level (hidden until the console's Verbose level is on), so a wrong verdict on a live page is traceable without a build: this side shows each candidate's sentence and
// verdict, and the service worker's console shows the exact prompt text and raw model output
async function classifyBatch(settledTextNodes: readonly SettledTextNode[]) {
  // Core hands over every text node text spacing read, so most batches carry no candidate at all. Asking only for the shapes that found one is what keeps the worker wakes, and the multi-second
  // cold-start create() behind them, down to the batches that can actually produce a fix
  const batches = AMBIGUOUS_SHAPES.map((ambiguousShape) => ({ ambiguousShape, candidates: findCandidates(ambiguousShape, settledTextNodes) })).filter((batch) => batch.candidates.length > 0);
  if (batches.length === 0) {
    return;
  }

  const responses = await Promise.all(
    batches.map(({ ambiguousShape, candidates }) =>
      classifyCandidates(
        ambiguousShape.kind,
        candidates.map(({ sentence, at }) => ({ sentence, at })),
      ),
    ),
  );

  // The first no is final for this page, whichever ambiguous shape hit it. An absent model, an availability other than 'available', and a create() that fails are all conditions that will not change
  // while the page is open, so unassigning the seam stops the finder as well as any further worker wakes. Checked across every kind before anything is composed, so a no never lands a half-batch
  const classifiedCandidateBatches: ClassifiedCandidate[][] = [];
  for (const [batchIndex, response] of responses.entries()) {
    if (!response.ok) {
      pangu.onTextNodesSettled = null;
      console.debug(`[pangu] ${batches[batchIndex]!.ambiguousShape.kind}: disabled for this page (${response.error})`);
      return;
    }
    classifiedCandidateBatches.push(response.candidates);
  }

  // A text node can carry candidates from more than one ambiguous shape, and core applies one fix per text node per call, so every edit for one node composes into a single late fix
  const textEditsByNode = new Map<Text, { after: string; textEdits: TextEdit[] }>();
  for (const [batchIndex, { ambiguousShape, candidates }] of batches.entries()) {
    for (const [index, candidate] of candidates.entries()) {
      // Labels zip against the candidates by index
      const classifiedCandidate = classifiedCandidateBatches[batchIndex]![index];
      const verdict = classifiedCandidate ? (classifiedCandidate.label ?? `error: ${classifiedCandidate.error}`) : 'error: no label at this index';
      const isFix = classifiedCandidate?.label != null && ambiguousShape.isFix(classifiedCandidate.label);
      console.debug(`[pangu] ${ambiguousShape.kind}: "${candidate.sentence}" (symbol at ${candidate.at}) read as ${verdict}${isFix ? ' -> applying its late fix' : ''}`);
      if (isFix) {
        const pending = textEditsByNode.get(candidate.node) ?? { after: candidate.after, textEdits: [] };
        pending.textEdits.push(...ambiguousShape.edits(candidate.after, candidate.index));
        textEditsByNode.set(candidate.node, pending);
      }
    }
  }

  const lateFixes: LateFix[] = [];
  for (const [node, { after, textEdits }] of textEditsByNode) {
    lateFixes.push({ node, settled: after, data: applyTextEdits(after, textEdits) });
  }
  if (lateFixes.length > 0) {
    pangu.applyLateFixes(lateFixes);
  }
}

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
