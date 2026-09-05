import type { Candidate, CandidateLabel, ClassifyCandidatesResponse } from './messages';
import { classifyCandidates } from './models';
import type { PromptSpec } from './shapes/base';
import { hyphenPrompt } from './shapes/hyphen-prompt';

const PROMPT_SPECS = new Map<string, PromptSpec<CandidateLabel>>([[hyphenPrompt.kind, hyphenPrompt]]);

export async function handleClassification(kind: string, candidates: readonly Candidate[]): Promise<ClassifyCandidatesResponse> {
  const promptSpec = PROMPT_SPECS.get(kind);

  // An unknown kind answers like any other batch-wide failure, so the page gets the same no as for an absent model
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
