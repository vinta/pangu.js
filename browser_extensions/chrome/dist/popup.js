class PopupController {
  spacing_mode = "spacing_when_load";
  constructor() {
    this.initialize();
  }
  async initialize() {
    document.getElementById("god_of_spacing").textContent = window.utils_chrome.get_i18n("god_of_spacing");
    const settings = await window.utils_chrome.getCachedSettings();
    this.spacing_mode = settings.spacing_mode;
    this.updateSpacingModeButton();
    this.setupEventListeners();
    const callButton = document.querySelector(".pure-button-purple");
    callButton.value = window.utils_chrome.get_i18n("call_god_of_spacing");
    const rateLink = document.querySelector('a[target="_blank"]');
    rateLink.textContent = window.utils_chrome.get_i18n("extension_rate");
    const optionsLink = document.querySelector('a[href="#"]');
    optionsLink.textContent = window.utils_chrome.get_i18n("extension_options");
  }
  setupEventListeners() {
    const spacingModeButton = document.querySelector(".pure-button-primary");
    spacingModeButton.addEventListener("click", () => this.changeSpacingMode());
    const callButton = document.querySelector(".pure-button-purple");
    callButton.addEventListener("click", () => this.callGodOfSpacing());
    const optionsLink = document.querySelector('a[href="#"]');
    optionsLink.addEventListener("click", (e) => {
      e.preventDefault();
      this.openOptionsPage();
    });
  }
  updateSpacingModeButton() {
    const button = document.querySelector(".pure-button-primary");
    button.value = window.utils_chrome.get_i18n(this.spacing_mode);
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
            alert(window.utils_chrome.get_i18n("can_not_call_god_of_spacing"));
          }
        }
      } else {
        if (i === 0) {
          alert(window.utils_chrome.get_i18n("can_not_call_god_of_spacing"));
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
