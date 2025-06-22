import { t as translatePage } from "./i18n.js";
import { u as utils } from "./utils.js";
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
  editingUrls = /* @__PURE__ */ new Map();
  addUrlInput = null;
  constructor() {
    this.initialize();
  }
  async initialize() {
    translatePage();
    await this.render();
    this.setupEventListeners();
  }
  setupEventListeners() {
    chrome.storage.onChanged.addListener(async (_changes, areaName) => {
      if (areaName === "sync") {
        await this.render();
      }
    });
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
        this.saveEditingUrl(index);
      } else if (target.classList.contains("cancel-edit-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.cancelEditingUrl(index);
      } else if (target.id === "add-url-btn") {
        this.showAddUrlInput();
      }
    });
    document.addEventListener("change", async (e) => {
      const target = e.target;
      if (target.id === "mute-checkbox") {
        const muteCheckbox = target;
        chrome.storage.sync.set({ is_mute_sound_effects: muteCheckbox.checked });
      }
    });
  }
  async render() {
    await this.renderSpacingMode();
    await this.renderFilterMode();
    await this.renderUrlList();
    await this.renderMuteCheckbox();
  }
  async renderSpacingMode() {
    const settings = await utils.getCachedSettings();
    const button = document.getElementById("spacing_mode_btn");
    if (button) {
      const i18nKey = settings.spacing_mode === "spacing_when_load" ? "auto_spacing_mode" : "manual_spacing_mode";
      button.textContent = chrome.i18n.getMessage(i18nKey);
    }
    const ruleSection = document.querySelector(".filter_mode_group");
    const clickMessage = document.getElementById("spacing_when_click_msg");
    if (settings.spacing_mode === "spacing_when_load") {
      if (ruleSection) ruleSection.style.display = "block";
      if (clickMessage) clickMessage.style.display = "none";
    } else {
      if (ruleSection) ruleSection.style.display = "none";
      if (clickMessage) clickMessage.style.display = "block";
    }
  }
  async renderFilterMode() {
    const settings = await utils.getCachedSettings();
    const button = document.getElementById("filter_mode_btn");
    if (button) {
      button.textContent = chrome.i18n.getMessage(settings.filter_mode);
    }
  }
  async renderUrlList() {
    const settings = await utils.getCachedSettings();
    const container = document.getElementById("url-list-container");
    if (!container) return;
    const urls = settings[settings.filter_mode] || [];
    let html = '<ul class="filter_mode_list">';
    for (const [index, url] of urls.entries()) {
      const editingUrl = this.editingUrls.get(index);
      if (editingUrl !== void 0) {
        html += `
          <li>
            <input type="text" class="url-edit-input" value="${this.escapeHtml(editingUrl)}" data-index="${index}">
            <button class="btn btn-sm save-url-btn" data-index="${index}">${chrome.i18n.getMessage("button_save")}</button>
            <button class="btn btn-sm cancel-edit-btn" data-index="${index}">${chrome.i18n.getMessage("button_cancel")}</button>
          </li>
        `;
      } else {
        html += `
          <li class="animate-repeat">
            <a href="${url}" target="_blank" class="gradientEllipsis">${url}</a>
            <button class="btn btn-sm edit-url-btn" data-index="${index}">
              <svg class="icon icon-sm"><use xlink:href="#icon-edit"></use></svg>
            </button>
            <button class="btn btn-sm remove-url-btn" data-index="${index}">${chrome.i18n.getMessage("button_remove")}</button>
          </li>
        `;
      }
    }
    if (this.addUrlInput) {
      html += `
        <li>
          <input type="text" class="url-edit-input" id="new-url-input" placeholder="${chrome.i18n.getMessage("placeholder_enter_url")}">
          <button class="btn btn-sm" id="save-new-url-btn">${chrome.i18n.getMessage("button_save")}</button>
          <button class="btn btn-sm" id="cancel-new-url-btn">${chrome.i18n.getMessage("button_cancel")}</button>
        </li>
      `;
    }
    html += "</ul>";
    if (!this.addUrlInput) {
      html += `<div class="mt-4">
        <a href="#" id="add-url-btn">${chrome.i18n.getMessage("button_add_new_url")}</a>
      </div>`;
    }
    html += `<div class="url-list-help">
      <a href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns" target="_blank">
        ${chrome.i18n.getMessage("link_learn_match_patterns")}
      </a>
    </div>`;
    container.innerHTML = html;
    this.setupUrlInputListeners();
  }
  async renderMuteCheckbox() {
    const settings = await utils.getCachedSettings();
    const checkbox = document.getElementById("mute-checkbox");
    if (checkbox) {
      checkbox.checked = settings.is_mute_sound_effects;
    }
  }
  async toggleSpacingMode() {
    const settings = await utils.getCachedSettings();
    const nextSpacingMode = settings.spacing_mode === "spacing_when_load" ? "spacing_when_click" : "spacing_when_load";
    await chrome.storage.sync.set({ spacing_mode: nextSpacingMode });
    await utils.playSound(nextSpacingMode === "spacing_when_load" ? "Shouryuuken" : "Hadouken");
    await this.renderSpacingMode();
  }
  async changeFilterMode() {
    const settings = await utils.getCachedSettings();
    const newFilterMode = settings.filter_mode === "blacklist" ? "whitelist" : "blacklist";
    await utils.playSound(newFilterMode === "blacklist" ? "Shouryuuken" : "Hadouken");
    chrome.storage.sync.set({ filter_mode: newFilterMode });
    await this.render();
  }
  startEditingUrl(index) {
    const settings = utils.getCachedSettings();
    settings.then(async (s) => {
      const urls = s[s.filter_mode];
      this.editingUrls.set(index, urls[index]);
      await this.renderUrlList();
      const input = document.querySelector(`input[data-index="${index}"]`);
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
  async saveEditingUrl(index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    if (!input) return;
    const newUrl = input.value.trim();
    if (!newUrl || !isValidMatchPattern(newUrl)) {
      alert(chrome.i18n.getMessage("error_invalid_match_pattern"));
      return;
    }
    const settings = await utils.getCachedSettings();
    const ruleKey = settings.filter_mode;
    const urls = [...settings[ruleKey]];
    urls[index] = newUrl;
    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);
    this.editingUrls.delete(index);
    await this.renderUrlList();
  }
  cancelEditingUrl(index) {
    this.editingUrls.delete(index);
    this.renderUrlList();
  }
  async removeUrl(index) {
    const settings = await utils.getCachedSettings();
    const ruleKey = settings.filter_mode;
    const urls = [...settings[ruleKey]];
    urls.splice(index, 1);
    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);
    await this.renderUrlList();
  }
  showAddUrlInput() {
    this.addUrlInput = document.createElement("input");
    this.renderUrlList();
  }
  setupUrlInputListeners() {
    const newUrlInput = document.getElementById("new-url-input");
    if (newUrlInput) {
      newUrlInput.focus();
      document.getElementById("save-new-url-btn")?.addEventListener("click", () => {
        this.saveNewUrl();
      });
      document.getElementById("cancel-new-url-btn")?.addEventListener("click", () => {
        this.cancelNewUrl();
      });
      newUrlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.saveNewUrl();
        }
      });
    }
  }
  async saveNewUrl() {
    const input = document.getElementById("new-url-input");
    if (!input) return;
    const newUrl = input.value.trim();
    if (!newUrl || !isValidMatchPattern(newUrl)) {
      alert(chrome.i18n.getMessage("error_invalid_match_pattern"));
      return;
    }
    const settings = await utils.getCachedSettings();
    const ruleKey = settings.filter_mode;
    const urls = [...settings[ruleKey], newUrl];
    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);
    this.addUrlInput = null;
    await this.renderUrlList();
  }
  cancelNewUrl() {
    this.addUrlInput = null;
    this.renderUrlList();
  }
  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new OptionsController();
});
