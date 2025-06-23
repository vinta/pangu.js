import { translatePage } from './utils/i18n';
import type { PingMessage, ManualSpacingMessage, ContentScriptResponse, MessageFromContentScript } from './utils/types';
import { getCachedSettings } from './utils/settings';
import { playSound } from './utils/sounds';

class PopupController {
  private currentTabId: number | undefined;
  private currentTabUrl: string | undefined;
  private messageTimeoutId: number | undefined;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTabId = activeTab?.id;
    this.currentTabUrl = activeTab?.url;

    translatePage();
    await this.render();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.addEventListener('change', () => {
        this.handleSpacingModeToggleChange();
      });
    }

    const manualSpacingBtn = document.getElementById('manual-spacing-btn');
    if (manualSpacingBtn) {
      manualSpacingBtn.addEventListener('click', () => {
        this.handleManualSpacing();
      });
    }

    chrome.runtime.onMessage.addListener((message: MessageFromContentScript, sender) => {
      if (message.type === 'CONTENT_SCRIPT_LOADED' && sender.tab?.id === this.currentTabId) {
        this.renderStatus();
      }
    });
  }

  private async render() {
    await this.renderToggle();
    await this.renderStatus();
    this.renderVersion();
  }

  private async renderToggle() {
    const settings = await getCachedSettings();
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.checked = settings.spacing_mode === 'spacing_when_load';
    }
  }

  private async renderStatus() {
    const statusToggle = document.getElementById('status-indicator') as HTMLLabelElement;
    if (!statusToggle) {
      return;
    }
    
    const statusInput = document.getElementById('status-toggle-input') as HTMLInputElement;
    const statusLabel = document.getElementById('status-toggle-label');
    
    if (!statusInput || !statusLabel) {
      return;
    }

    const shouldBeActive = await this.shouldContentScriptBeActive();
    
    // Update the toggle state
    statusInput.checked = shouldBeActive;
    
    // Update the label text
    const messageKey = shouldBeActive ? 'status_active' : 'status_inactive';
    statusLabel.setAttribute('data-i18n', messageKey);
    statusLabel.textContent = chrome.i18n.getMessage(messageKey);
  }

  private renderVersion() {
    const versionElement = document.getElementById('version');
    if (versionElement) {
      versionElement.textContent = chrome.runtime.getManifest().version;
    }
  }

  private async handleSpacingModeToggleChange() {
    const toggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;

    const spacingMode = toggle.checked ? 'spacing_when_load' : 'spacing_when_click';
    await chrome.storage.sync.set({ spacing_mode: spacingMode });

    this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
    await playSound(spacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken');
  }

  private async handleManualSpacing() {
    const button = document.getElementById('manual-spacing-btn') as HTMLButtonElement;
    if (!button) {
      return;
    }

    // Disable button to prevent multiple clicks
    button.disabled = true;

    if (!this.currentTabId || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      await this.showErrorMessage(() => {
        button.disabled = false;
      });
      return;
    }

    try {
      button.textContent = chrome.i18n.getMessage('spacing_processing');

      const isContentScriptLoaded = await this.isContentScriptLoaded();
      if (!isContentScriptLoaded) {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ['vendors/pangu/pangu.umd.js', 'dist/content-script.js'],
        });
      }

      // Apply spacing
      const message: ManualSpacingMessage = { action: 'MANUAL_SPACING' };
      const response = await chrome.tabs.sendMessage<ManualSpacingMessage, ContentScriptResponse>(this.currentTabId, message);

      if (response && response.success) {
        await this.showSuccessMessage(() => {
          button.disabled = false;
        });
      } else {
        await this.showErrorMessage(() => {
          button.disabled = false;
        });
      }
    } catch (error) {
      console.error('Manual spacing error:', error);
      await this.showErrorMessage(() => {
        button.disabled = false;
      });
    } finally {
      button.textContent = chrome.i18n.getMessage('manual_spacing');
    }
  }

  private isValidUrl(url: string) {
    // valid urls, e.g., http://, https://, file://
    // invalid urls, e.g., chrome://extensions/, chrome://flags/, ftp://
    return /^(http(s?)|file)/i.test(url);
  }

  private async isContentScriptLoaded() {
    if (!this.currentTabId || !this.currentTabUrl) {
      return false;
    }

    // Try to ping the content script to see if it's active in this tab
    try {
      const message: PingMessage = { action: 'PING' };
      await chrome.tabs.sendMessage<PingMessage, ContentScriptResponse>(this.currentTabId, message);
      return true;
    } catch {
      return false;
    }
  }

  private async shouldContentScriptBeActive() {
    if (!this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      return false;
    }

    const settings = await getCachedSettings();

    // If in manual mode, content script shouldn't be active
    if (settings.spacing_mode === 'spacing_when_click') {
      return false;
    }

    // Check blacklist/whitelist
    const urlPatterns = settings[settings.filter_mode];
    for (const pattern of urlPatterns) {
      try {
        const urlPattern = new URLPattern(pattern);
        if (urlPattern.test(this.currentTabUrl)) {
          // If URL matches blacklist, should NOT be active
          // If URL matches whitelist, SHOULD be active
          return settings.filter_mode === 'whitelist';
        }
      } catch {
        // Invalid pattern, skip
      }
    }

    // If no patterns matched:
    // - For blacklist mode: should be active (not blacklisted)
    // - For whitelist mode: should NOT be active (not whitelisted)
    return settings.filter_mode === 'blacklist';
  }

  private async showErrorMessage(callback?: () => void) {
    this.showMessage(chrome.i18n.getMessage('spacing_fail'), 'error', 1000 * 4, callback);
    await playSound('WahWahWaaah');
  }

  private async showSuccessMessage(callback?: () => void) {
    this.showMessage(chrome.i18n.getMessage('spacing_success'), 'success', 1000 * 3, callback);
    await playSound('YeahBaby');
  }

  private showMessage(text: string, type: 'info' | 'error' | 'success' = 'info', hideMessageDelayMs: number, callback?: () => void) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
      // Clear any existing timeout to prevent premature hiding
      if (this.messageTimeoutId) {
        clearTimeout(this.messageTimeoutId);
      }

      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';

      this.messageTimeoutId = window.setTimeout(() => {
        messageElement.style.display = 'none';
        this.messageTimeoutId = undefined;
        if (callback) {
          callback();
        }
      }, hideMessageDelayMs);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
