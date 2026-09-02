// AI spacing's classifier: Chrome's built-in Prompt API classifies how one flagged symbol reads, and rules elsewhere decide the spacing. The model only ever picks a label from an enum, it
// never emits text (ADR 0009).
//
// This lives in the service worker rather than the content script for one reason: `temperature` and `topK` are documented as the extension-context surface and a content script appears to get the
// plain-web surface instead, where sampling cannot be pinned at all. See docs/prompt-api-reference.md.
import type { PromptSpec } from './ai-spacing';
import { hyphenPrompt } from './hyphen-prompt';
import type { CandidateLabel, ClassifiedCandidate, ClassifyCandidatesResponse, ClassifyRequest } from './types';

// One prompt spec per ambiguous shape, keyed by the `kind` the message carries
const PROMPT_SPECS = new Map<string, PromptSpec<CandidateLabel>>([[hyphenPrompt.kind, hyphenPrompt]]);

// One base session per ambiguous shape, each holding only that shape's system prompt: cloning it per candidate saves re-parsing the system instructions, and create() costs roughly five prompts. The
// sessions are in-memory, so MV3 idle termination simply means the next call recreates them. What is cached is the promise, not the session: batches from several tabs that arrive while the first
// create() is still in flight share that one create() instead of each paying for its own and leaking the extra sessions. A rejected create() is not kept, because the model can arrive later (the
// options-page download) and the next batch should ask again.
const baseSessions = new Map<string, Promise<LanguageModel>>();

function getBaseSession(spec: PromptSpec<CandidateLabel>) {
  let session = baseSessions.get(spec.kind);
  if (session === undefined) {
    session = createBaseSession(spec).catch((error: unknown) => {
      baseSessions.delete(spec.kind);
      throw error;
    });
    baseSessions.set(spec.kind, session);
  }
  return session;
}

// Two runtime guards the types cannot supply: the package declares LanguageModel and its params() unconditionally, but the class is absent outside a context that has the API, and params() is the
// marker of the extension context where temperature and topK actually pin sampling (Chrome 151+, against a manifest floor of 99). Unpinned sampling is not a degraded version of this feature, it is
// the drift that flipped controls in the plain-page runs, so a context without the knobs gets no session at all and the page stays on the rules output.
// create() at availability 'downloadable' silently starts a multi-gigabyte download, so a session is only ever created once the model is already there.
async function createBaseSession(spec: PromptSpec<CandidateLabel>) {
  if (typeof LanguageModel === 'undefined') {
    throw new Error('LanguageModel is not exposed in this context');
  }
  if (typeof LanguageModel.params !== 'function') {
    throw new Error('sampling cannot be pinned in this context');
  }

  const availability = await LanguageModel.availability();
  if (availability !== 'available') {
    throw new Error(`model availability is ${availability}`);
  }

  // Deliberately NO expectedInputs/expectedOutputs language declaration: the API's supported set is en/ja/es/de/fr, declaring any zh variant makes availability() report unavailable and create()
  // reject with NotSupportedError, and declaring en or ja would attest a language the output is not. An undeclared session is the only way to run Chinese, and declaring a supported one buys nothing:
  // measured 2026-09-02 in this context, six configurations over the 23-case set returned identical labels and identical raw bytes, and the "No output language was specified" warning a declaration
  // would silence never reaches a service worker in the first place -- it is logged for extension pages only. See docs/prompt-api-reference.md, Languages.
  const session = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: spec.systemPrompt }],
    temperature: 0,
    topK: 1,
  });
  // The system prompt rides in initialPrompts, so this is the only place it is ever sent; a fresh line here also marks every MV3 cold start paying the multi-second create()
  console.debug(`[pangu] ${spec.kind} base session created (version ${spec.version}, temperature 0, topK 1), system prompt:\n${spec.systemPrompt}`);
  return session;
}

async function classifyOne(spec: PromptSpec<CandidateLabel>, base: LanguageModel, candidate: ClassifyRequest): Promise<ClassifiedCandidate> {
  // Logged before the model call so a candidate that hangs or throws still shows what was asked. Debug level: visible in this worker's console (chrome://extensions -> service worker) at Verbose
  const question = spec.buildQuestion(candidate.sentence, candidate.at);
  console.debug(`[pangu] ${spec.kind} prompt:\n${question}`);
  try {
    // One clone per candidate: a fresh context without paying create() again
    const turn = await base.clone();
    let raw: string;
    try {
      raw = await turn.prompt(question, { responseConstraint: { type: 'string', enum: spec.displayTokenEnum } });
    } finally {
      turn.destroy();
    }

    // The model answers in display tokens; nothing outside the prompt spec ever sees one
    const label = spec.labelForDisplayToken(JSON.parse(raw));
    if (label === null) {
      throw new TypeError(`response outside the constraint enum: ${raw}`);
    }
    console.debug(`[pangu] ${spec.kind} raw answer: ${raw} -> ${label}`);
    return { label, error: null };
  } catch (caught) {
    const error = String(caught);
    console.debug(`[pangu] ${spec.kind} error: ${error}`);
    return { label: null, error };
  }
}

// A single candidate's failure stays that candidate's failure: the batch always answers, so a constraint the model cannot satisfy shows up as one recorded error rather than a lost page. The loop is
// sequential because the on-device model runs inference single-lane, so parallel clones only wait on each other, and because request and response then zip by index.
// A kind with no prompt spec registered here answers like any other batch-wide failure rather than throwing, so the page gets the same clean no as it does for an absent model.
export async function classifyCandidates(kind: string, candidates: readonly ClassifyRequest[]): Promise<ClassifyCandidatesResponse> {
  const spec = PROMPT_SPECS.get(kind);
  if (spec === undefined) {
    return { ok: false, error: `no prompt spec for ${kind}` };
  }

  let base: LanguageModel;
  try {
    base = await getBaseSession(spec);
  } catch (error) {
    return { ok: false, error: String(error) };
  }

  const classified: ClassifiedCandidate[] = [];
  for (const candidate of candidates) {
    classified.push(await classifyOne(spec, base, candidate));
  }
  return { ok: true, candidates: classified };
}
