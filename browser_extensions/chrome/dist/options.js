import { t as translatePage } from "./i18n.js";
import { D as DEFAULT_SETTINGS, u as utils } from "./utils.js";
class OptionsController {
  settings = { ...DEFAULT_SETTINGS };
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
      page_title: utils.get_i18n("extension_name"),
      header_title: utils.get_i18n("extension_name"),
      subtitle: utils.get_i18n("subtitle"),
      quote: utils.get_i18n("quote"),
      label_spacing_mode: utils.get_i18n("label_spacing_mode"),
      label_filter_mode: utils.get_i18n("label_filter_mode"),
      label_other_options: "其他：",
      spacing_when_click_msg: utils.get_i18n("spacing_when_click_msg")
    };
    for (const [id, text] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    }
    document.title = utils.get_i18n("extension_name");
    const muteLabel = document.getElementById("label_is_mute");
    if (muteLabel) {
      muteLabel.textContent = utils.get_i18n("label_is_mute");
    }
  }
  async loadSettings() {
    this.settings = await chrome.storage.sync.get(this.settings);
  }
  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (target.id === "spacing_mode_btn") {
        this.changeSpacingMode().catch(console.error);
      } else if (target.id === "filter_mode_btn") {
        this.changeFilterMode().catch(console.error);
      } else if (target.classList.contains("remove-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.removeUrl(index);
      } else if (target.classList.contains("edit-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.startEditingUrl(index);
      } else if (target.classList.contains("save-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.saveEditingUrl(index).catch(console.error);
      } else if (target.classList.contains("cancel-edit-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.cancelEditingUrl(index);
      } else if (target.id === "add-url-btn") {
        this.showAddUrlInput();
      } else if (target.id === "save-new-url-btn") {
        this.addNewUrl().catch(console.error);
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
    this.renderFilterMode();
    this.renderUrlList();
    this.renderMuteCheckbox();
  }
  renderSpacingMode() {
    const button = document.getElementById("spacing_mode_btn");
    if (button) {
      const i18nKey = this.settings.spacing_mode === "spacing_when_load" ? "auto_spacing_mode" : "manual_spacing_mode";
      button.textContent = utils.get_i18n(i18nKey);
    }
    const ruleSection = document.querySelector(".filter_mode_group");
    const clickMessage = document.getElementById("spacing_when_click_msg");
    if (this.settings.spacing_mode === "spacing_when_load") {
      ruleSection?.style.setProperty("display", "block");
      clickMessage?.style.setProperty("display", "none");
    } else {
      ruleSection?.style.setProperty("display", "none");
      clickMessage?.style.setProperty("display", "block");
    }
  }
  renderFilterMode() {
    const button = document.getElementById("filter_mode_btn");
    if (button) {
      button.textContent = utils.get_i18n(this.settings.filter_mode);
    }
  }
  renderUrlList() {
    const container = document.getElementById("url-list-container");
    if (!container) return;
    const urls = this.settings[this.settings.filter_mode] || [];
    let html = '<ul class="filter_mode_list">';
    for (const [index, url] of urls.entries()) {
      if (this.editingUrls.has(index)) {
        html += `
          <li class="animate-repeat">
            <input type="text" class="url-edit-input" value="${this.escapeHtml(this.editingUrls.get(index) || url)}" data-index="${index}" />
            <button class="btn btn-sm save-url-btn" data-index="${index}">Save</button>
            <button class="btn btn-sm btn-ghost cancel-edit-btn" data-index="${index}">Cancel</button>
          </li>
        `;
      } else {
        html += `
          <li class="animate-repeat">
            <a href="#" class="gradientEllipsis edit-url-btn" data-index="${index}" title="${this.escapeHtml(url)}">${this.escapeHtml(url)}</a>
            <button class="btn btn-sm btn-ghost remove-url-btn" data-index="${index}">Remove</button>
          </li>
        `;
      }
    }
    if (this.addUrlInput) {
      html += `
        <li>
          <input type="text" class="url-edit-input" id="new-url-input" placeholder="Enter URL or match pattern" />
          <button class="btn btn-sm save-url-btn" id="save-new-url-btn">Save</button>
          <button class="btn btn-sm btn-ghost cancel-edit-btn" id="cancel-new-url-btn">Cancel</button>
        </li>
      `;
    } else {
      html += `
        <li>
          <a href="#" id="add-url-btn">Add new URL</a>
        </li>
      `;
    }
    html += "</ul>";
    html += `
      <div class="url-list-help">
        <small class="text-muted">
          <a href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns" target="_blank" rel="noopener">
            Learn about match patterns ↗
          </a>
        </small>
      </div>
    `;
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
  async changeSpacingMode() {
    const isCurrentlyAutoMode = this.settings.spacing_mode === "spacing_when_load";
    const newIsAutoMode = !isCurrentlyAutoMode;
    await utils.toggleAutoSpacing(newIsAutoMode);
    await utils.playSound(newIsAutoMode ? "Shouryuuken" : "Hadouken");
    this.settings.spacing_mode = newIsAutoMode ? "spacing_when_load" : "spacing_when_click";
    this.render();
  }
  async changeFilterMode() {
    this.settings.filter_mode = this.settings.filter_mode === "blacklist" ? "whitelist" : "blacklist";
    await utils.playSound(this.settings.filter_mode === "blacklist" ? "Shouryuuken" : "Hadouken");
    this.saveSettings({ filter_mode: this.settings.filter_mode });
    this.render();
  }
  startEditingUrl(index) {
    const urls = this.settings[this.settings.filter_mode];
    this.editingUrls.set(index, urls[index]);
    this.renderUrlList();
    setTimeout(() => {
      const input = document.querySelector(`input[data-index="${index}"]`);
      input?.focus();
      input?.select();
    }, 0);
  }
  async saveEditingUrl(index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    const newUrl = input?.value.trim();
    if (this.isValidUrl(newUrl)) {
      await utils.playSound("YeahBaby");
      const ruleKey = this.settings.filter_mode;
      this.settings[ruleKey][index] = newUrl;
      const update = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      this.saveSettings(update);
      this.editingUrls.delete(index);
      this.renderUrlList();
    } else {
      await utils.playSound("WahWahWaaah");
      alert("Invalid match pattern. Format: <scheme>://<host><path>\nExample: *://example.com/*");
    }
  }
  cancelEditingUrl(index) {
    this.editingUrls.delete(index);
    this.renderUrlList();
  }
  removeUrl(index) {
    const ruleKey = this.settings.filter_mode;
    this.settings[ruleKey].splice(index, 1);
    const update = {};
    update[ruleKey] = [...this.settings[ruleKey]];
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
  async addNewUrl() {
    const input = document.getElementById("new-url-input");
    const newUrl = input?.value.trim();
    if (this.isValidUrl(newUrl)) {
      await utils.playSound("YeahBaby");
      const ruleKey = this.settings.filter_mode;
      this.settings[ruleKey].push(newUrl);
      const update = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      this.saveSettings(update);
      this.addUrlInput = null;
      this.renderUrlList();
    } else {
      await utils.playSound("WahWahWaaah");
      alert("Invalid match pattern. Format: <scheme>://<host><path>\nExample: *://example.com/*");
    }
  }
  isValidUrl(url) {
    return this.isValidMatchPattern(url);
  }
  isValidMatchPattern(pattern) {
    const matchPatternRegex = /^(\*|https?|file|ftp):\/\/(\*|\*\.[^\/]+|[^\/]+)(\/.*)?$/;
    if (pattern === "<all_urls>") {
      return true;
    }
    return matchPatternRegex.test(pattern);
  }
  saveSettings(update) {
    chrome.storage.sync.set(update);
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
