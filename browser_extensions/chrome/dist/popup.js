import { t as translatePage, p as playSound, s as stopSound } from "./utils/sounds.js";
import { g as getCachedSettings } from "./utils/settings.js";
class PopupController {
  currentTabId;
  currentTabUrl;
  messageTimeoutId;
  notificationCallback;
  constructor() {
    this.initialize();
  }
  async initialize() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTabId = activeTab?.id;
    this.currentTabUrl = activeTab?.url;
    translatePage();
    await this.render();
    this.setupEventListeners();
  }
  setupEventListeners() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.addEventListener("change", () => {
        this.handleSpacingModeToggleChange();
      });
    }
    const manualSpacingBtn = document.getElementById("manual-spacing-btn");
    if (manualSpacingBtn) {
      manualSpacingBtn.addEventListener("click", () => {
        this.handleManualSpacing();
      });
    }
    const notification = document.getElementById("notification");
    if (notification) {
      notification.addEventListener("click", () => {
        this.hideNotification();
      });
    }
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (message.type === "CONTENT_SCRIPT_LOADED" && sender.tab?.id === this.currentTabId) {
        this.renderStatus();
      }
    });
  }
  async render() {
    await this.renderToggle();
    await this.renderStatus();
    this.renderVersion();
  }
  async renderToggle() {
    const settings = await getCachedSettings();
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.checked = settings.spacing_mode === "spacing_when_load";
    }
  }
  async renderStatus() {
    const statusToggle = document.getElementById("status-indicator");
    if (!statusToggle) {
      return;
    }
    const statusInput = document.getElementById("status-toggle-input");
    const statusLabel = document.getElementById("status-toggle-label");
    if (!statusInput || !statusLabel) {
      return;
    }
    const shouldBeActive = await this.shouldContentScriptBeActive();
    statusInput.checked = shouldBeActive;
    const messageKey = shouldBeActive ? "status_active" : "status_inactive";
    statusLabel.setAttribute("data-i18n", messageKey);
    statusLabel.textContent = chrome.i18n.getMessage(messageKey);
  }
  renderVersion() {
    const versionElement = document.getElementById("version");
    if (versionElement) {
      versionElement.textContent = chrome.runtime.getManifest().version;
    }
  }
  async handleSpacingModeToggleChange() {
    const toggle = document.getElementById("spacing-mode-toggle");
    const spacingMode = toggle.checked ? "spacing_when_load" : "spacing_when_click";
    await chrome.storage.sync.set({ spacing_mode: spacingMode });
    this.showMessage(chrome.i18n.getMessage("refresh_required"), "info", 1e3 * 3);
    await playSound(spacingMode === "spacing_when_load" ? "Shouryuuken" : "Hadouken");
  }
  async handleManualSpacing() {
    const button = document.getElementById("manual-spacing-btn");
    if (!button) {
      return;
    }
    button.disabled = true;
    if (!this.currentTabId || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      await this.showErrorMessage(() => {
        button.disabled = false;
      });
      return;
    }
    try {
      button.textContent = chrome.i18n.getMessage("spacing_processing");
      const isContentScriptLoaded = await this.isContentScriptLoaded();
      if (!isContentScriptLoaded) {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ["vendors/pangu/pangu.umd.js", "dist/content-script.js"]
        });
      }
      const message = { action: "MANUAL_SPACING" };
      const response = await chrome.tabs.sendMessage(this.currentTabId, message);
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
      console.error("Manual spacing error:", error);
      await this.showErrorMessage(() => {
        button.disabled = false;
      });
    } finally {
      button.textContent = chrome.i18n.getMessage("manual_spacing");
    }
  }
  isValidUrl(url) {
    return /^(http(s?)|file)/i.test(url);
  }
  async isContentScriptLoaded() {
    if (!this.currentTabId || !this.currentTabUrl) {
      return false;
    }
    try {
      const message = { action: "PING" };
      await chrome.tabs.sendMessage(this.currentTabId, message);
      return true;
    } catch {
      return false;
    }
  }
  async shouldContentScriptBeActive() {
    if (!this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      return false;
    }
    const settings = await getCachedSettings();
    if (settings.spacing_mode === "spacing_when_click") {
      return false;
    }
    const urlPatterns = settings[settings.filter_mode];
    for (const pattern of urlPatterns) {
      try {
        const urlPattern = new URLPattern(pattern);
        if (urlPattern.test(this.currentTabUrl)) {
          return settings.filter_mode === "whitelist";
        }
      } catch {
      }
    }
    return settings.filter_mode === "blacklist";
  }
  async showErrorMessage(callback) {
    this.showMessage(chrome.i18n.getMessage("spacing_fail"), "error", 1e3 * 4, callback);
    await playSound("WahWahWaaah");
  }
  async showSuccessMessage(callback) {
    this.showMessage(chrome.i18n.getMessage("spacing_success"), "success", 1e3 * 3, callback);
    await playSound("YeahBaby");
  }
  showMessage(text, type = "info", hideMessageDelayMs, callback) {
    const notificationElement = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    if (notificationElement && notificationMessage) {
      if (this.messageTimeoutId) {
        clearTimeout(this.messageTimeoutId);
      }
      this.notificationCallback = callback;
      notificationMessage.textContent = text;
      notificationElement.className = `notification ${type}`;
      notificationElement.style.display = "block";
      this.messageTimeoutId = window.setTimeout(() => {
        this.hideNotification();
      }, hideMessageDelayMs);
    }
  }
  hideNotification() {
    const notificationElement = document.getElementById("notification");
    if (notificationElement) {
      notificationElement.style.display = "none";
    }
    stopSound();
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = void 0;
    }
    if (this.notificationCallback) {
      this.notificationCallback();
      this.notificationCallback = void 0;
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
