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
      this.updateVersion();
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
    const manualBtn = document.getElementById("manual-spacing-btn");
    if (manualBtn) {
      manualBtn.addEventListener("click", () => this.handleManualSpacing());
    }
    const optionsLink = document.getElementById("options-link");
    if (optionsLink) {
      optionsLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.openOptionsPage();
      });
    }
  }
  updateUI() {
    const spacingModeToggle = document.getElementById("spacing-mode-toggle");
    if (spacingModeToggle) {
      spacingModeToggle.checked = this.isAutoSpacingEnabled;
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
  updateVersion() {
    const versionEl = document.getElementById("version");
    if (versionEl) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version;
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
      this.showError();
      return;
    }
    if (!this.isValidUrlForSpacing(this.currentTabUrl)) {
      this.showError();
      return;
    }
    try {
      const btn = document.getElementById("manual-spacing-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "處理中...";
      }
      let contentScriptLoaded = false;
      try {
        const message2 = { action: "ping" };
        const response2 = await chrome.tabs.sendMessage(this.currentTabId, message2);
        contentScriptLoaded = response2?.success === true;
      } catch {
      }
      if (!contentScriptLoaded) {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ["vendors/pangu/pangu.umd.js"]
        });
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          files: ["dist/content-script.js"]
        });
      }
      const message = { action: "manual_spacing" };
      const response = await chrome.tabs.sendMessage(this.currentTabId, message);
      if (!response?.success) {
        throw new Error("Failed to apply spacing");
      }
      await utils.playSound("YeahBaby");
      if (btn) {
        btn.disabled = false;
        btn.textContent = chrome.i18n.getMessage("manual_spacing");
      }
      this.showSuccess();
    } catch (error) {
      console.error("Failed to apply spacing:", error);
      this.showError();
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
    this.showMessage(chrome.i18n.getMessage("cannot_summon_here") || "沒辦法在這個頁面召喚空格之神", "error");
    await utils.playSound("WahWahWaaah");
  }
  showSuccess() {
    this.showMessage(chrome.i18n.getMessage("spacing_success") || "空格之神降臨", "success");
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
  openOptionsPage() {
    chrome.tabs.create({ url: "pages/options.html" });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
