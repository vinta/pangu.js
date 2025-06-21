import { ExtensionSettings } from './types';

declare global {
  interface Window {
    utils_chrome: {
      getCachedSettings(): Promise<ExtensionSettings>;
      SYNC_STORAGE: chrome.storage.SyncStorageArea;
      get_i18n(message_name: string): string;
    };
  }
}

class PopupController {
  private spacing_mode: 'spacing_when_load' | 'spacing_when_click' = 'spacing_when_load';
  
  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Set initial text content
    document.getElementById('god_of_spacing')!.textContent = window.utils_chrome.get_i18n('god_of_spacing');
    
    // Get cached settings
    const settings = await window.utils_chrome.getCachedSettings();
    this.spacing_mode = settings.spacing_mode;
    
    // Update UI
    this.updateSpacingModeButton();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set other UI text
    const callButton = document.querySelector('.pure-button-purple') as HTMLInputElement;
    callButton.value = window.utils_chrome.get_i18n('call_god_of_spacing');
    
    // Set footer text
    const rateLink = document.querySelector('a[target="_blank"]') as HTMLAnchorElement;
    rateLink.textContent = window.utils_chrome.get_i18n('extension_rate');
    
    const optionsLink = document.querySelector('a[href="#"]') as HTMLAnchorElement;
    optionsLink.textContent = window.utils_chrome.get_i18n('extension_options');
  }

  private setupEventListeners(): void {
    // Spacing mode button
    const spacingModeButton = document.querySelector('.pure-button-primary') as HTMLInputElement;
    spacingModeButton.addEventListener('click', () => this.changeSpacingMode());
    
    // Call god of spacing button
    const callButton = document.querySelector('.pure-button-purple') as HTMLInputElement;
    callButton.addEventListener('click', () => this.callGodOfSpacing());
    
    // Options link
    const optionsLink = document.querySelector('a[href="#"]') as HTMLAnchorElement;
    optionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.openOptionsPage();
    });
  }

  private updateSpacingModeButton(): void {
    const button = document.querySelector('.pure-button-primary') as HTMLInputElement;
    button.value = window.utils_chrome.get_i18n(this.spacing_mode);
  }

  private changeSpacingMode(): void {
    // Toggle spacing mode
    this.spacing_mode = this.spacing_mode === 'spacing_when_load' 
      ? 'spacing_when_click' 
      : 'spacing_when_load';
    
    // Update button text
    this.updateSpacingModeButton();
    
    // Save to storage
    window.utils_chrome.SYNC_STORAGE.set({ spacing_mode: this.spacing_mode });
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
            alert(window.utils_chrome.get_i18n('can_not_call_god_of_spacing'));
          }
        }
      } else {
        if (i === 0) {
          alert(window.utils_chrome.get_i18n('can_not_call_god_of_spacing'));
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