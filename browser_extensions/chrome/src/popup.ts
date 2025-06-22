import { translatePage } from './i18n';
import type { Settings, PingMessage, ManualSpacingMessage, ContentScriptResponse } from './types';
import utils, { DEFAULT_SETTINGS } from './utils';

class PopupController {
  private currentTabId: number | undefined;
  private currentTabUrl: string | undefined;
  private isAutoSpacingEnabled: boolean = true;
  private defaultHideMessageDelayMs: number = 1000 * 5;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const settings = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
    this.isAutoSpacingEnabled = settings.spacing_mode === 'spacing_when_load';

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTabId = activeTab?.id;
    this.currentTabUrl = activeTab?.url;

    translatePage();
    this.render();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.addEventListener('change', () => this.handleSpacingModeToggleChange());
    }

    const manualSpacingBtn = document.getElementById('manual-spacing-btn');
    if (manualSpacingBtn) {
      manualSpacingBtn.addEventListener('click', () => this.handleManualSpacing());
    }
  }

  private render() {
    this.renderSpacingModeToggle();
    this.renderVersion();
    this.renderStatus();
  }

  private renderSpacingModeToggle() {
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.checked = this.isAutoSpacingEnabled;
    }
  }

  private renderVersion() {
    const versionEl = document.getElementById('version');
    if (versionEl) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version;
    }
  }

  private async renderStatus() {
    const statusEl = document.getElementById('status-indicator');
    if (!statusEl || !this.currentTabUrl) return;

    // Check if content script is loaded in the current tab
    const isActive = await this.isContentScriptRegistered();

    statusEl.className = isActive ? 'status status-active' : 'status';
    const textEl = statusEl.querySelector('.status-text');
    if (textEl) {
      const key = isActive ? 'status_active' : 'status_inactive';
      textEl.setAttribute('data-i18n', key);
      textEl.textContent = chrome.i18n.getMessage(key);
    }
  }

  private async handleSpacingModeToggleChange() {
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    this.isAutoSpacingEnabled = spacingModeToggle.checked;

    const spacing_mode = this.isAutoSpacingEnabled ? 'spacing_when_load' : 'spacing_when_click';
    await chrome.storage.sync.set({ spacing_mode });
    await utils.playSound(this.isAutoSpacingEnabled ? 'Shouryuuken' : 'Hadouken');

    this.renderStatus();
    this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
  }

  private async handleManualSpacing() {
    console.log(this.currentTabId);
    console.log(this.currentTabUrl);
    if (!this.currentTabId || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
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

      const isContentScriptRegistered = await this.isContentScriptRegistered();
      if (!isContentScriptRegistered) {
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
      this.renderStatus();
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

  private isValidUrl(url: string) {
    // valid urls, e.g., http://, https://, file://
    // invalid urls, e.g., chrome://extensions/, chrome://flags/, ftp://
    return /^(http(s?)|file)/i.test(url);
  }

  private async isContentScriptRegistered(): Promise<boolean> {
    if (!this.currentTabId || !this.currentTabUrl) return false;

    // Try to ping the content script to see if it's loaded
    try {
      const message: PingMessage = { action: 'ping' };
      await chrome.tabs.sendMessage<PingMessage, ContentScriptResponse>(this.currentTabId, message);
      return true;
    } catch {
      return false;
    }
  }

  private async showErrorMessage() {
    this.showMessage(chrome.i18n.getMessage('spacing_fail'), 'error');
    await utils.playSound('WahWahWaaah');
  }

  private async showSuccessMessage() {
    this.showMessage(chrome.i18n.getMessage('spacing_success'), 'success');
    await utils.playSound('YeahBaby');
  }

  private showMessage(text: string, type: 'info' | 'error' | 'success' = 'info', hideMessageDelayMs: number = this.defaultHideMessageDelayMs) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';

      setTimeout(() => {
        messageElement.style.display = 'none';
      }, hideMessageDelayMs);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
