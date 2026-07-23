import { translatePage } from './utils/i18n';
import { getSettingsStore } from './utils/settings';
import { playSound, stopSound } from './utils/sounds';
import type { PingMessage, ManualSpacingMessage, ContentScriptResponse, MessageFromContentScript } from './utils/types';

const settings = getSettingsStore();

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

    const textAutospaceToggle = document.getElementById('text-autospace-toggle') as HTMLInputElement;
    if (textAutospaceToggle) {
      textAutospaceToggle.addEventListener('change', () => {
        this.handleTextAutospaceToggleChange();
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

    // Any settings change repaints the whole popup: it is small, and this
    // keeps the status row honest after toggling spacing mode
    settings.subscribe(() => {
      this.render().catch(console.error);
    });
  }

  private async render() {
    await this.renderSpacingModeToggle();
    await this.renderMuteToggle();
    await this.renderTextAutospaceToggle();
    await this.renderStatus();
    await this.renderAddToBlacklistButton();
    this.renderVersion();
  }

  private async renderSpacingModeToggle() {
    const current = await settings.get();
    const spacingModeToggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;
    if (spacingModeToggle) {
      spacingModeToggle.checked = current.spacing_mode === 'spacing_when_load';
    }
  }

  private async renderMuteToggle() {
    const current = await settings.get();
    const muteToggle = document.getElementById('mute-toggle') as HTMLInputElement;
    if (muteToggle) {
      muteToggle.checked = current.is_mute_sound_effects;
    }
  }

  private async renderTextAutospaceToggle() {
    const current = await settings.get();
    const textAutospaceToggle = document.getElementById('text-autospace-toggle') as HTMLInputElement;
    if (textAutospaceToggle) {
      const isSupported = CSS.supports('text-autospace', 'normal');
      // Display-only off when unsupported: never write back, the synced setting still applies on other devices
      textAutospaceToggle.checked = isSupported && current.is_enable_text_autospace;
      textAutospaceToggle.disabled = !isSupported;
      textAutospaceToggle.closest('.toggle')?.classList.toggle('toggle-disabled', !isSupported);
    }
  }

  private async renderStatus() {
    const statusInput = document.getElementById('status-toggle-input') as HTMLInputElement;
    const statusLabel = document.getElementById('status-toggle-label');

    if (!statusInput || !statusLabel) {
      return;
    }

    const shouldBeActive = await this.shouldContentScriptBeActive();
    statusInput.checked = shouldBeActive;
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

    const current = await settings.get();

    // Hide button if not in blacklist mode or if URL is invalid
    if (current.filter_mode !== 'blacklist' || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      button.style.display = 'none';
      return;
    }

    button.style.display = 'block';
  }

  private async handleSpacingModeToggleChange() {
    const toggle = document.getElementById('spacing-mode-toggle') as HTMLInputElement;

    const spacingMode = toggle.checked ? 'spacing_when_load' : 'spacing_when_click';
    try {
      await settings.update({ spacing_mode: spacingMode });
    } catch (error) {
      // The toggle already flipped visually: repaint it from confirmed settings
      console.error('Failed to save settings:', error);
      await this.renderSpacingModeToggle();
      return;
    }

    this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
    await playSound(spacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken');
  }

  private async handleMuteToggleChange() {
    const toggle = document.getElementById('mute-toggle') as HTMLInputElement;
    try {
      await settings.update({ is_mute_sound_effects: toggle.checked });
    } catch (error) {
      console.error('Failed to save settings:', error);
      await this.renderMuteToggle();
      return;
    }

    // Play a sound when turning off mute to confirm it works
    if (!toggle.checked) {
      await playSound('Hadouken');
    }
  }

  private async handleTextAutospaceToggleChange() {
    const toggle = document.getElementById('text-autospace-toggle') as HTMLInputElement;
    try {
      await settings.update({ is_enable_text_autospace: toggle.checked });
    } catch (error) {
      console.error('Failed to save settings:', error);
      await this.renderTextAutospaceToggle();
      return;
    }

    this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
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

    const current = await settings.get();

    // If in manual mode, content script shouldn't be active
    if (current.spacing_mode === 'spacing_when_click') {
      return false;
    }

    // Check blacklist/whitelist
    const urlPatterns = current[current.filter_mode];
    for (const pattern of urlPatterns) {
      try {
        const urlPattern = new URLPattern(pattern);
        if (urlPattern.test(this.currentTabUrl)) {
          // If URL matches blacklist, should NOT be active
          // If URL matches whitelist, SHOULD be active
          return current.filter_mode === 'whitelist';
        }
      } catch {
        // Invalid pattern, skip
      }
    }

    // If no patterns matched:
    // - For blacklist mode: should be active (not blacklisted)
    // - For whitelist mode: should NOT be active (not whitelisted)
    return current.filter_mode === 'blacklist';
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

    stopSound();

    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = undefined;
    }

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

      // The button only shows in blacklist mode, so the active list is the blacklist
      const outcome = await settings.addToActiveList(domainPattern);

      if (outcome === 'duplicate') {
        this.showMessage(chrome.i18n.getMessage('already_in_blacklist'), 'info', 1000 * 3);
      } else if (outcome === 'added') {
        this.showMessage(chrome.i18n.getMessage('refresh_required'), 'info', 1000 * 3);
      }
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
