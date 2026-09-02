import type { HyphenLabel } from './hyphen-prompt';

export interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  filter_mode: 'blacklist' | 'whitelist';
  blacklist: string[];
  whitelist: string[];
  is_mute_sound_effects: boolean;
  is_enable_text_autospace: boolean;
}

export interface PingMessage {
  action: 'PING';
}

export interface ManualSpacingMessage {
  action: 'MANUAL_SPACING';
}

// Messages sent TO content script (via chrome.tabs.sendMessage)
export type MessageToContentScript = PingMessage | ManualSpacingMessage;

// We only need a response when sender actually needs it, e.g.,
// popup needs to know if content script is loaded or not,
// or if manual spacing is successful or not
export interface ContentScriptResponse {
  success: boolean;
}

export interface ContentScriptLoadedMessage {
  type: 'CONTENT_SCRIPT_LOADED';
}

// Messages sent FROM content script to extension (via chrome.runtime.sendMessage)
export type MessageFromContentScript = ContentScriptLoadedMessage;

// One flagged hyphen-minus. `at` is its index inside `sentence` rather than the span text, because span text does not identify which symbol is meant when a sentence carries a second hyphen.
export interface ClassifySpanRequest {
  sentence: string;
  at: number;
}

export interface ClassifySpansMessage {
  type: 'CLASSIFY_SPANS';
  spans: ClassifySpanRequest[];
}

// Messages sent TO the service worker (via chrome.runtime.sendMessage)
export type MessageToServiceWorker = ClassifySpansMessage;

// Answers zip against the request array by index, which the classifier's sequential loop preserves
export interface ClassifiedSpan {
  answer: HyphenLabel | null;
  error: string | null;
}

export interface ClassifySpansSucceeded {
  ok: true;
  spans: ClassifiedSpan[];
}

export interface ClassifySpansFailed {
  ok: false;
  error: string;
}

// A single span's failure is reported per span; only a failure that costs the whole batch, such as an absent model, answers ok: false
export type ClassifySpansResponse = ClassifySpansSucceeded | ClassifySpansFailed;
