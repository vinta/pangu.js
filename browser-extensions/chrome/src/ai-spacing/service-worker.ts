import type { Candidate, CandidateLabel, ClassifyCandidatesResponse } from './messages';
import { classifyCandidates } from './models';
import type { PromptSpec } from './shapes/base';
import { digitPlusPrompt } from './shapes/digit-plus-prompt';
import { hyphenDigitPrompt } from './shapes/hyphen-digit-prompt';

const PROMPT_SPECS = new Map<string, PromptSpec<CandidateLabel>>([
  [hyphenDigitPrompt.kind, hyphenDigitPrompt],
  [digitPlusPrompt.kind, digitPlusPrompt],
]);

export async function handleClassification(kind: string, candidates: readonly Candidate[]): Promise<ClassifyCandidatesResponse> {
  const promptSpec = PROMPT_SPECS.get(kind);

  if (promptSpec === undefined) {
    return { ok: false, error: `no prompt spec for ${kind}` };
  }

  try {
    const candidateLabels = await classifyCandidates(promptSpec, candidates);
    return { ok: true, candidateLabels };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
