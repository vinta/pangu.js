import { t as translatePage } from "./i18n.js";
import { u as utils_chrome } from "./utils-chrome.js";
class PopupController {
  isAutoSpacingEnabled = true;
  currentTabId;
  currentTabUrl;
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
      this.showNotification("error");
      return;
    }
    if (!this.isValidUrlForSpacing(this.currentTabUrl)) {
      this.showNotification("error");
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
        btn.innerHTML = `
          <svg class="icon-sm" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
          </svg>
          <span>完成！</span>
        `;
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `
            <svg class="icon-sm" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
            </svg>
            <span data-i18n="manual_spacing">${chrome.i18n.getMessage("manual_spacing")}</span>
          `;
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to apply spacing:", error);
      this.showNotification("error");
      const btn = document.getElementById("manual-spacing-btn");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg class="icon-sm" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7C5 5.89543 5.89543 5 7 5H13C14.1046 5 15 5.89543 15 7V13C15 14.1046 14.1046 15 13 15H7C5.89543 15 5 14.1046 5 13V7Z" stroke="currentColor" stroke-width="2"/>
            <path d="M2 10H5M15 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span data-i18n="manual_spacing">${chrome.i18n.getMessage("manual_spacing")}</span>
        `;
      }
    }
  }
  playRandomSound() {
    const sounds = [
      "sounds/AustinPowers-YeahBaby.mp3",
      "sounds/StreetFighter-Hadouken.mp3",
      "sounds/StreetFighter-Shouryuuken.mp3",
      "sounds/WahWahWaaah.mp3"
    ];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = new Audio(chrome.runtime.getURL(randomSound));
    audio.play().catch((e) => console.log("Sound play failed:", e));
  }
  isValidUrlForSpacing(url) {
    return /^(http(s?)|file)/i.test(url);
  }
  showNotification(type) {
    if (type === "error") {
      const message = chrome.i18n.getMessage("can_not_call_god_of_spacing");
      if (message) {
        const notif = document.createElement("div");
        notif.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-danger);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          z-index: 1000;
          max-width: 280px;
          text-align: center;
        `;
        notif.textContent = "此頁面無法使用空格功能";
        document.body.appendChild(notif);
        setTimeout(() => {
          notif.remove();
        }, 3e3);
      }
    }
  }
  openOptionsPage() {
    chrome.tabs.create({ url: "pages/options.html" });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
