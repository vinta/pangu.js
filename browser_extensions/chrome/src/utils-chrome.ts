/*
 * Extension Manager - handles settings, storage, and utilities
 * for the pangu.js Chrome Extension (Manifest V3)
 */

import { ExtensionSettings } from './types';

type SoundName = 'Hadouken' | 'Shouryuuken' | 'YeahBaby' | 'WahWahWaaah';

export class ExtensionManager {
  private settingsCache: ExtensionSettings = {} as ExtensionSettings;
  private cacheInitialized: boolean = false;
  
  // Sound file mappings
  private readonly sounds: Record<SoundName, string> = {
    'Hadouken': 'sounds/StreetFighter-Hadouken.mp3',
    'Shouryuuken': 'sounds/StreetFighter-Shouryuuken.mp3',
    'YeahBaby': 'sounds/AustinPowers-YeahBaby.mp3',
    'WahWahWaaah': 'sounds/ManciniPinkPanther-WahWahWaaah.mp3'
  };
  
  // Direct access to chrome.storage.sync
  public readonly SYNC_STORAGE = chrome.storage.sync;
  
  constructor() {
    // Listen for storage changes to update cache
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        for (const key in changes) {
          (this.settingsCache as any)[key] = changes[key].newValue;
        }
      }
    });
  }
  
  // Initialize settings cache
  private async initializeCache(): Promise<ExtensionSettings> {
    if (!this.cacheInitialized) {
      const response = await chrome.runtime.sendMessage({ action: 'get_settings' });
      if (response && response.settings) {
        this.settingsCache = response.settings;
        this.cacheInitialized = true;
      }
    }
    return this.settingsCache;
  }
  
  // Get cached settings
  async getCachedSettings(): Promise<ExtensionSettings> {
    return await this.initializeCache();
  }
  
  // Get a specific setting
  async getSetting(key: keyof ExtensionSettings): Promise<any> {
    const settings = await this.initializeCache();
    return settings[key];
  }
  
  // Get i18n message
  get_i18n(message_name: string): string {
    return chrome.i18n.getMessage(message_name);
  }
  
  // Debug helper to print sync storage
  print_sync_storage(): void {
    chrome.storage.sync.get(null, (items) => {
      console.log('SYNC_STORAGE: %O', items);
    });
  }
  
  // Toggle auto spacing mode
  async toggleAutoSpacing(isEnabled: boolean): Promise<void> {
    // Update spacing mode
    const spacing_mode = isEnabled ? 'spacing_when_load' : 'spacing_when_click';
    await this.SYNC_STORAGE.set({ spacing_mode });
  }
  
  // Play sound effects
  async playSound(name: SoundName): Promise<void> {
    const settings = await this.getCachedSettings();
    if (!settings.is_mute_sound_effects) {
      const audio = new Audio(chrome.runtime.getURL(this.sounds[name]));
      audio.play().catch(e => console.log('Sound play failed:', e));
    }
  }
}

// Create singleton instance
const extensionManager = new ExtensionManager();

export default extensionManager;