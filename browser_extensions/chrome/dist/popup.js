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
    try {
      translatePage();
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = activeTab?.id;
      this.currentTabUrl = activeTab?.url;
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      this.isAutoSpacingEnabled = settings.spacing_mode === "spacing_when_load";
      this.updateUI();
      this.updateStatus();
      this.setupEventListeners();
    } catch (error) {
      console.error("Error initializing popup:", error);
    }
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
  updateUI() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.checked = this.isAutoSpacingEnabled;
    }
    const versionEl = document.getElementById("version");
    if (versionEl) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version;
    }
  }
  async updateStatus() {
    const statusEl = document.getElementById("status-indicator");
    if (!statusEl || !this.currentTabUrl) return;
    const isValidUrl = this.isValidUrlForSpacing(this.currentTabUrl);
    if (!isValidUrl) {
      statusEl.className = "status";
      const textEl = statusEl.querySelector(".status-text");
      if (textEl) {
        textEl.setAttribute("data-i18n", "status_inactive");
        textEl.textContent = chrome.i18n.getMessage("status_inactive");
      }
      return;
    }
    if (this.isAutoSpacingEnabled) {
      statusEl.className = "status status-active";
      const textEl = statusEl.querySelector(".status-text");
      if (textEl) {
        const key = "status_active";
        textEl.setAttribute("data-i18n", key);
        textEl.textContent = chrome.i18n.getMessage(key);
      }
    }
  }
  async handleSpacingModeToggleChange() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    this.isAutoSpacingEnabled = spacingModeToggle.checked;
    await utils.toggleAutoSpacing(this.isAutoSpacingEnabled);
    await utils.playSound(this.isAutoSpacingEnabled ? "Shouryuuken" : "Hadouken");
    this.updateStatus();
  }
  async handleManualSpacing() {
    if (!this.currentTabId || !this.currentTabUrl) {
      await this.showError();
      return;
    }
    if (!this.isValidUrlForSpacing(this.currentTabUrl)) {
      await this.showError();
      return;
    }
    try {
      const btn = document.getElementById("manual-spacing-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = chrome.i18n.getMessage("processing");
      }
      try {
        const message2 = { action: "ping" };
        await chrome.tabs.sendMessage(this.currentTabId, message2);
      } catch {
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
      await this.showSuccess();
    } catch (error) {
      console.error("Failed to apply spacing:", error);
      await this.showError();
      const btn = document.getElementById("manual-spacing-btn");
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage("manual_spacing");
      }
    }
  }
  isValidUrlForSpacing(url) {
    return /^(http(s?)|file)/i.test(url);
  }
  async showError() {
    this.showMessage(chrome.i18n.getMessage("cannot_summon_here"), "error");
    await utils.playSound("WahWahWaaah");
  }
  async showSuccess() {
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
