import { translatePage } from './i18n';
import { isValidMatchPattern } from './match-pattern';
import utils from './utils';

class OptionsController {
  private editingUrls: Map<number, string> = new Map();
  private addUrlInput: HTMLInputElement | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    translatePage();
    await this.render();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    chrome.storage.onChanged.addListener(async (_changes, areaName) => {
      if (areaName === 'sync') {
        await this.render();
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'spacing_mode_btn') {
        this.toggleSpacingMode().catch(console.error);
      } else if (target.id === 'filter_mode_btn') {
        this.toggleFilterMode().catch(console.error);
      } else if (target.classList.contains('remove-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.removeUrl(index);
      } else if (target.classList.contains('url-display-input')) {
        const index = parseInt(target.dataset.index || '0');
        this.startEditingUrl(index);
      } else if (target.classList.contains('save-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.saveEditingUrl(index);
      } else if (target.classList.contains('cancel-edit-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.cancelEditingUrl(index);
      } else if (target.id === 'add-url-btn') {
        this.showAddUrlInput();
      }
    });

    document.addEventListener('change', async (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'mute-checkbox') {
        const muteCheckbox = target as HTMLInputElement;
        chrome.storage.sync.set({ is_mute_sound_effects: muteCheckbox.checked });
      }
    });
  }

  private async render() {
    await this.renderSpacingMode();
    await this.renderFilterMode();
    await this.renderMuteCheckbox();
  }

  private async renderSpacingMode() {
    const settings = await utils.getCachedSettings();
    const button = document.getElementById('spacing_mode_btn') as HTMLButtonElement;
    button.textContent = chrome.i18n.getMessage(settings.spacing_mode);

    // Show/hide filter mode section
    const ruleSection = document.getElementById('filter_mode_section') as HTMLElement;
    const clickMessage = document.getElementById('spacing_when_click_msg') as HTMLElement;
    if (settings.spacing_mode === 'spacing_when_load') {
      ruleSection.style.display = 'block';
      clickMessage.style.display = 'none';
    } else {
      ruleSection.style.display = 'none';
      clickMessage.style.display = 'block';
    }
  }

  private async renderFilterMode() {
    const settings = await utils.getCachedSettings();
    const button = document.getElementById('filter_mode_btn') as HTMLButtonElement;
    button.textContent = chrome.i18n.getMessage(settings.filter_mode);

    await this.renderUrlList();
  }

  private async renderUrlList() {
    const settings = await utils.getCachedSettings();
    const container = document.getElementById('url-list-container') as HTMLDivElement;

    // Save templates before clearing
    const templates = container.querySelectorAll('template');
    const templateFragment = document.createDocumentFragment();
    for (const template of templates) {
      templateFragment.appendChild(template);
    }

    // Clear container
    container.innerHTML = '';

    // Restore templates
    container.appendChild(templateFragment);

    // Clone the url-list template
    const listTemplate = document.getElementById('url-list-template') as HTMLTemplateElement;
    const listFragment = listTemplate.content.cloneNode(true) as DocumentFragment;

    const urlList = listFragment.querySelector('#url-list') as HTMLUListElement;
    const addButton = listFragment.querySelector('#add-url-btn') as HTMLAnchorElement;
    const helpLink = listFragment.querySelector('#url-list-help a') as HTMLAnchorElement;

    // Set text content for localized elements
    addButton.textContent = chrome.i18n.getMessage('button_add_new_url');
    helpLink.textContent = chrome.i18n.getMessage('link_learn_match_patterns');

    // Render URL items
    const urls = settings[settings.filter_mode as 'blacklist' | 'whitelist'] || [];
    for (const [index, url] of urls.entries()) {
      const editingUrl = this.editingUrls.get(index);

      if (editingUrl !== undefined) {
        // Use edit template
        const editTemplate = document.getElementById('url-edit-template') as HTMLTemplateElement;
        const editItem = editTemplate.content.cloneNode(true) as DocumentFragment;

        const input = editItem.querySelector('.url-edit-input') as HTMLInputElement;
        const saveBtn = editItem.querySelector('.save-url-btn') as HTMLButtonElement;
        const cancelBtn = editItem.querySelector('.cancel-edit-btn') as HTMLButtonElement;

        input.value = editingUrl;
        input.setAttribute('data-index', index.toString());
        saveBtn.setAttribute('data-index', index.toString());
        saveBtn.textContent = chrome.i18n.getMessage('button_save');
        cancelBtn.setAttribute('data-index', index.toString());
        cancelBtn.textContent = chrome.i18n.getMessage('button_cancel');

        urlList.appendChild(editItem);
      } else {
        // Use display template
        const displayTemplate = document.getElementById('url-display-template') as HTMLTemplateElement;
        const displayItem = displayTemplate.content.cloneNode(true) as DocumentFragment;

        const input = displayItem.querySelector('.url-display-input') as HTMLInputElement;
        const removeBtn = displayItem.querySelector('.remove-url-btn') as HTMLButtonElement;

        input.value = url;
        input.setAttribute('data-index', index.toString());
        removeBtn.setAttribute('data-index', index.toString());
        removeBtn.textContent = chrome.i18n.getMessage('button_remove');

        urlList.appendChild(displayItem);
      }
    }

    // Add new URL input if shown
    if (this.addUrlInput) {
      const newTemplate = document.getElementById('url-new-template') as HTMLTemplateElement;
      const newItem = newTemplate.content.cloneNode(true) as DocumentFragment;

      const input = newItem.querySelector('#new-url-input') as HTMLInputElement;
      const saveBtn = newItem.querySelector('#save-new-url-btn') as HTMLButtonElement;
      const cancelBtn = newItem.querySelector('#cancel-new-url-btn') as HTMLButtonElement;

      input.placeholder = chrome.i18n.getMessage('placeholder_enter_url');
      saveBtn.textContent = chrome.i18n.getMessage('button_save');
      cancelBtn.textContent = chrome.i18n.getMessage('button_cancel');

      urlList.appendChild(newItem);
    }

    // Hide add button if showing new URL input
    if (this.addUrlInput && addButton.parentElement) {
      addButton.parentElement.style.display = 'none';
    }

    container.appendChild(listFragment);

    this.setupUrlInputListeners();
  }

  private async renderMuteCheckbox() {
    const settings = await utils.getCachedSettings();
    const checkbox = document.getElementById('mute-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = settings.is_mute_sound_effects;
    }
  }

  private async toggleSpacingMode() {
    const settings = await utils.getCachedSettings();
    const newSpacingMode = settings.spacing_mode === 'spacing_when_load' ? 'spacing_when_click' : 'spacing_when_load';
    await chrome.storage.sync.set({ spacing_mode: newSpacingMode });
    await this.renderSpacingMode();

    await utils.playSound(newSpacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken');
  }

  private async toggleFilterMode() {
    const settings = await utils.getCachedSettings();
    const newFilterMode = settings.filter_mode === 'blacklist' ? 'whitelist' : 'blacklist';
    await chrome.storage.sync.set({ filter_mode: newFilterMode });
    await this.renderFilterMode();

    await utils.playSound(newFilterMode === 'blacklist' ? 'Shouryuuken' : 'Hadouken');
  }

  private showAddUrlInput() {
    this.addUrlInput = document.createElement('input');
    this.renderUrlList();
  }

  private async saveNewUrl() {
    const input = document.getElementById('new-url-input') as HTMLInputElement;

    const newUrl = input.value.trim();
    if (!newUrl || !isValidMatchPattern(newUrl)) {
      alert(chrome.i18n.getMessage('error_invalid_match_pattern'));
      return;
    }

    const settings = await utils.getCachedSettings();
    const ruleKey = settings.filter_mode as 'blacklist' | 'whitelist';
    const urls = [...settings[ruleKey], newUrl];

    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);

    this.addUrlInput = null;
    await this.renderUrlList();
  }

  private cancelNewUrl() {
    this.addUrlInput = null;
    this.renderUrlList();
  }

  private async startEditingUrl(index: number) {
    const settings = await utils.getCachedSettings();
    const urls = settings[settings.filter_mode as 'blacklist' | 'whitelist'];
    this.editingUrls.set(index, urls[index]);
    await this.renderUrlList();

    // Focus on the input
    const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }

  private async saveEditingUrl(index: number) {
    const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
    if (!input) {
      return;
    }

    const newUrl = input.value.trim();
    if (!newUrl || !isValidMatchPattern(newUrl)) {
      alert(chrome.i18n.getMessage('error_invalid_match_pattern'));
      return;
    }

    const settings = await utils.getCachedSettings();
    const ruleKey = settings.filter_mode as 'blacklist' | 'whitelist';
    const urls = [...settings[ruleKey]];
    urls[index] = newUrl;

    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);

    this.editingUrls.delete(index);
    await this.renderUrlList();
  }

  private cancelEditingUrl(index: number) {
    this.editingUrls.delete(index);
    this.renderUrlList();
  }

  private async removeUrl(index: number) {
    const settings = await utils.getCachedSettings();
    const ruleKey = settings.filter_mode as 'blacklist' | 'whitelist';
    const urls = [...settings[ruleKey]];
    urls.splice(index, 1);

    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);
    await this.renderUrlList();
  }

  private setupUrlInputListeners() {
    const newUrlInput = document.getElementById('new-url-input') as HTMLInputElement;
    if (newUrlInput) {
      newUrlInput.focus();

      document.getElementById('save-new-url-btn')?.addEventListener('click', () => {
        this.saveNewUrl();
      });

      document.getElementById('cancel-new-url-btn')?.addEventListener('click', () => {
        this.cancelNewUrl();
      });

      newUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveNewUrl();
        }
      });
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
