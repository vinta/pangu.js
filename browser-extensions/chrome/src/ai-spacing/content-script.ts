import pangu, { type LateFix, type SettledTextNode } from '../../../../src/browser/pangu';
import type { CandidateLabel, ClassifyCandidatesMessage, ClassifyCandidatesResponse } from './messages';
import { readSentence } from './sentence-context';
import type { AmbiguousShape, SettledCandidate, TextEdit } from './shapes/base';
import { applyTextEdits } from './shapes/base';
import { hyphenSign } from './shapes/hyphen-shape';
import { nameSuffix } from './shapes/name-suffix-shape';

const AMBIGUOUS_SHAPES: AmbiguousShape[] = [hyphenSign, nameSuffix];

async function requestClassification(kind: string, candidates: ClassifyCandidatesMessage['candidates']): Promise<ClassifyCandidatesResponse> {
  const message: ClassifyCandidatesMessage = { type: 'CLASSIFY_CANDIDATES', kind, candidates };
  try {
    return await chrome.runtime.sendMessage<ClassifyCandidatesMessage, ClassifyCandidatesResponse>(message);
  } catch (error) {
    // No worker to answer, e.g. the extension was reloaded while this page stayed open
    return { ok: false, error: String(error) };
  }
}

function findCandidates(ambiguousShape: AmbiguousShape, settledTextNodes: readonly SettledTextNode[], unspacedByNode: ReadonlyMap<Text, string>) {
  const settledCandidates: SettledCandidate[] = [];
  for (const settledTextNode of settledTextNodes) {
    const sentenceAt = (at: number) => readSentence(settledTextNode.node, settledTextNode.unspaced, at, unspacedByNode);
    for (const candidateMatch of ambiguousShape.find(settledTextNode.unspaced, settledTextNode.settled, sentenceAt)) {
      settledCandidates.push({ ...candidateMatch, node: settledTextNode.node, settled: settledTextNode.settled });
    }
  }
  return settledCandidates;
}

interface ShapeCandidates {
  ambiguousShape: AmbiguousShape;
  settledCandidates: SettledCandidate[];
}

function collectLateFixes(labeledShapeCandidates: readonly (ShapeCandidates & { candidateLabels: readonly (CandidateLabel | null)[] })[]) {
  // Core applies one fix per text node per call, so every edit for one node composes into a single late fix
  const textEditsByNode = new Map<Text, { settled: string; textEdits: TextEdit[] }>();
  for (const { ambiguousShape, settledCandidates, candidateLabels } of labeledShapeCandidates) {
    for (const [index, settledCandidate] of settledCandidates.entries()) {
      const candidateLabel = candidateLabels[index] ?? null;
      // Do not skip missing labels here: shapes without a model still need to produce their edits
      const textEdits = ambiguousShape.edits(settledCandidate, candidateLabel);
      console.debug(
        `[pangu] Shape ${ambiguousShape.kind}: "${settledCandidate.sentence}" (symbol at ${settledCandidate.at}, label: ${candidateLabel ?? 'none'})${textEdits.length > 0 ? ' -> applying its late fix' : ''}`,
      );
      if (textEdits.length > 0) {
        const textNodeEdits = textEditsByNode.get(settledCandidate.node) ?? { settled: settledCandidate.settled, textEdits: [] };
        textNodeEdits.textEdits.push(...textEdits);
        textEditsByNode.set(settledCandidate.node, textNodeEdits);
      }
    }
  }

  const lateFixes: LateFix[] = [];
  for (const [textNode, { settled, textEdits }] of textEditsByNode) {
    lateFixes.push({ node: textNode, settled, data: applyTextEdits(settled, textEdits) });
  }
  return lateFixes;
}

// Auto spacing restarts on every URL change and manual click, but the page text only needs scanning once
let warmedUp = false;

// Warm up the service worker's base sessions to mitigate cold start, which takes seconds on the first LanguageModel.create()
export function warmUpAiSpacing() {
  if (warmedUp) {
    return;
  }
  warmedUp = true;
  const pageText = document.documentElement.textContent;
  // The loop is not redundant: we create base sessions per ambiguous shape
  for (const ambiguousShape of AMBIGUOUS_SHAPES) {
    // A shape needs the model doesn't always mean we need to warm up the model on every webpage
    // We only warm up when the webpage contains certain texts => needsModel() returns true
    if (ambiguousShape.needsModel?.(pageText)) {
      console.debug(`[pangu] Shape ${ambiguousShape.kind} warms up its base session`);
      void requestClassification(ambiguousShape.kind, []);
    }
  }
}

// Once the worker fails to answer, this page's model shapes stay off; shapes resolved by rules keep running
let modelFailed = false;

async function classifyShapeCandidates({ ambiguousShape, settledCandidates }: ShapeCandidates): Promise<readonly (CandidateLabel | null)[]> {
  if (!ambiguousShape.needsModel) {
    return [];
  }
  const candidates = settledCandidates.map(({ sentence, at }) => ({ sentence, at }));
  const response = await requestClassification(ambiguousShape.kind, candidates);
  if (response.ok) {
    return response.candidateLabels;
  }
  modelFailed = true;
  console.debug(`[pangu] Shape ${ambiguousShape.kind} disabled for this page (${response.error})`);
  return [];
}

export async function applyAiSpacing(settledTextNodes: readonly SettledTextNode[]) {
  const unspacedByNode = new Map(settledTextNodes.map(({ node, unspaced }) => [node, unspaced]));
  const shapeCandidates: ShapeCandidates[] = AMBIGUOUS_SHAPES.filter((ambiguousShape) => !modelFailed || !ambiguousShape.needsModel)
    .map((ambiguousShape) => ({ ambiguousShape, settledCandidates: findCandidates(ambiguousShape, settledTextNodes, unspacedByNode) }))
    .filter(({ settledCandidates }) => settledCandidates.length > 0);
  if (shapeCandidates.length === 0) {
    return;
  }

  const labeledShapeCandidates = await Promise.all(shapeCandidates.map(async (shapeCandidate) => ({ ...shapeCandidate, candidateLabels: await classifyShapeCandidates(shapeCandidate) })));

  const lateFixes = collectLateFixes(labeledShapeCandidates);
  if (lateFixes.length > 0) {
    pangu.applyLateFixes(lateFixes);
  }
}
