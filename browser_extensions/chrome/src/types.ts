export interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  spacing_rule: 'blacklists' | 'whitelists';
  blacklists: string[];
  whitelists: string[];
  is_mute_sound_effects: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  spacing_mode: 'spacing_when_load',
  spacing_rule: 'blacklists',
  blacklists: [ // TODO: support regex
    '//docs.google.com',
    '//gist.github.com',
    '/blob/',
    '/commit/',
    '/pull/'
  ],
  whitelists: [],
  is_mute_sound_effects: false
};

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
