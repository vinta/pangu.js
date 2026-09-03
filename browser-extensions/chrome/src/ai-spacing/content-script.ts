import type { AmbiguousShape, SettledCandidate, TextEdit } from './ambiguous-shape';
import { applyTextEdits } from './ambiguous-shape';
import { hyphenSign } from './hyphen-sign';
import type { ClassifiedCandidate, ClassifyCandidatesMessage, ClassifyCandidatesResponse } from './messages';

// The same singleton the entry reads; see content-script.ts at the root for why it is already set when this module runs
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
  const settledCandidates: SettledCandidate[] = [];
  for (const settledTextNode of settledTextNodes) {
    for (const candidateMatch of ambiguousShape.find(settledTextNode.unspaced)) {
      const index = ambiguousShape.settle(settledTextNode.settled, candidateMatch);
      if (index !== null) {
        settledCandidates.push({ kind: ambiguousShape.kind, node: settledTextNode.node, sentence: candidateMatch.sentence, at: candidateMatch.at, index, settled: settledTextNode.settled });
      }
    }
  }
  return settledCandidates;
}

// AI spacing's page-side half: the rules already spaced these text nodes, and the candidates whose label calls for a fix get that space taken back out.
// Every step logs at debug level (hidden until the console's Verbose level is on), so a wrong verdict on a live page is traceable without a build: this side shows each candidate's sentence and
// verdict, and the service worker's console shows the exact prompt text and raw model output
export async function classifyBatch(settledTextNodes: readonly SettledTextNode[]) {
  // Core hands over every text node text spacing read, so most batches carry no candidate at all. Asking only for the shapes that found one is what keeps the worker wakes, and the multi-second
  // cold-start create() behind them, down to the batches that can actually produce a fix
  const batches = AMBIGUOUS_SHAPES.map((ambiguousShape) => ({ ambiguousShape, settledCandidates: findCandidates(ambiguousShape, settledTextNodes) })).filter(
    (batch) => batch.settledCandidates.length > 0,
  );
  if (batches.length === 0) {
    return;
  }

  const responses = await Promise.all(
    batches.map(({ ambiguousShape, settledCandidates }) =>
      classifyCandidates(
        ambiguousShape.kind,
        settledCandidates.map(({ sentence, at }) => ({ sentence, at })),
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
  const textEditsByNode = new Map<Text, { settled: string; textEdits: TextEdit[] }>();
  for (const [batchIndex, { ambiguousShape, settledCandidates }] of batches.entries()) {
    for (const [index, settledCandidate] of settledCandidates.entries()) {
      // Labels zip against the candidates by index
      const classifiedCandidate = classifiedCandidateBatches[batchIndex]![index];
      const verdict = classifiedCandidate ? (classifiedCandidate.label ?? `error: ${classifiedCandidate.error}`) : 'error: no label at this index';
      const isFix = classifiedCandidate?.label != null && ambiguousShape.isFix(classifiedCandidate.label);
      console.debug(`[pangu] ${ambiguousShape.kind}: "${settledCandidate.sentence}" (symbol at ${settledCandidate.at}) read as ${verdict}${isFix ? ' -> applying its late fix' : ''}`);
      if (isFix) {
        const pending = textEditsByNode.get(settledCandidate.node) ?? { settled: settledCandidate.settled, textEdits: [] };
        pending.textEdits.push(...ambiguousShape.edits(settledCandidate.settled, settledCandidate.index));
        textEditsByNode.set(settledCandidate.node, pending);
      }
    }
  }

  const lateFixes: LateFix[] = [];
  for (const [node, { settled, textEdits }] of textEditsByNode) {
    lateFixes.push({ node, settled, data: applyTextEdits(settled, textEdits) });
  }
  if (lateFixes.length > 0) {
    pangu.applyLateFixes(lateFixes);
  }
}
