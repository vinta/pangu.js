import type { AmbiguousShape, SettledCandidate, TextEdit } from './ambiguous-shape';
import { applyTextEdits } from './ambiguous-shape';
import { hyphenSign } from './hyphen-sign';
import type { CandidateLabel, ClassifyCandidatesMessage, ClassifyCandidatesResponse } from './messages';

const pangu = window.pangu;

// Read off the singleton rather than imported: the content script is a classic script and cannot import the package
type SettledTextNode = Parameters<NonNullable<typeof pangu.onTextNodesSettled>>[0][number];
type LateFix = Parameters<typeof pangu.applyLateFixes>[0][number];

const AMBIGUOUS_SHAPES: AmbiguousShape[] = [hyphenSign];

async function classifyCandidates(kind: string, candidates: ClassifyCandidatesMessage['candidates']): Promise<ClassifyCandidatesResponse> {
  const message: ClassifyCandidatesMessage = { type: 'CLASSIFY_CANDIDATES', kind, candidates };
  try {
    return await chrome.runtime.sendMessage<ClassifyCandidatesMessage, ClassifyCandidatesResponse>(message);
  } catch (error) {
    // No worker to answer, e.g. the extension was reloaded while this page stayed open
    return { ok: false, error: String(error) };
  }
}

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

// Warm up the service worker's base sessions to mitigate cold start, which takes seconds on the first LanguageModel.create()
export function warmUpAiSpacing() {
  const pageText = document.documentElement.textContent ?? '';
  // The loop is not redundant: we create base sessions per ambiguous shape
  for (const ambiguousShape of AMBIGUOUS_SHAPES) {
    if (ambiguousShape.occursIn(pageText)) {
      console.debug(`[pangu] warm up base session: ${ambiguousShape.kind}`);
      void classifyCandidates(ambiguousShape.kind, []);
    }
  }
}

export async function applyAiSpacing(settledTextNodes: readonly SettledTextNode[]) {
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

  const labelBatches: (CandidateLabel | null)[][] = [];
  for (const [batchIndex, response] of responses.entries()) {
    if (!response.ok) {
      pangu.onTextNodesSettled = null;
      console.debug(`[pangu] ${batches[batchIndex]!.ambiguousShape.kind}: disabled for this page (${response.error})`);
      return;
    }
    labelBatches.push(response.candidates);
  }

  // Core applies one fix per text node per call, so every edit for one node composes into a single late fix
  const textEditsByNode = new Map<Text, { settled: string; textEdits: TextEdit[] }>();
  for (const [batchIndex, { ambiguousShape, settledCandidates }] of batches.entries()) {
    for (const [index, settledCandidate] of settledCandidates.entries()) {
      // Labels zip against the candidates by index
      const label = labelBatches[batchIndex]![index];
      const isFix = label != null && ambiguousShape.isFix(label);
      console.debug(`[pangu] ${ambiguousShape.kind}: "${settledCandidate.sentence}" (symbol at ${settledCandidate.at}) read as ${label ?? 'no label'}${isFix ? ' -> applying its late fix' : ''}`);
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
