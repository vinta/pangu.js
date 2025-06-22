import { t as translatePage } from "./i18n.js";
import { D as DEFAULT_SETTINGS, u as utils } from "./utils.js";
function convertComplexPattern(pattern) {
  if (pattern.includes("://*.")) {
    const match = pattern.match(/^(\*|https?|file|ftp):\/\/\*\.([^\/]+)(\/.*)?$/);
    if (match) {
      const [, protocol, domain, pathname = "/*"] = match;
      return new URLPattern({
        protocol: protocol === "*" ? "{http,https}" : protocol,
        hostname: `{,*.}${domain}`,
        pathname
      });
    }
  }
  throw new Error("Unsupported pattern format");
}
function isValidMatchPattern(pattern) {
  if (pattern === "<all_urls>") {
    return true;
  }
  try {
    new URLPattern(pattern);
    return true;
  } catch {
    try {
      convertComplexPattern(pattern);
      return true;
    } catch {
      return false;
    }
  }
}
class OptionsController {
  settings = { ...DEFAULT_SETTINGS };
  editingUrls = /* @__PURE__ */ new Map();
  addUrlInput = null;
  constructor() {
    this.initialize();
  }
  async initialize() {
    this.settings = await chrome.storage.sync.get(this.settings);
    translatePage();
    this.render();
    this.setupEventListeners();
  }
  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (target.id === "spacing_mode_btn") {
        this.toggleSpacingMode().catch(console.error);
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
        chrome.storage.sync.set({ is_mute_sound_effects: muteCheckbox.checked });
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
      button.textContent = chrome.i18n.getMessage(i18nKey);
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
      button.textContent = chrome.i18n.getMessage(this.settings.filter_mode);
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
            <button class="btn btn-sm save-url-btn" data-index="${index}">${chrome.i18n.getMessage("button_save")}</button>
            <button class="btn btn-sm btn-ghost cancel-edit-btn" data-index="${index}">${chrome.i18n.getMessage("button_cancel")}</button>
          </li>
        `;
      } else {
        html += `
          <li class="animate-repeat">
            <a href="#" class="gradientEllipsis edit-url-btn" data-index="${index}" title="${this.escapeHtml(url)}">${this.escapeHtml(url)}</a>
            <button class="btn btn-sm btn-ghost remove-url-btn" data-index="${index}">${chrome.i18n.getMessage("button_remove")}</button>
          </li>
        `;
      }
    }
    if (this.addUrlInput) {
      html += `
        <li>
          <input type="text" class="url-edit-input" id="new-url-input" placeholder="${chrome.i18n.getMessage("placeholder_enter_url")}" />
          <button class="btn btn-sm save-url-btn" id="save-new-url-btn">${chrome.i18n.getMessage("button_save")}</button>
          <button class="btn btn-sm btn-ghost cancel-edit-btn" id="cancel-new-url-btn">${chrome.i18n.getMessage("button_cancel")}</button>
        </li>
      `;
    } else {
      html += `
        <li>
          <a href="#" id="add-url-btn">${chrome.i18n.getMessage("button_add_new_url")}</a>
        </li>
      `;
    }
    html += "</ul>";
    html += `
      <div class="url-list-help">
        <small class="text-muted">
          <a href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns" target="_blank" rel="noopener">
            ${chrome.i18n.getMessage("link_learn_match_patterns")}
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
  async toggleSpacingMode() {
    const newIsAutoMode = !(this.settings.spacing_mode === "spacing_when_load");
    const spacing_mode = newIsAutoMode ? "spacing_when_load" : "spacing_when_click";
    await chrome.storage.sync.set({ spacing_mode });
    await utils.playSound(newIsAutoMode ? "Shouryuuken" : "Hadouken");
    this.settings.spacing_mode = newIsAutoMode ? "spacing_when_load" : "spacing_when_click";
    this.render();
  }
  async changeFilterMode() {
    this.settings.filter_mode = this.settings.filter_mode === "blacklist" ? "whitelist" : "blacklist";
    await utils.playSound(this.settings.filter_mode === "blacklist" ? "Shouryuuken" : "Hadouken");
    chrome.storage.sync.set({ filter_mode: this.settings.filter_mode });
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
    if (this.isValidMatchPattern(newUrl)) {
      await utils.playSound("YeahBaby");
      const ruleKey = this.settings.filter_mode;
      this.settings[ruleKey][index] = newUrl;
      const update = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      chrome.storage.sync.set(update);
      this.editingUrls.delete(index);
      this.renderUrlList();
    } else {
      await utils.playSound("WahWahWaaah");
      alert(chrome.i18n.getMessage("error_invalid_match_pattern"));
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
    chrome.storage.sync.set(update);
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
    if (this.isValidMatchPattern(newUrl)) {
      await utils.playSound("YeahBaby");
      const ruleKey = this.settings.filter_mode;
      this.settings[ruleKey].push(newUrl);
      const update = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      chrome.storage.sync.set(update);
      this.addUrlInput = null;
      this.renderUrlList();
    } else {
      await utils.playSound("WahWahWaaah");
      alert(chrome.i18n.getMessage("error_invalid_match_pattern"));
    }
  }
  isValidMatchPattern(pattern) {
    return isValidMatchPattern(pattern);
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
