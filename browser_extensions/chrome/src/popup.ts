import { ExtensionSettings } from './types';
import { translatePage } from './i18n';
import utils_chrome from './utils_chrome';

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
    // Get all active tabs
    const tabs = await chrome.tabs.query({ active: true });
    
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      
      // Check if URL is valid for spacing
      if (this.isValidUrlForSpacing(tab.url || '')) {
        try {
          // Execute spacing on the tab
          await chrome.scripting.executeScript({
            target: { tabId: tab.id!, allFrames: true },
            func: () => {
              // @ts-ignore - pangu is loaded from extension
              if (typeof pangu !== 'undefined' && pangu.spacingPage) {
                // @ts-ignore
                pangu.spacingPage();
              }
            }
          });
        } catch (error) {
          console.error('Failed to execute script:', error);
          if (i === 0) {
            alert(chrome.i18n.getMessage('can_not_call_god_of_spacing'));
          }
        }
      } else {
        if (i === 0) {
          alert(chrome.i18n.getMessage('can_not_call_god_of_spacing'));
        }
      }
    }
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