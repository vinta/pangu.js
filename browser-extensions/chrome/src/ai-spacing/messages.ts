import type { HyphenLabel } from './hyphen-prompt';

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

// Messages sent TO the service worker (via chrome.runtime.sendMessage)
export type MessageToServiceWorker = ClassifyCandidatesMessage;

// One member per registered ambiguous shape
export type CandidateLabel = HyphenLabel;

// Labels zip against the request array by index. null skips one candidate; ok: false disables AI spacing for the page
export type ClassifyCandidatesResponse = { ok: true; candidates: (CandidateLabel | null)[] } | { ok: false; error: string };
