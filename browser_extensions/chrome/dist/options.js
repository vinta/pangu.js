import { t as translatePage, p as playSound } from "./assets/sounds-CFP6Stg4.js";
import { g as getCachedSettings, D as DEFAULT_SETTINGS } from "./assets/settings-Db_f-qL2.js";
function isValidMatchPattern(pattern) {
  if (!pattern.match(/^(https?:\/\/|file:\/\/\/|\*:\/\/)/)) {
    return false;
  }
  try {
    new URLPattern(pattern);
    return true;
  } catch {
    return false;
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
        this.toggleFilterMode().catch(console.error);
      } else if (target.classList.contains("url-display-input")) {
        const index = parseInt(target.dataset.index || "0");
        this.startEditingUrl(index);
      } else if (target.classList.contains("remove-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.removeUrl(index);
      } else if (target.classList.contains("save-edit-url-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.saveEditingUrl(index);
      } else if (target.classList.contains("cancel-edit-btn")) {
        const index = parseInt(target.dataset.index || "0");
        this.cancelEditingUrl(index);
      } else if (target.id === "add-url-btn") {
        this.showAddUrlInput();
      } else if (target.id === "restore-defaults-btn") {
        this.restoreDefaults();
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
  setupNewUrlInputListeners() {
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
  async render() {
    await this.renderSpacingMode();
    await this.renderFilterMode();
    await this.renderMuteCheckbox();
  }
  async renderSpacingMode() {
    const settings = await getCachedSettings();
    const button = document.getElementById("spacing_mode_btn");
    button.textContent = chrome.i18n.getMessage(settings.spacing_mode);
    const ruleSection = document.getElementById("filter_mode_section");
    const clickMessage = document.getElementById("spacing_when_click_msg");
    if (settings.spacing_mode === "spacing_when_load") {
      ruleSection.style.display = "block";
      clickMessage.style.display = "none";
    } else {
      ruleSection.style.display = "none";
      clickMessage.style.display = "block";
    }
  }
  async renderFilterMode() {
    const settings = await getCachedSettings();
    const button = document.getElementById("filter_mode_btn");
    button.textContent = chrome.i18n.getMessage(settings.filter_mode);
    await this.renderUrlList();
  }
  async renderUrlList() {
    const settings = await getCachedSettings();
    const container = document.getElementById("url-list-container");
    const templates = container.querySelectorAll("template");
    const templateFragment = document.createDocumentFragment();
    for (const template of templates) {
      templateFragment.appendChild(template);
    }
    container.innerHTML = "";
    container.appendChild(templateFragment);
    const listTemplate = document.getElementById("url-list-template");
    const listFragment = listTemplate.content.cloneNode(true);
    const urlList = listFragment.querySelector("#url-list");
    const addButton = listFragment.querySelector("#add-url-btn");
    const restoreButton = listFragment.querySelector("#restore-defaults-btn");
    const helpLink = listFragment.querySelector("#url-list-help a");
    addButton.textContent = chrome.i18n.getMessage("button_add_new_url");
    restoreButton.textContent = chrome.i18n.getMessage("button_restore_defaults");
    helpLink.textContent = chrome.i18n.getMessage("link_learn_match_patterns");
    const urls = settings[settings.filter_mode] || [];
    if (urls.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "empty-list-message";
      emptyItem.textContent = chrome.i18n.getMessage("empty_list");
      urlList.appendChild(emptyItem);
    }
    for (const [index, url] of urls.entries()) {
      const editingUrl = this.editingUrls.get(index);
      if (editingUrl !== void 0) {
        const editTemplate = document.getElementById("url-edit-template");
        const editItem = editTemplate.content.cloneNode(true);
        const input = editItem.querySelector(".url-edit-input");
        const saveBtn = editItem.querySelector(".save-edit-url-btn");
        const cancelBtn = editItem.querySelector(".cancel-edit-btn");
        input.value = editingUrl;
        input.setAttribute("data-index", index.toString());
        saveBtn.setAttribute("data-index", index.toString());
        saveBtn.textContent = chrome.i18n.getMessage("button_save");
        cancelBtn.setAttribute("data-index", index.toString());
        cancelBtn.textContent = chrome.i18n.getMessage("button_cancel");
        urlList.appendChild(editItem);
      } else {
        const displayTemplate = document.getElementById("url-display-template");
        const displayItem = displayTemplate.content.cloneNode(true);
        const input = displayItem.querySelector(".url-display-input");
        const removeBtn = displayItem.querySelector(".remove-url-btn");
        input.value = url;
        input.setAttribute("data-index", index.toString());
        removeBtn.setAttribute("data-index", index.toString());
        removeBtn.textContent = chrome.i18n.getMessage("button_remove");
        urlList.appendChild(displayItem);
      }
    }
    if (this.addUrlInput) {
      const newTemplate = document.getElementById("url-new-template");
      const newItem = newTemplate.content.cloneNode(true);
      const input = newItem.querySelector("#new-url-input");
      const saveBtn = newItem.querySelector("#save-new-url-btn");
      const cancelBtn = newItem.querySelector("#cancel-new-url-btn");
      input.placeholder = chrome.i18n.getMessage("placeholder_enter_url");
      saveBtn.textContent = chrome.i18n.getMessage("button_save");
      cancelBtn.textContent = chrome.i18n.getMessage("button_cancel");
      urlList.appendChild(newItem);
    }
    if (this.addUrlInput && addButton.parentElement) {
      addButton.parentElement.style.display = "none";
    }
    container.appendChild(listFragment);
    this.setupNewUrlInputListeners();
  }
  async renderMuteCheckbox() {
    const settings = await getCachedSettings();
    const checkbox = document.getElementById("mute-checkbox");
    if (checkbox) {
      checkbox.checked = settings.is_mute_sound_effects;
    }
  }
  async toggleSpacingMode() {
    const settings = await getCachedSettings();
    const newSpacingMode = settings.spacing_mode === "spacing_when_load" ? "spacing_when_click" : "spacing_when_load";
    await chrome.storage.sync.set({ spacing_mode: newSpacingMode });
    await this.renderSpacingMode();
    await playSound(newSpacingMode === "spacing_when_load" ? "Shouryuuken" : "Hadouken");
  }
  async toggleFilterMode() {
    const settings = await getCachedSettings();
    const newFilterMode = settings.filter_mode === "blacklist" ? "whitelist" : "blacklist";
    await chrome.storage.sync.set({ filter_mode: newFilterMode });
    await this.renderFilterMode();
    await playSound(newFilterMode === "blacklist" ? "Shouryuuken" : "Hadouken");
  }
  showAddUrlInput() {
    this.addUrlInput = document.createElement("input");
    this.renderUrlList();
  }
  async saveNewUrl() {
    const input = document.getElementById("new-url-input");
    const newUrl = input.value.trim();
    if (!newUrl || !isValidMatchPattern(newUrl)) {
      alert(chrome.i18n.getMessage("error_invalid_match_pattern"));
      return;
    }
    const settings = await getCachedSettings();
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
  async startEditingUrl(index) {
    const settings = await getCachedSettings();
    const urls = settings[settings.filter_mode];
    this.editingUrls.set(index, urls[index]);
    await this.renderUrlList();
    const input = document.querySelector(`input[data-index="${index}"]`);
    if (input) {
      input.focus();
      input.select();
    }
  }
  async saveEditingUrl(index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    if (!input) {
      return;
    }
    const newUrl = input.value.trim();
    if (!newUrl || !isValidMatchPattern(newUrl)) {
      alert(chrome.i18n.getMessage("error_invalid_match_pattern"));
      return;
    }
    const settings = await getCachedSettings();
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
    const settings = await getCachedSettings();
    const ruleKey = settings.filter_mode;
    const urls = [...settings[ruleKey]];
    urls.splice(index, 1);
    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);
    await this.renderUrlList();
  }
  async restoreDefaults() {
    if (confirm(chrome.i18n.getMessage("confirm_restore_defaults"))) {
      const settings = await getCachedSettings();
      const filterMode = settings.filter_mode;
      const defaultValue = DEFAULT_SETTINGS[filterMode];
      await chrome.storage.sync.set({
        [filterMode]: defaultValue
      });
      await this.renderUrlList();
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new OptionsController();
});
