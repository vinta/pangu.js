import type { PromptSpec } from './ambiguous-shape';
import { hyphenPrompt } from './hyphen-prompt';
import type { Candidate, CandidateLabel, ClassifyCandidatesResponse } from './messages';
import { classifyWithModel } from './model';

const PROMPT_SPECS = new Map<string, PromptSpec<CandidateLabel>>([[hyphenPrompt.kind, hyphenPrompt]]);

// An unknown kind answers like any other batch-wide failure, so the page gets the same no as for an absent model
export async function classifyCandidates(kind: string, candidates: readonly Candidate[]): Promise<ClassifyCandidatesResponse> {
  const promptSpec = PROMPT_SPECS.get(kind);
  if (promptSpec === undefined) {
    return { ok: false, error: `no prompt spec for ${kind}` };
  }

  try {
    const candidateLabels = await classifyWithModel(promptSpec, candidates);
    return { ok: true, candidateLabels };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
