import { ExtensionSettings } from './types';
import { translatePage } from './i18n';
import utils_chrome from './utils-chrome';

class PopupController {
  private spacing_mode: 'spacing_when_load' | 'spacing_when_click' = 'spacing_when_load';
  
  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Translate the page
      translatePage();
      
      // Get cached settings
      const settings = await utils_chrome.getCachedSettings();
      this.spacing_mode = settings.spacing_mode;
      
      // Update UI
      this.updateSpacingModeButton();
      
      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  private setupEventListeners(): void {
    // Spacing mode button
    const spacingModeButton = document.querySelector('.pure-button-primary') as HTMLInputElement;
    if (spacingModeButton) {
      spacingModeButton.addEventListener('click', () => this.changeSpacingMode());
    }
    
    // Call god of spacing button
    const callButton = document.querySelector('.pure-button-purple') as HTMLInputElement;
    if (callButton) {
      callButton.addEventListener('click', () => this.callGodOfSpacing());
    }
    
    // Options link
    const optionsLink = document.querySelector('a[href="#"]') as HTMLAnchorElement;
    if (optionsLink) {
      optionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openOptionsPage();
      });
    }
  }

  private updateSpacingModeButton(): void {
    const button = document.querySelector('.pure-button-primary') as HTMLInputElement;
    if (button) {
      // Update the data-i18n attribute to the new mode
      button.setAttribute('data-i18n', this.spacing_mode);
      
      // Get the translation or use default Chinese text
      const message = chrome.i18n.getMessage(this.spacing_mode);
      if (message) {
        button.value = message;
      } else {
        // Fallback to Chinese defaults
        button.value = this.spacing_mode === 'spacing_when_load' 
          ? '網頁載入後自動幫我加上空格' 
          : '我要自己決定什麼時候要加空格';
      }
    }
  }

  private changeSpacingMode(): void {
    // Toggle spacing mode
    this.spacing_mode = this.spacing_mode === 'spacing_when_load' 
      ? 'spacing_when_click' 
      : 'spacing_when_load';
    
    // Update button text
    this.updateSpacingModeButton();
    
    // Save to storage
    utils_chrome.SYNC_STORAGE.set({ spacing_mode: this.spacing_mode });
  }

  private async callGodOfSpacing(): Promise<void> {
    try {
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.id) {
        alert(chrome.i18n.getMessage('can_not_call_god_of_spacing'));
        return;
      }
      
      // Check if URL is valid for spacing
      if (!this.isValidUrlForSpacing(activeTab.url || '')) {
        alert(chrome.i18n.getMessage('can_not_call_god_of_spacing'));
        return;
      }
      
      // Send message to content script instead of injecting code
      try {
        // First check if content script is already loaded
        let contentScriptLoaded = false;
        try {
          const response = await chrome.tabs.sendMessage(activeTab.id, { 
            action: 'ping' 
          });
          contentScriptLoaded = response?.success === true;
        } catch (e) {
          // Content script not loaded
        }
        
        if (!contentScriptLoaded) {
          // Inject scripts on-demand only when needed
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['vendors/pangu/pangu.umd.js']
          });
          
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['dist/content-script.js']
          });
        }
        
        // Now send the spacing command
        const response = await chrome.tabs.sendMessage(activeTab.id, { 
          action: 'manual_spacing' 
        });
        
        if (!response?.success) {
          throw new Error('Failed to apply spacing');
        }
        
        // Play sound effect if enabled
        const settings = await utils_chrome.getCachedSettings();
        if (!settings.is_mute_sound_effects) {
          this.playRandomSound();
        }
      } catch (error) {
        console.error('Failed to apply spacing:', error);
        alert(chrome.i18n.getMessage('can_not_call_god_of_spacing'));
      }
    } catch (error) {
      console.error('Error in callGodOfSpacing:', error);
      alert(chrome.i18n.getMessage('can_not_call_god_of_spacing'));
    }
  }
  
  private playRandomSound(): void {
    const sounds = [
      'sounds/AustinPowers-YeahBaby.mp3',
      'sounds/StreetFighter-Hadouken.mp3', 
      'sounds/StreetFighter-Shouryuuken.mp3',
      'sounds/WahWahWaaah.mp3'
    ];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = new Audio(chrome.runtime.getURL(randomSound));
    audio.play().catch(e => console.log('Sound play failed:', e));
  }

  private isValidUrlForSpacing(url: string): boolean {
    return /^(http(s?)|file)/i.test(url);
  }

  private openOptionsPage(): void {
    chrome.tabs.create({ url: 'pages/options.html' });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});