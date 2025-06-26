import { translatePage } from './utils/i18n';
import { getCachedSettings } from './utils/settings';
import { playSound, stopSound } from './utils/sounds';
import type { PingMessage, ManualSpacingMessage, ContentScriptResponse, MessageFromContentScript } from './utils/types';

class PopupController {
  private currentTabId: number | undefined;
  private currentTabUrl: string | undefined;
  private messageTimeoutId: number | undefined;
  private notificationCallback: (() => void) | undefined;

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

    const muteToggle = document.getElementById('mute-toggle') as HTMLInputElement;
    if (muteToggle) {
      muteToggle.addEventListener('change', () => {
        this.handleMuteToggleChange();
      });
    }

    const manualSpacingBtn = document.getElementById('manual-spacing-btn');
    if (manualSpacingBtn) {
      manualSpacingBtn.addEventListener('click', () => {
        this.handleManualSpacing();
      });
    }

    const addToBlacklistBtn = document.getElementById('add-to-blacklist-btn');
    if (addToBlacklistBtn) {
      addToBlacklistBtn.addEventListener('click', () => {
        this.handleAddToBlacklist();
      });
    }

    const notification = document.getElementById('notification');
    if (notification) {
      notification.addEventListener('click', () => {
        this.hideNotification();
      });
    }

    chrome.runtime.onMessage.addListener((message: MessageFromContentScript, sender) => {
      if (message.type === 'CONTENT_SCRIPT_LOADED' && sender.tab?.id === this.currentTabId) {
        this.renderStatus();
      }
    });
  }

  private async render() {
    await this.renderSpacingModeToggle();
    await this.renderMuteToggle();
    await this.renderStatus();
    await this.renderAddToBlacklistButton();
    this.renderVersion();
  }

  private async renderSpacingModeToggle() {
    const settings = await getCachedSettings();
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.checked = settings.spacing_mode === 'spacing_when_load';
    }
  }

  private async renderMuteToggle() {
    const settings = await getCachedSettings();
    const muteToggle = document.getElementById('mute-toggle') as HTMLInputElement;
    if (muteToggle) {
      muteToggle.checked = settings.is_mute_sound_effects;
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

  private async renderAddToBlacklistButton() {
    const button = document.getElementById('add-to-blacklist-btn');
    if (!button) {
      return;
    }

    const settings = await getCachedSettings();

    // Hide button if not in blacklist mode or if URL is invalid
    if (settings.filter_mode !== 'blacklist' || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      button.style.display = 'none';
      return;
    }

    button.style.display = 'block';
  }

  private async handleSpacingModeToggleChange() {
    const toggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;

    const spacingMode = toggle.checked ? 'spacing_when_load' : 'spacing_when_click';
    await chrome.storage.sync.set({ spacing_mode: spacingMode });

    this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
    await playSound(spacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken');
  }

  private async handleMuteToggleChange() {
    const toggle = document.getElementById('mute-toggle') as HTMLInputElement;
    await chrome.storage.sync.set({ is_mute_sound_effects: toggle.checked });

    // Play a sound when turning off mute to confirm it works
    if (!toggle.checked) {
      await playSound('Hadouken');
    }
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
    const notificationElement = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    if (notificationElement && notificationMessage) {
      // Clear any existing timeout to prevent premature hiding
      if (this.messageTimeoutId) {
        clearTimeout(this.messageTimeoutId);
      }

      // Store the callback so it can be called when manually dismissing
      this.notificationCallback = callback;

      notificationMessage.textContent = text;
      notificationElement.className = `notification ${type}`;
      notificationElement.style.display = 'block';

      this.messageTimeoutId = window.setTimeout(() => {
        this.hideNotification();
      }, hideMessageDelayMs);
    }
  }

  private hideNotification() {
    const notificationElement = document.getElementById('notification');
    if (notificationElement) {
      notificationElement.style.display = 'none';
    }

    // Stop any playing sound when notification is dismissed
    stopSound();

    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = undefined;
    }

    // Execute the stored callback if it exists
    if (this.notificationCallback) {
      this.notificationCallback();
      this.notificationCallback = undefined;
    }
  }

  private async handleAddToBlacklist() {
    if (!this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      return;
    }

    try {
      const url = new URL(this.currentTabUrl);
      const domainPattern = `${url.protocol}//${url.hostname}/*`;

      const settings = await getCachedSettings();

      if (settings.blacklist.includes(domainPattern)) {
        this.showMessage(chrome.i18n.getMessage('already_in_blacklist'), 'info', 1000 * 3);
        return;
      }

      settings.blacklist.push(domainPattern);
      await chrome.storage.sync.set({ blacklist: settings.blacklist });

      this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      await this.showErrorMessage();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
