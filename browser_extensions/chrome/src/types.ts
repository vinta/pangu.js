export interface ExtensionSettings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  spacing_rule: 'blacklists' | 'whitelists';
  blacklists: string[];
  whitelists: string[];
  is_mute_sound_effects: boolean;
}

export interface MessageRequest {
  purpose?: string;
  text?: string;
  [key: string]: any;
}

export interface MessageResponse {
  isAllowed?: boolean;
  settings?: ExtensionSettings;
  [key: string]: any;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  spacing_mode: 'spacing_when_load',
  spacing_rule: 'blacklists',
  blacklists: [],
  whitelists: [],
  is_mute_sound_effects: false
};