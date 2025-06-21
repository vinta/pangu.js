export interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  filter_mode: 'blacklist' | 'whitelist';
  blacklist: string[];   // Valid match patterns only
  whitelist: string[];   // Valid match patterns only
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
