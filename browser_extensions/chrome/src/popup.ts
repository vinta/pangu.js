import { translatePage } from './i18n';
import utils, { DEFAULT_SETTINGS } from './utils';
import type { Settings, PingMessage, ManualSpacingMessage, ContentScriptResponse } from './types';

class PopupController {
  private currentTabId: number | undefined;
  private currentTabUrl: string | undefined;
  private isAutoSpacingEnabled: boolean = true;
  private hideMessageDelayMs: number = 1000 * 10;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      translatePage();

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = activeTab?.id;
      this.currentTabUrl = activeTab?.url;

      const settings = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
      this.isAutoSpacingEnabled = settings.spacing_mode === 'spacing_when_load';

      this.updateUI();
      this.updateStatus();

      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  private setupEventListeners() {
    // Spacing mode toggle
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.addEventListener('change', () => this.handleSpacingModeToggleChange());
    }

    // Manual spacing button
    const manualSpacingBtn = document.getElementById('manual-spacing-btn');
    if (manualSpacingBtn) {
      manualSpacingBtn.addEventListener('click', () => this.handleManualSpacing());
    }
  }

  private updateUI() {
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.checked = this.isAutoSpacingEnabled;
    }

    const versionEl = document.getElementById('version');
    if (versionEl) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version;
    }
  }

  private async updateStatus() {
    const statusEl = document.getElementById('status-indicator');
    if (!statusEl || !this.currentTabUrl) return;

    // Check if current URL is valid for spacing
    const isValidUrl = this.isValidUrlForSpacing(this.currentTabUrl);

    if (!isValidUrl) {
      statusEl.className = 'status';
      const textEl = statusEl.querySelector('.status-text');
      if (textEl) {
        textEl.setAttribute('data-i18n', 'status_inactive');
        textEl.textContent = chrome.i18n.getMessage('status_inactive');
      }
      return;
    }

    // Check if spacing is active on this site
    if (this.isAutoSpacingEnabled) {
      // For new match pattern based rules, we can't easily check if the current URL matches
      // because Chrome's match pattern system is more complex than simple string matching
      // So we'll just show as active if auto-spacing is enabled
      const isActive = true;

      statusEl.className = isActive ? 'status status-active' : 'status';
      const textEl = statusEl.querySelector('.status-text');
      if (textEl) {
        const key = isActive ? 'status_active' : 'status_inactive';
        textEl.setAttribute('data-i18n', key);
        textEl.textContent = chrome.i18n.getMessage(key);
      }
    }
  }

  private async handleSpacingModeToggleChange() {
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    this.isAutoSpacingEnabled = spacingModeToggle.checked;

    await utils.toggleAutoSpacing(this.isAutoSpacingEnabled);
    await utils.playSound(this.isAutoSpacingEnabled ? 'Shouryuuken' : 'Hadouken');

    this.updateStatus();
  }

  private async handleManualSpacing() {
    if (!this.currentTabId || !this.currentTabUrl) {
      await this.showErrorMessage();
      return;
    }

    if (!this.isValidUrlForSpacing(this.currentTabUrl)) {
      await this.showErrorMessage();
      return;
    }

    try {
      // Disable button to prevent multiple clicks
      const btn = document.getElementById('manual-spacing-btn') as HTMLButtonElement;
      if (btn) {
        btn.disabled = true;
        btn.textContent = chrome.i18n.getMessage('spacing_processing');
      }

      // Check if content script is loaded
      try {
        const message: PingMessage = { action: 'ping' };
        await chrome.tabs.sendMessage<PingMessage, ContentScriptResponse>(this.currentTabId, message);
      } catch {
        // Content script not loaded - inject scripts on-demand
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ['vendors/pangu/pangu.umd.js', 'dist/content-script.js'],
        });
      }

      // Apply spacing
      const message: ManualSpacingMessage = { action: 'manual_spacing' };
      const response = await chrome.tabs.sendMessage<ManualSpacingMessage, ContentScriptResponse>(this.currentTabId, message);
      if (!response?.success) {
        throw new Error('Failed to apply manual spacing');
      }

      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage('manual_spacing');
      }

      await this.showSuccessMessage();
    } catch (error) {
      console.error('Failed to apply spacing:', error);
      await this.showErrorMessage();

      // Reset button
      const btn = document.getElementById('manual-spacing-btn') as HTMLButtonElement;
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage('manual_spacing');
      }
    }
  }

  private isValidUrlForSpacing(url: string) {
    return /^(http(s?)|file)/i.test(url);
  }

  private async showErrorMessage() {
    this.showMessage(chrome.i18n.getMessage('spacing_fail'), 'error');
    await utils.playSound('WahWahWaaah');
  }

  private async showSuccessMessage() {
    this.showMessage(chrome.i18n.getMessage('spacing_success'), 'success');
    await utils.playSound('YeahBaby');
  }

  private showMessage(text: string, type: 'error' | 'success') {
    const messageElement = document.getElementById('message');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';

      setTimeout(() => {
        messageElement.style.display = 'none';
      }, this.hideMessageDelayMs);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
