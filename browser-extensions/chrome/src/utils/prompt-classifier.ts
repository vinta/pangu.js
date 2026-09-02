// AI spacing's classifier: Chrome's built-in Prompt API classifies how one flagged hyphen-minus reads, and rules elsewhere decide the spacing. The model only ever picks a label from an enum, it
// never emits text (ADR 0009).
//
// This lives in the service worker rather than the content script for one reason: `temperature` and `topK` are documented as the extension-context surface and a content script appears to get the
// plain-web surface instead, where sampling cannot be pinned at all. See docs/prompt-api-reference.md.
import { buildQuestion, DISPLAY_TOKEN_ENUM, labelForDisplayToken, PROMPT_VARIANT, SYSTEM_PROMPT } from './hyphen-prompt';
import type { ClassifiedSpan, ClassifySpanRequest, ClassifySpansResponse } from './types';

// One base session holding only the system prompt: cloning it per span saves re-parsing the system instructions, and create() costs roughly five prompts. The session is in-memory, so MV3 idle
// termination simply means the next call recreates it. What is cached is the promise, not the session: batches from several tabs that arrive while the first create() is still in flight share
// that one create() instead of each paying for its own and leaking the extra sessions. A rejected create() is not kept, because the model can arrive later (the options-page download) and the
// next batch should ask again.
let baseSession: Promise<LanguageModel> | null = null;

function getBaseSession() {
  baseSession ??= createBaseSession().catch((error: unknown) => {
    baseSession = null;
    throw error;
  });
  return baseSession;
}

// Two runtime guards the types cannot supply: the package declares LanguageModel and its params() unconditionally, but the class is absent outside a context that has the API, and params() is the
// marker of the extension context where temperature and topK actually pin sampling (Chrome 151+, against a manifest floor of 99). Unpinned sampling is not a degraded version of this feature, it is
// the drift that flipped controls in the plain-page runs, so a context without the knobs gets no session at all and the page stays on the rules output.
// create() at availability 'downloadable' silently starts a multi-gigabyte download, so a session is only ever created once the model is already there.
async function createBaseSession() {
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
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
    temperature: 0,
    topK: 1,
  });
  // The system prompt rides in initialPrompts, so this is the only place it is ever sent; a fresh line here also marks every MV3 cold start paying the multi-second create()
  console.debug(`[pangu] hyphen-sign base session created (variant ${PROMPT_VARIANT}, temperature 0, topK 1), system prompt:\n${SYSTEM_PROMPT}`);
  return session;
}

async function classifyOne(base: LanguageModel, span: ClassifySpanRequest): Promise<ClassifiedSpan> {
  // Logged before the model call so a span that hangs or throws still shows what was asked. Debug level: visible in this worker's console (chrome://extensions -> service worker) at Verbose
  const question = buildQuestion(span.sentence, span.at);
  console.debug(`[pangu] hyphen-sign prompt:\n${question}`);
  try {
    // One clone per span: a fresh context without paying create() again
    const turn = await base.clone();
    let raw: string;
    try {
      raw = await turn.prompt(question, { responseConstraint: { type: 'string', enum: DISPLAY_TOKEN_ENUM } });
    } finally {
      turn.destroy();
    }

    // The model answers in display tokens; nothing outside this module ever sees one
    const answer = labelForDisplayToken(JSON.parse(raw));
    if (answer === null) {
      throw new TypeError(`response outside the constraint enum: ${raw}`);
    }
    console.debug(`[pangu] hyphen-sign raw answer: ${raw} -> ${answer}`);
    return { answer, error: null };
  } catch (caught) {
    const error = String(caught);
    console.debug(`[pangu] hyphen-sign error: ${error}`);
    return { answer: null, error };
  }
}

// A single span's failure stays that span's failure: the batch always answers, so a constraint the model cannot satisfy shows up as one recorded error rather than a lost page. The loop is sequential
// because the on-device model runs inference single-lane, so parallel clones only wait on each other, and because request and response then zip by index.
export async function classifySpans(spans: readonly ClassifySpanRequest[]): Promise<ClassifySpansResponse> {
  let base: LanguageModel;
  try {
    base = await getBaseSession();
  } catch (error) {
    return { ok: false, error: String(error) };
  }

  const classified: ClassifiedSpan[] = [];
  for (const span of spans) {
    classified.push(await classifyOne(base, span));
  }
  return { ok: true, spans: classified };
}
