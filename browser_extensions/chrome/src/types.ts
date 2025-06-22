export interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  filter_mode: 'blacklist' | 'whitelist';
  blacklist: string[];
  whitelist: string[];
  is_mute_sound_effects: boolean;
}

// Messages sent to content script
export interface PingMessage {
  action: 'ping';
}

export interface ManualSpacingMessage {
  action: 'manual_spacing';
}

export type ContentScriptMessage = PingMessage | ManualSpacingMessage;

// Response from content script
export interface ContentScriptResponse {
  success: boolean;
}
