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

// Zips against the request array by index
export interface ClassifiedCandidate {
  label: CandidateLabel | null;
  error: string | null;
}

export interface ClassifyCandidatesSucceeded {
  ok: true;
  candidates: ClassifiedCandidate[];
}

export interface ClassifyCandidatesFailed {
  ok: false;
  error: string;
}

// A single candidate's failure is reported per candidate. ok: false is for a failure that costs the whole batch, e.g. an absent model
export type ClassifyCandidatesResponse = ClassifyCandidatesSucceeded | ClassifyCandidatesFailed;
