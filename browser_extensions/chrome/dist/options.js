import { t as translatePage } from "./i18n.js";
import { u as utils_chrome } from "./utils_chrome.js";
class OptionsController {
  settings = {
    spacing_mode: "spacing_when_load",
    spacing_rule: "blacklists",
    blacklists: [],
    whitelists: [],
    is_mute_sound_effects: false
  };
  editingUrls = /* @__PURE__ */ new Map();
  addUrlInput = null;
  constructor() {
    this.initialize();
  }
  async initialize() {
    translatePage();
    this.setI18nText();
    await this.loadSettings();
    this.setupEventListeners();
    this.render();
  }
  setI18nText() {
    const elements = {
      "page_title": utils_chrome.get_i18n("extension_name"),
      "header_title": utils_chrome.get_i18n("extension_name"),
      "subtitle": utils_chrome.get_i18n("subtitle"),
      "quote": utils_chrome.get_i18n("quote"),
      "label_spacing_mode": utils_chrome.get_i18n("label_spacing_mode"),
      "label_spacing_rule": utils_chrome.get_i18n("label_spacing_rule"),
      "label_other_options": "其他：",
      "spacing_when_click_msg": utils_chrome.get_i18n("spacing_when_click_msg")
    };
    for (const [id, text] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    }
    document.title = utils_chrome.get_i18n("extension_name");
    const muteLabel = document.getElementById("label_is_mute");
    if (muteLabel) {
      muteLabel.textContent = utils_chrome.get_i18n("label_is_mute");
    }
  }
  async loadSettings() {
    const settings = await utils_chrome.getCachedSettings();
    this.settings = settings;
  }
  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (target.id === "spacing_mode_btn") {
        this.changeSpacingMode();
      } else if (target.id === "spacing_rule_btn") {
        this.changeSpacingRule();
      } else if (target.classList.contains("remove-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.removeUrl(index);
      } else if (target.classList.contains("edit-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.startEditingUrl(index);
      } else if (target.classList.contains("save-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.saveEditingUrl(index);
      } else if (target.classList.contains("cancel-edit-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.cancelEditingUrl(index);
      } else if (target.id === "add-url-btn") {
        this.showAddUrlInput();
      } else if (target.id === "save-new-url-btn") {
        this.addNewUrl();
      } else if (target.id === "cancel-new-url-btn") {
        this.hideAddUrlInput();
      }
    });
    const muteCheckbox = document.getElementById("mute-checkbox");
    if (muteCheckbox) {
      muteCheckbox.addEventListener("change", () => {
        this.settings.is_mute_sound_effects = muteCheckbox.checked;
        this.saveSettings({ is_mute_sound_effects: muteCheckbox.checked });
      });
    }
  }
  render() {
    this.renderSpacingMode();
    this.renderSpacingRule();
    this.renderUrlList();
    this.renderMuteCheckbox();
  }
  renderSpacingMode() {
    const button = document.getElementById("spacing_mode_btn");
    if (button) {
      button.value = utils_chrome.get_i18n(this.settings.spacing_mode);
    }
    const ruleSection = document.querySelector(".spacing_rule_group");
    const clickMessage = document.getElementById("spacing_when_click_msg");
    if (this.settings.spacing_mode === "spacing_when_load") {
      ruleSection?.style.setProperty("display", "block");
      clickMessage?.style.setProperty("display", "none");
    } else {
      ruleSection?.style.setProperty("display", "none");
      clickMessage?.style.setProperty("display", "block");
    }
  }
  renderSpacingRule() {
    const button = document.getElementById("spacing_rule_btn");
    if (button) {
      button.value = utils_chrome.get_i18n(this.settings.spacing_rule);
    }
  }
  renderUrlList() {
    const container = document.getElementById("url-list-container");
    if (!container) return;
    const urls = this.settings[this.settings.spacing_rule];
    let html = '<ul class="spacing_rule_list">';
    urls.forEach((url, index) => {
      if (this.editingUrls.has(index)) {
        html += `
          <li class="animate-repeat">
            <input type="text" class="url-edit-input" value="${this.escapeHtml(this.editingUrls.get(index) || url)}" data-index="${index}" />
            <button class="pure-button small-button save-url-btn" data-index="${index}">save</button>
            <button class="pure-button small-button cancel-edit-btn" data-index="${index}">cancel</button>
          </li>
        `;
      } else {
        html += `
          <li class="animate-repeat">
            <a href="#" class="gradientEllipsis edit-url-btn" data-index="${index}">${this.escapeHtml(url)}</a>
            <button class="pure-button small-button remove-url-btn" data-index="${index}">remove</button>
          </li>
        `;
      }
    });
    if (this.addUrlInput) {
      html += `
        <li>
          <input type="text" class="url-edit-input" id="new-url-input" placeholder="Enter URL" />
          <button class="pure-button small-button" id="save-new-url-btn">save</button>
          <button class="pure-button small-button" id="cancel-new-url-btn">cancel</button>
        </li>
      `;
    } else {
      html += `
        <li>
          <a href="#" id="add-url-btn">click to add</a>
        </li>
      `;
    }
    html += "</ul>";
    container.innerHTML = html;
    if (this.addUrlInput) {
      const input = document.getElementById("new-url-input");
      input?.focus();
    }
  }
  renderMuteCheckbox() {
    const checkbox = document.getElementById("mute-checkbox");
    if (checkbox) {
      checkbox.checked = this.settings.is_mute_sound_effects;
    }
  }
  changeSpacingMode() {
    this.playSound("Hadouken");
    this.settings.spacing_mode = this.settings.spacing_mode === "spacing_when_load" ? "spacing_when_click" : "spacing_when_load";
    this.saveSettings({ spacing_mode: this.settings.spacing_mode });
    this.render();
  }
  changeSpacingRule() {
    this.playSound("Shouryuuken");
    this.settings.spacing_rule = this.settings.spacing_rule === "blacklists" ? "whitelists" : "blacklists";
    this.saveSettings({ spacing_rule: this.settings.spacing_rule });
    this.render();
  }
  startEditingUrl(index) {
    const urls = this.settings[this.settings.spacing_rule];
    this.editingUrls.set(index, urls[index]);
    this.renderUrlList();
    setTimeout(() => {
      const input = document.querySelector(`input[data-index="${index}"]`);
      input?.focus();
      input?.select();
    }, 0);
  }
  saveEditingUrl(index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    const newUrl = input?.value.trim();
    if (this.isValidUrl(newUrl)) {
      this.playSound("YeahBaby");
      const urls = this.settings[this.settings.spacing_rule];
      urls[index] = newUrl;
      this.editingUrls.delete(index);
      const update = {};
      update[this.settings.spacing_rule] = urls;
      this.saveSettings(update);
      this.renderUrlList();
    } else {
      this.playSound("WahWahWaaah");
      alert("Invalid URL");
    }
  }
  cancelEditingUrl(index) {
    this.editingUrls.delete(index);
    this.renderUrlList();
  }
  removeUrl(index) {
    const urls = this.settings[this.settings.spacing_rule];
    urls.splice(index, 1);
    const update = {};
    update[this.settings.spacing_rule] = urls;
    this.saveSettings(update);
    this.renderUrlList();
  }
  showAddUrlInput() {
    this.addUrlInput = document.createElement("input");
    this.renderUrlList();
  }
  hideAddUrlInput() {
    this.addUrlInput = null;
    this.renderUrlList();
  }
  addNewUrl() {
    const input = document.getElementById("new-url-input");
    const newUrl = input?.value.trim();
    if (this.isValidUrl(newUrl)) {
      this.playSound("YeahBaby");
      const urls = this.settings[this.settings.spacing_rule];
      urls.push(newUrl);
      const update = {};
      update[this.settings.spacing_rule] = urls;
      this.saveSettings(update);
      this.addUrlInput = null;
      this.renderUrlList();
    } else {
      this.playSound("WahWahWaaah");
      alert("Invalid URL");
    }
  }
  isValidUrl(url) {
    return url && url.length > 0;
  }
  saveSettings(update) {
    utils_chrome.SYNC_STORAGE.set(update);
  }
  playSound(name) {
    if (!this.settings.is_mute_sound_effects) {
      const sounds = {
        "Hadouken": "../sounds/StreetFighter-Hadouken.mp3",
        "Shouryuuken": "../sounds/StreetFighter-Shouryuuken.mp3",
        "YeahBaby": "../sounds/AustinPowers-YeahBaby.mp3",
        "WahWahWaaah": "../sounds/WahWahWaaah.mp3"
      };
      const audio = new Audio(sounds[name]);
      audio.play().catch(() => {
      });
    }
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new OptionsController();
});
