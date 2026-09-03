import type { HyphenLabel } from './hyphen-prompt';

// One flagged symbol. `at` is its index inside `sentence` rather than a slice of its own, because the symbol's own characters do not identify which one is meant when a sentence carries a second one.
export interface Candidate {
  sentence: string;
  at: number;
}

// One message per ambiguous shape per batch. `kind` is what tells the worker which prompt spec to ask with, and it is the only thing that joins the page-side half of an ambiguous shape to its
// worker-side half
export interface ClassifyCandidatesMessage {
  type: 'CLASSIFY_CANDIDATES';
  kind: string;
  candidates: Candidate[];
}

// Messages sent TO the service worker (via chrome.runtime.sendMessage)
export type MessageToServiceWorker = ClassifyCandidatesMessage;

// Every label any registered ambiguous shape can answer with, one member per registered shape today
export type CandidateLabel = HyphenLabel;

// Labels zip against the request array by index, which the classifier's sequential loop preserves
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

// A single candidate's failure is reported per candidate; only a failure that costs the whole batch, such as an absent model, answers ok: false
export type ClassifyCandidatesResponse = ClassifyCandidatesSucceeded | ClassifyCandidatesFailed;
