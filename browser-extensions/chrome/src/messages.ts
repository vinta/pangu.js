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
