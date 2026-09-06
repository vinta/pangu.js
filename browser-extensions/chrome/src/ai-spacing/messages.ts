import type { BrandSuffixLabel } from './shapes/brand-suffix';
import type { HyphenLabel } from './shapes/hyphen-prompt';

// One flagged symbol. `at` is its index inside `sentence`, since a sentence can carry the same symbol twice
export interface Candidate {
  sentence: string;
  at: number;
}

// One message per ambiguous shape per batch. `kind` picks the prompt spec on the worker side
export interface ClassifyCandidatesMessage {
  type: 'CLASSIFY_CANDIDATES';
  kind: string;
  candidates: Candidate[];
}

export type MessageToServiceWorker = ClassifyCandidatesMessage;

export type CandidateLabel = HyphenLabel | BrandSuffixLabel;

// Labels zip against the request array by index. null skips one candidate; ok: false disables AI spacing for the page
export type ClassifyCandidatesResponse = { ok: true; candidateLabels: (CandidateLabel | null)[] } | { ok: false; error: string };
