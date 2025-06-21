import type { Settings } from './types';

type SoundName = 'Hadouken' | 'Shouryuuken' | 'YeahBaby' | 'WahWahWaaah';

export const DEFAULT_SETTINGS: Settings = {
  spacing_mode: 'spacing_when_load',
  filter_mode: 'blacklist',
  blacklist: [
    // Default blacklist with valid match patterns
    '*://docs.google.com/*',
    '*://gist.github.com/*',
    '*://github.com/*/blob/*',
    '*://github.com/*/commit/*',
    '*://github.com/*/pull/*',
  ],
  whitelist: [],
  is_mute_sound_effects: false,
};

export class Utils {
  private cachedSettings: Settings = { ...DEFAULT_SETTINGS };
  private cacheInitialized: boolean = false;

  // Sound file mappings
  private readonly sounds: Record<SoundName, string> = {
    Hadouken: 'sounds/StreetFighter-Hadouken.mp3',
    Shouryuuken: 'sounds/StreetFighter-Shouryuuken.mp3',
    YeahBaby: 'sounds/AustinPowers-YeahBaby.mp3',
    WahWahWaaah: 'sounds/ManciniPinkPanther-WahWahWaaah.mp3',
  };

  constructor() {
    // Listen for storage changes to update cache
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && this.cacheInitialized) {
        // Only update cache after it's been initialized
        for (const [key, change] of Object.entries(changes)) {
          if (key in this.cachedSettings) {
            // Create a new object to satisfy TypeScript's type checking
            this.cachedSettings = {
              ...this.cachedSettings,
              [key]: change.newValue,
            };
          }
        }
      }
    });
  }

  // Get cached settings
  async getCachedSettings(): Promise<Settings> {
    if (!this.cacheInitialized) {
      // Read directly from chrome.storage.sync with defaults
      this.cachedSettings = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
      this.cacheInitialized = true;
    }
    return this.cachedSettings;
  }

  // Toggle auto spacing mode
  async toggleAutoSpacing(isEnabled: boolean): Promise<void> {
    // Update spacing mode
    const spacing_mode = isEnabled ? 'spacing_when_load' : 'spacing_when_click';
    await chrome.storage.sync.set({ spacing_mode });
  }

  // Play sound effects
  async playSound(name: SoundName): Promise<void> {
    const settings = await this.getCachedSettings();
    if (!settings.is_mute_sound_effects) {
      const audio = new Audio(chrome.runtime.getURL(this.sounds[name]));
      audio.play().catch((e) => console.log('Sound play failed:', e));
    }
  }
}

// Create singleton instance
const utils = new Utils();

export default utils;
