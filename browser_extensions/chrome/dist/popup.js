import { t as translatePage } from "./i18n.js";
import { u as utils_chrome } from "./utils-chrome.js";
class PopupController {
  isAutoSpacingEnabled = true;
  currentTabId;
  currentTabUrl;
  hideMessageDelaySeconds = 1e3 * 10;
  constructor() {
    this.initialize();
  }
  async initialize() {
    try {
      translatePage();
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = activeTab?.id;
      this.currentTabUrl = activeTab?.url;
      const settings = await utils_chrome.getCachedSettings();
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
    const toggle = document.getElementById("auto-spacing-toggle");
    if (toggle) {
      toggle.addEventListener("change", () => this.handleToggleChange());
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
    const toggle = document.getElementById("auto-spacing-toggle");
    if (toggle) {
      toggle.checked = this.isAutoSpacingEnabled;
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
      const settings = await utils_chrome.getCachedSettings();
      let isActive = false;
      if (settings.spacing_rule === "blacklists") {
        isActive = !settings.blacklists.some((pattern) => this.currentTabUrl.includes(pattern));
      } else {
        const hostname = new URL(this.currentTabUrl).hostname;
        isActive = settings.whitelists.some((pattern) => {
          return hostname === pattern || this.currentTabUrl.includes(pattern);
        });
      }
      statusEl.className = isActive ? "status status-active" : "status";
      const textEl = statusEl.querySelector(".status-text");
      if (textEl) {
        const key = isActive ? "status_active" : "status_inactive";
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
  async handleToggleChange() {
    const toggle = document.getElementById("auto-spacing-toggle");
    this.isAutoSpacingEnabled = toggle.checked;
    const spacing_mode = this.isAutoSpacingEnabled ? "spacing_when_load" : "spacing_when_click";
    await utils_chrome.SYNC_STORAGE.set({ spacing_mode });
    this.updateStatus();
    const settings = await utils_chrome.getCachedSettings();
    if (!settings.is_mute_sound_effects) {
      const soundFile = this.isAutoSpacingEnabled ? "sounds/StreetFighter-Shouryuuken.mp3" : "sounds/StreetFighter-Hadouken.mp3";
      const audio = new Audio(chrome.runtime.getURL(soundFile));
      audio.play().catch((e) => console.log("Sound play failed:", e));
    }
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
        const response2 = await chrome.tabs.sendMessage(this.currentTabId, {
          action: "ping"
        });
        contentScriptLoaded = response2?.success === true;
      } catch (e) {
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
      const response = await chrome.tabs.sendMessage(this.currentTabId, {
        action: "manual_spacing"
      });
      if (!response?.success) {
        throw new Error("Failed to apply spacing");
      }
      const settings = await utils_chrome.getCachedSettings();
      if (!settings.is_mute_sound_effects) {
        const audio = new Audio(chrome.runtime.getURL("sounds/AustinPowers-YeahBaby.mp3"));
        audio.play().catch((e) => console.log("Sound play failed:", e));
      }
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
  showError() {
    this.showMessage(chrome.i18n.getMessage("cannot_summon_here") || "沒辦法在這個頁面召喚空格之神", "error");
  }
  showSuccess() {
    this.showMessage("空格之神降臨", "success");
  }
  showMessage(text, type) {
    const messageElement = document.getElementById("message");
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = "block";
      setTimeout(() => {
        messageElement.style.display = "none";
      }, this.hideMessageDelaySeconds);
    }
  }
  openOptionsPage() {
    chrome.tabs.create({ url: "pages/options.html" });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
