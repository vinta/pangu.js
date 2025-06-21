import { t as translatePage } from "./i18n.js";
class PopupController {
  spacing_mode = "spacing_when_load";
  constructor() {
    this.initialize();
  }
  async initialize() {
    try {
      translatePage();
      if (!window.utils_chrome) {
        console.error("utils_chrome not available");
        return;
      }
      const settings = await window.utils_chrome.getCachedSettings();
      this.spacing_mode = settings.spacing_mode;
      this.updateSpacingModeButton();
      this.setupEventListeners();
    } catch (error) {
      console.error("Error initializing popup:", error);
    }
  }
  setupEventListeners() {
    const spacingModeButton = document.querySelector(".pure-button-primary");
    if (spacingModeButton) {
      spacingModeButton.addEventListener("click", () => this.changeSpacingMode());
    }
    const callButton = document.querySelector(".pure-button-purple");
    if (callButton) {
      callButton.addEventListener("click", () => this.callGodOfSpacing());
    }
    const optionsLink = document.querySelector('a[href="#"]');
    if (optionsLink) {
      optionsLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.openOptionsPage();
      });
    }
  }
  updateSpacingModeButton() {
    const button = document.querySelector(".pure-button-primary");
    if (button) {
      button.setAttribute("data-i18n", this.spacing_mode);
      const message = chrome.i18n.getMessage(this.spacing_mode);
      if (message) {
        button.value = message;
      } else {
        button.value = this.spacing_mode === "spacing_when_load" ? "網頁載入後自動幫我加上空格" : "我要自己決定什麼時候要加空格";
      }
    }
  }
  changeSpacingMode() {
    this.spacing_mode = this.spacing_mode === "spacing_when_load" ? "spacing_when_click" : "spacing_when_load";
    this.updateSpacingModeButton();
    window.utils_chrome.SYNC_STORAGE.set({ spacing_mode: this.spacing_mode });
  }
  async callGodOfSpacing() {
    const tabs = await chrome.tabs.query({ active: true });
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (this.isValidUrlForSpacing(tab.url || "")) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: () => {
              if (typeof pangu !== "undefined" && pangu.spacingPage) {
                pangu.spacingPage();
              }
            }
          });
        } catch (error) {
          console.error("Failed to execute script:", error);
          if (i === 0) {
            alert(chrome.i18n.getMessage("can_not_call_god_of_spacing"));
          }
        }
      } else {
        if (i === 0) {
          alert(chrome.i18n.getMessage("can_not_call_god_of_spacing"));
        }
      }
    }
  }
  isValidUrlForSpacing(url) {
    return /^(http(s?)|file)/i.test(url);
  }
  openOptionsPage() {
    chrome.tabs.create({ url: "pages/options.html" });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
