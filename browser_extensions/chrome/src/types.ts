export interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  spacing_rule: 'blacklists' | 'whitelists' | 'blacklist' | 'whitelist';
  blacklists: string[];  // Deprecated: use blacklist
  whitelists: string[];  // Deprecated: use whitelist
  blacklist: string[];   // New: valid match patterns only
  whitelist: string[];   // New: valid match patterns only
  is_mute_sound_effects: boolean;
}

export interface MessageRequest {
  purpose?: string;
  text?: string;
  [key: string]: any;
}

export interface MessageResponse {
  isAllowed?: boolean;
  settings?: Settings;
  [key: string]: any;
}
