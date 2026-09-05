import type { Candidate, CandidateLabel } from './messages';
import type { PromptSpec } from './shapes/base';

// One base session per ambiguous shape
const baseSessions = new Map<string, Promise<LanguageModel>>();

// `unsupported` is ours, not an API value: the browser has no Prompt API at all
export type AiModelAvailability = Availability | 'unsupported';

// We set expectedOutputs here, only to silence the "No output language was specified" warning, which is logged for extension pages only
// 2026-09-02: using en here because zh is not supported yet
// 2026-09-02: we measured that declaring a supported language does not alter the model output
const PAGE_MODEL_LANGUAGES: LanguageModelExpected[] = [{ type: 'text', languages: ['en'] }];

export async function getModelAvailability(): Promise<AiModelAvailability> {
  // The types declare LanguageModel unconditionally, but a browser without the Prompt API has no such global
  if (typeof LanguageModel === 'undefined') {
    return 'unsupported';
  }
  return LanguageModel.availability({ expectedOutputs: PAGE_MODEL_LANGUAGES });
}

export async function canModelRun() {
  const availability = await getModelAvailability();
  return availability !== 'unsupported' && availability !== 'unavailable';
}

export async function downloadModel() {
  // The download is browser-wide and outlives this page, so the session only exists to start it
  const session = await LanguageModel.create({ expectedOutputs: PAGE_MODEL_LANGUAGES });
  session.destroy();
}

function getBaseSession(promptSpec: PromptSpec<CandidateLabel>) {
  let session = baseSessions.get(promptSpec.kind);
  if (session === undefined) {
    // We cache the promise, not the session, so batches arriving while create() is in flight share it
    // A rejected create() is dropped, because the model can arrive later (the options-page download)
    session = createBaseSession(promptSpec).catch((error: unknown) => {
      baseSessions.delete(promptSpec.kind);
      throw error;
    });
    baseSessions.set(promptSpec.kind, session);
  }
  return session;
}

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

  // create() at availability 'downloadable' silently starts a multi-gigabyte download, so we only create a session once the model is already there
  const baseSession = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: promptSpec.systemPrompt }],
    // TODO: These two sampling parameters are deprecated, migrate when needed
    // https://developer.chrome.com/docs/ai/prompt-api#sampling_parameters
    // https://github.com/webmachinelearning/prompt-api#configuration-of-sampling-modes
    temperature: 0,
    topK: 1,
  });

  console.debug(`[pangu] ${promptSpec.kind} base session created (version ${promptSpec.version}, temperature 0, topK 1), system prompt:\n${promptSpec.systemPrompt}`);
  return baseSession;
}

async function classifyOneCandidate(promptSpec: PromptSpec<CandidateLabel>, baseSession: LanguageModel, candidate: Candidate): Promise<CandidateLabel | null> {
  const question = promptSpec.buildQuestion(candidate.sentence, candidate.at);
  console.debug(`[pangu] ${promptSpec.kind} prompt:\n${question}`);

  try {
    // One clone per candidate: a fresh context without create() which is slow
    const session = await baseSession.clone();
    let raw: string;
    try {
      raw = await session.prompt(question, { responseConstraint: { type: 'string', enum: promptSpec.candidateLabels } });
    } finally {
      session.destroy();
    }

    const answer: unknown = JSON.parse(raw);
    const candidateLabel = promptSpec.candidateLabels.find((candidateLabel) => candidateLabel === answer);
    if (candidateLabel === undefined) {
      throw new TypeError(`response outside the constraint enum: ${raw}`);
    }
    console.debug(`[pangu] ${promptSpec.kind} raw answer: ${raw} -> ${candidateLabel}`);
    return candidateLabel;
  } catch (error) {
    console.debug(`[pangu] ${promptSpec.kind} error: ${String(error)}`);
    return null;
  }
}

// A single candidate's failure stays that candidate's failure, so the batch always answers
export async function classifyCandidates(promptSpec: PromptSpec<CandidateLabel>, candidates: readonly Candidate[]): Promise<(CandidateLabel | null)[]> {
  const baseSession = await getBaseSession(promptSpec);

  // NOTE: Only one model instance in the browser and it runs one task at a time, so sending prompts in parallel won't make them faster
  // See https://source.chromium.org/chromium/chromium/src/+/main:services/on_device_model/on_device_model_mojom_impl.cc (RunTaskIfPossible)
  const candidateLabels: (CandidateLabel | null)[] = [];
  for (const candidate of candidates) {
    candidateLabels.push(await classifyOneCandidate(promptSpec, baseSession, candidate));
  }
  return candidateLabels;
}
