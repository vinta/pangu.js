import { t as translatePage } from "./i18n.js";
import { D as DEFAULT_SETTINGS, u as utils } from "./utils.js";
class PopupController {
  currentTabId;
  currentTabUrl;
  isAutoSpacingEnabled = true;
  hideMessageDelayMs = 1e3 * 10;
  constructor() {
    this.initialize();
  }
  async initialize() {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    this.isAutoSpacingEnabled = settings.spacing_mode === "spacing_when_load";
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTabId = activeTab?.id;
    this.currentTabUrl = activeTab?.url;
    translatePage();
    this.render();
    this.setupEventListeners();
  }
  setupEventListeners() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.addEventListener("change", () => this.handleSpacingModeToggleChange());
    }
    const manualSpacingBtn = document.getElementById("manual-spacing-btn");
    if (manualSpacingBtn) {
      manualSpacingBtn.addEventListener("click", () => this.handleManualSpacing());
    }
  }
  render() {
    this.renderSpacingModeToggle();
    this.renderVersion();
    this.renderStatus();
  }
  renderSpacingModeToggle() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.checked = this.isAutoSpacingEnabled;
    }
  }
  renderVersion() {
    const versionEl = document.getElementById("version");
    if (versionEl) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version;
    }
  }
  async renderStatus() {
    const statusEl = document.getElementById("status-indicator");
    if (!statusEl || !this.currentTabUrl) return;
    const isActive = await this.isContentScriptRegistered();
    statusEl.className = isActive ? "status status-active" : "status";
    const textEl = statusEl.querySelector(".status-text");
    if (textEl) {
      const key = isActive ? "status_active" : "status_inactive";
      textEl.setAttribute("data-i18n", key);
      textEl.textContent = chrome.i18n.getMessage(key);
    }
  }
  async handleSpacingModeToggleChange() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    this.isAutoSpacingEnabled = spacingModeToggle.checked;
    await utils.toggleAutoSpacing(this.isAutoSpacingEnabled);
    await utils.playSound(this.isAutoSpacingEnabled ? "Shouryuuken" : "Hadouken");
    this.renderStatus();
  }
  async handleManualSpacing() {
    console.log(this.currentTabId);
    console.log(this.currentTabUrl);
    if (!this.currentTabId || !this.currentTabUrl || !this.isValidUrl(this.currentTabUrl)) {
      await this.showErrorMessage();
      return;
    }
    try {
      const btn = document.getElementById("manual-spacing-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = chrome.i18n.getMessage("spacing_processing");
      }
      const isScriptLoaded = await this.isContentScriptRegistered();
      if (!isScriptLoaded) {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ["vendors/pangu/pangu.umd.js", "dist/content-script.js"]
        });
      }
      const message = { action: "manual_spacing" };
      const response = await chrome.tabs.sendMessage(this.currentTabId, message);
      if (!response?.success) {
        throw new Error("Failed to apply manual spacing");
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage("manual_spacing");
      }
      await this.showSuccessMessage();
      this.renderStatus();
    } catch (error) {
      console.error("Failed to apply spacing:", error);
      await this.showErrorMessage();
      const btn = document.getElementById("manual-spacing-btn");
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage("manual_spacing");
      }
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
  async showErrorMessage() {
    this.showMessage(chrome.i18n.getMessage("spacing_fail"), "error");
    await utils.playSound("WahWahWaaah");
  }
  async showSuccessMessage() {
    this.showMessage(chrome.i18n.getMessage("spacing_success"), "success");
    await utils.playSound("YeahBaby");
  }
  showMessage(text, type) {
    const messageElement = document.getElementById("message");
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = "block";
      setTimeout(() => {
        messageElement.style.display = "none";
      }, this.hideMessageDelayMs);
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
