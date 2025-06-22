import { translatePage } from './i18n';
import utils, { DEFAULT_SETTINGS } from './utils';
import type { Settings, PingMessage, ManualSpacingMessage, ContentScriptResponse } from './types';

class PopupController {
  private isAutoSpacingEnabled: boolean = true;
  private currentTabId: number | undefined;
  private currentTabUrl: string | undefined;
  private hideMessageDelaySeconds: number = 1000 * 10;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Translate the page
      translatePage();

      // Get current tab info
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = activeTab?.id;
      this.currentTabUrl = activeTab?.url;

      // Get settings directly from chrome.storage
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS) as Settings;
      this.isAutoSpacingEnabled = settings.spacing_mode === 'spacing_when_load';

      // Update UI
      this.updateUI();
      this.updateStatus();
      this.updateVersion();

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  private setupEventListeners(): void {
    // Auto-spacing toggle
    const toggle = document.getElementById('auto-spacing-toggle') as HTMLInputElement;
    if (toggle) {
      toggle.addEventListener('change', () => this.handleToggleChange());
    }

    // Manual spacing button
    const manualBtn = document.getElementById('manual-spacing-btn');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => this.handleManualSpacing());
    }

    // Options link
    const optionsLink = document.getElementById('options-link');
    if (optionsLink) {
      optionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openOptionsPage();
      });
    }
  }

  private updateUI(): void {
    const toggle = document.getElementById('auto-spacing-toggle') as HTMLInputElement;
    if (toggle) {
      toggle.checked = this.isAutoSpacingEnabled;
    }
  }

  private async updateStatus(): Promise<void> {
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
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS) as Settings;

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

  private updateVersion(): void {
    const versionEl = document.getElementById('version');
    if (versionEl) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version;
    }
  }

  private async handleToggleChange(): Promise<void> {
    const toggle = document.getElementById('auto-spacing-toggle') as HTMLInputElement;
    this.isAutoSpacingEnabled = toggle.checked;

    // Use shared toggle function
    await utils.toggleAutoSpacing(this.isAutoSpacingEnabled);
    await utils.playSound(this.isAutoSpacingEnabled ? 'Shouryuuken' : 'Hadouken');

    // Update status
    this.updateStatus();
  }

  private async handleManualSpacing(): Promise<void> {
    if (!this.currentTabId || !this.currentTabUrl) {
      this.showError();
      return;
    }

    if (!this.isValidUrlForSpacing(this.currentTabUrl)) {
      this.showError();
      return;
    }

    try {
      // Disable button to prevent multiple clicks
      const btn = document.getElementById('manual-spacing-btn') as HTMLButtonElement;
      if (btn) {
        btn.disabled = true;
        btn.textContent = '處理中...';
      }

      // Check if content script is loaded
      let contentScriptLoaded = false;
      try {
        const message: PingMessage = { action: 'ping' };
        const response = await chrome.tabs.sendMessage<PingMessage, ContentScriptResponse>(
          this.currentTabId,
          message
        );
        contentScriptLoaded = response?.success === true;
      } catch (e) {
        // Content script not loaded
      }

      if (!contentScriptLoaded) {
        // Inject scripts on-demand
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ['vendors/pangu/pangu.umd.js']
        });

        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ['dist/content-script.js']
        });
      }

      // Apply spacing
      const message: ManualSpacingMessage = { action: 'manual_spacing' };
      const response = await chrome.tabs.sendMessage<ManualSpacingMessage, ContentScriptResponse>(
        this.currentTabId,
        message
      );

      if (!response?.success) {
        throw new Error('Failed to apply spacing');
      }

      // Play sound effect
      await utils.playSound('YeahBaby');

      // Show success feedback
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage('manual_spacing');
      }

      // Show success message
      this.showSuccess();
    } catch (error) {
      console.error('Failed to apply spacing:', error);
      this.showError();

      // Reset button
      const btn = document.getElementById('manual-spacing-btn') as HTMLButtonElement;
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage('manual_spacing');
      }
    }
  }

  private isValidUrlForSpacing(url: string): boolean {
    return /^(http(s?)|file)/i.test(url);
  }

  private async showError(): Promise<void> {
    this.showMessage(chrome.i18n.getMessage('cannot_summon_here') || '沒辦法在這個頁面召喚空格之神', 'error');

    // Play error sound effect
    await utils.playSound('WahWahWaaah');
  }

  private showSuccess(): void {
    this.showMessage('空格之神降臨', 'success');
  }

  private showMessage(text: string, type: 'error' | 'success'): void {
    const messageElement = document.getElementById('message');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';

      // Hide message after 3 seconds
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, this.hideMessageDelaySeconds);
    }
  }

  private openOptionsPage(): void {
    chrome.tabs.create({ url: 'pages/options.html' });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
