// The hyphen-sign model layer: Chrome's built-in Prompt API classifies how one flagged hyphen-minus reads, and rules elsewhere decide the spacing. The model only ever picks a label from an enum, it
// never emits text (ADR 0009).
//
// This lives in the service worker rather than the content script for one reason: `temperature` and `topK` are documented as the extension-context surface and a content script appears to get the
// plain-web surface instead, where sampling cannot be pinned at all. See docs/prompt-api-reference.md.
import { buildQuestion, DISPLAY_TOKEN_ENUM, labelForDisplayToken, SYSTEM_PROMPT } from './hyphen-prompt';
import type { ClassifiedSpan, ClassifySpanRequest, ClassifySpansResponse } from './types';

// One base session holding only the system prompt: cloning it per span saves re-parsing the system instructions, and create() costs roughly five prompts. The session is in-memory, so MV3 idle
// termination simply means the next call recreates it.
let baseSession: LanguageModel | null = null;

function describeError(error: unknown) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

// Two runtime guards the types cannot supply: the package declares LanguageModel and its params() unconditionally, but the class is absent outside a context that has the API, and params() is the
// marker of the extension context where temperature and topK actually pin sampling (Chrome 151+, against a manifest floor of 99). Unpinned sampling is not a degraded version of this feature, it is
// the drift that flipped controls in the plain-page runs, so a context without the knobs gets no session at all and the page stays on the rules output.
// create() at availability 'downloadable' silently starts a multi-gigabyte download, so a session is only ever created once the model is already there.
async function getBaseSession() {
  if (baseSession) {
    return baseSession;
  }

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

  baseSession = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
    temperature: 0,
    topK: 1,
  });
  return baseSession;
}

async function classifyOne(base: LanguageModel, span: ClassifySpanRequest): Promise<ClassifiedSpan> {
  try {
    const question = buildQuestion(span.sentence, span.at);
    // One clone per span: a fresh context without paying create() again
    const turn = await base.clone();
    let raw: string;
    try {
      raw = await turn.prompt(question, { responseConstraint: { type: 'string', enum: DISPLAY_TOKEN_ENUM } });
    } finally {
      turn.destroy();
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'string') {
      throw new TypeError(`response was not a string: ${raw}`);
    }
    // The model answers in display tokens; nothing outside this module ever sees one
    const answer = labelForDisplayToken(parsed);
    if (answer === null) {
      throw new TypeError(`response outside the constraint enum: ${parsed}`);
    }
    return { answer, error: null };
  } catch (caught) {
    return { answer: null, error: describeError(caught) };
  }
}

// A single span's failure stays that span's failure: the batch always answers, so a constraint the model cannot satisfy shows up as one recorded error rather than a lost page. The loop is sequential
// because the on-device model runs inference single-lane, so parallel clones only wait on each other, and because request and response then zip by index.
export async function classifySpans(spans: readonly ClassifySpanRequest[]): Promise<ClassifySpansResponse> {
  let base: LanguageModel;
  try {
    base = await getBaseSession();
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }

  const classified: ClassifiedSpan[] = [];
  for (const span of spans) {
    classified.push(await classifyOne(base, span));
  }
  return { ok: true, spans: classified };
}
