import type { PromptSpec } from './ambiguous-shape';
import { hyphenPrompt } from './hyphen-prompt';
import type { Candidate, CandidateLabel, ClassifiedCandidate, ClassifyCandidatesResponse } from './messages';

const PROMPT_SPECS = new Map<string, PromptSpec<CandidateLabel>>([[hyphenPrompt.kind, hyphenPrompt]]);

// One base session per ambiguous shape
const baseSessions = new Map<string, Promise<LanguageModel>>();

// We cache the promise, not the session, so batches arriving while create() is in flight share it.
// A rejected create() is dropped, because the model can arrive later (the options-page download)
function getBaseSession(promptSpec: PromptSpec<CandidateLabel>) {
  let session = baseSessions.get(promptSpec.kind);
  if (session === undefined) {
    session = createBaseSession(promptSpec).catch((error: unknown) => {
      baseSessions.delete(promptSpec.kind);
      throw error;
    });
    baseSessions.set(promptSpec.kind, session);
  }
  return session;
}

// create() at availability 'downloadable' silently starts a multi-gigabyte download, so we only create a session once the model is already there
async function createBaseSession(promptSpec: PromptSpec<CandidateLabel>) {
  if (typeof LanguageModel === 'undefined') {
    throw new Error('LanguageModel is not exposed in this context');
  }

  // NOTE: no params() means we cannot control (temperature, topK) which means the model output could be unpredictable, and we disable AI spacing
  if (typeof LanguageModel.params !== 'function') {
    throw new Error('sampling cannot be pinned in this context');
  }

  const availability = await LanguageModel.availability();
  if (availability !== 'available') {
    throw new Error(`model availability is ${availability}`);
  }

  // Deliberately NO expectedInputs/expectedOutputs here: the API supports en/ja/es/de/fr only, declaring zh makes availability() report unavailable and create() reject
  const session = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: promptSpec.systemPrompt }],
    // TODO: These two sampling parameters are deprecated, migrate when needed
    // https://developer.chrome.com/docs/ai/prompt-api#sampling_parameters
    // https://github.com/webmachinelearning/prompt-api#configuration-of-sampling-modes
    temperature: 0,
    topK: 1,
  });

  console.debug(`[pangu] ${promptSpec.kind} base session created (version ${promptSpec.version}, temperature 0, topK 1), system prompt:\n${promptSpec.systemPrompt}`);
  return session;
}

async function classifyOne(promptSpec: PromptSpec<CandidateLabel>, base: LanguageModel, candidate: Candidate): Promise<ClassifiedCandidate> {
  const question = promptSpec.buildQuestion(candidate.sentence, candidate.at);
  console.debug(`[pangu] ${promptSpec.kind} prompt:\n${question}`);

  try {
    // One clone per candidate: a fresh context without create() which is slow
    const turn = await base.clone();
    let raw: string;
    try {
      raw = await turn.prompt(question, { responseConstraint: { type: 'string', enum: promptSpec.displayTokenEnum } });
    } finally {
      turn.destroy();
    }

    const label = promptSpec.labelForDisplayToken(JSON.parse(raw));
    if (label === null) {
      throw new TypeError(`response outside the constraint enum: ${raw}`);
    }
    console.debug(`[pangu] ${promptSpec.kind} raw answer: ${raw} -> ${label}`);
    return { label, error: null };
  } catch (caught) {
    const error = String(caught);
    console.debug(`[pangu] ${promptSpec.kind} error: ${error}`);
    return { label: null, error };
  }
}

// A single candidate's failure stays that candidate's failure, so the batch always answers
// The loop is sequential because the on-device model runs inference single-lane, and because labels zip against candidates by index
// An unknown kind answers like any other batch-wide failure, so the page gets the same no as for an absent model
export async function classifyCandidates(kind: string, candidates: readonly Candidate[]): Promise<ClassifyCandidatesResponse> {
  const promptSpec = PROMPT_SPECS.get(kind);
  if (promptSpec === undefined) {
    return { ok: false, error: `no prompt spec for ${kind}` };
  }

  let base: LanguageModel;
  try {
    base = await getBaseSession(promptSpec);
  } catch (error) {
    return { ok: false, error: String(error) };
  }

  const classifiedCandidates: ClassifiedCandidate[] = [];
  for (const candidate of candidates) {
    classifiedCandidates.push(await classifyOne(promptSpec, base, candidate));
  }
  return { ok: true, candidates: classifiedCandidates };
}
