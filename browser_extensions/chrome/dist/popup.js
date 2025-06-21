import { t as translatePage } from "./i18n.js";
import { u as utils_chrome } from "./utils_chrome.js";
class PopupController {
  spacing_mode = "spacing_when_load";
  constructor() {
    this.initialize();
  }
  async initialize() {
    try {
      translatePage();
      const settings = await utils_chrome.getCachedSettings();
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
    utils_chrome.SYNC_STORAGE.set({ spacing_mode: this.spacing_mode });
  }
  async callGodOfSpacing() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        alert(chrome.i18n.getMessage("can_not_call_god_of_spacing"));
        return;
      }
      if (!this.isValidUrlForSpacing(activeTab.url || "")) {
        alert(chrome.i18n.getMessage("can_not_call_god_of_spacing"));
        return;
      }
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          action: "manual_spacing"
        });
        if (!response?.success) {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ["vendors/pangu/pangu.umd.js", "dist/content_script.js"]
          });
          await chrome.tabs.sendMessage(activeTab.id, {
            action: "manual_spacing"
          });
        }
        const settings = await utils_chrome.getCachedSettings();
        if (!settings.is_mute_sound_effects) {
          this.playRandomSound();
        }
      } catch (error) {
        console.error("Failed to apply spacing:", error);
        alert(chrome.i18n.getMessage("can_not_call_god_of_spacing"));
      }
    } catch (error) {
      console.error("Error in callGodOfSpacing:", error);
      alert(chrome.i18n.getMessage("can_not_call_god_of_spacing"));
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
  openOptionsPage() {
    chrome.tabs.create({ url: "pages/options.html" });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
