import { t as translatePage } from "./i18n.js";
import { u as utils } from "./utils.js";
class PopupController {
  currentTabId;
  currentTabUrl;
  messageTimeoutId;
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
  }
  async render() {
    await this.renderToggle();
    await this.renderStatus();
    this.renderVersion();
  }
  async renderToggle() {
    const settings = await utils.getCachedSettings();
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.checked = settings.spacing_mode === "spacing_when_load";
    }
  }
  async renderStatus() {
    const statusIndicator = document.getElementById("status-indicator");
    if (!statusIndicator) {
      return;
    }
    const statusText = statusIndicator.querySelector(".status-text");
    if (!statusText) {
      return;
    }
    const isContentScriptRegistered = await this.isContentScriptRegistered();
    statusText.setAttribute("data-i18n", isContentScriptRegistered ? "status_active" : "status_inactive");
    statusText.textContent = chrome.i18n.getMessage(isContentScriptRegistered ? "status_active" : "status_inactive");
    statusIndicator.className = isContentScriptRegistered ? "status status-active" : "status";
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
    await utils.playSound(spacingMode === "spacing_when_load" ? "Shouryuuken" : "Hadouken");
  }
  async handleManualSpacing() {
    const button = document.getElementById("manual-spacing-btn");
    if (!button) return;
    button.disabled = true;
    if (!this.currentTabId || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      await this.showErrorMessage(() => {
        button.disabled = false;
      });
      return;
    }
    try {
      button.textContent = chrome.i18n.getMessage("spacing_processing");
      const isContentScriptRegistered = await this.isContentScriptRegistered();
      if (!isContentScriptRegistered) {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ["vendors/pangu/pangu.umd.js", "dist/content-script.js"]
        });
      }
      const message = { action: "manual_spacing" };
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
  async isContentScriptRegistered() {
    if (!this.currentTabId || !this.currentTabUrl) return false;
    try {
      const message = { action: "ping" };
      await chrome.tabs.sendMessage(this.currentTabId, message);
      return true;
    } catch {
      return false;
    }
  }
  async showErrorMessage(callback) {
    this.showMessage(chrome.i18n.getMessage("spacing_fail"), "error", 1e3 * 4, callback);
    await utils.playSound("WahWahWaaah");
  }
  async showSuccessMessage(callback) {
    this.showMessage(chrome.i18n.getMessage("spacing_success"), "success", 1e3 * 3, callback);
    await utils.playSound("YeahBaby");
  }
  showMessage(text, type = "info", hideMessageDelayMs, callback) {
    const messageElement = document.getElementById("message");
    if (messageElement) {
      if (this.messageTimeoutId) {
        clearTimeout(this.messageTimeoutId);
      }
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = "block";
      this.messageTimeoutId = window.setTimeout(() => {
        messageElement.style.display = "none";
        this.messageTimeoutId = void 0;
        if (callback) {
          callback();
        }
      }, hideMessageDelayMs);
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
