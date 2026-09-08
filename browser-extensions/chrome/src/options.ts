import { downloadModel, getModelAvailability, isModelSupported } from './ai-spacing/models';
import { DEFAULT_SETTINGS, getSettings, onSettingsChanged, updateSettings } from './settings/storage';
import { isValidMatchPattern } from './settings/urls';
import { translatePage } from './ui/i18n';
import { playSound } from './ui/sounds';

// Builds a Partial<Settings> for the list picked by filter mode without a computed-key cast
function listPatch(key: 'blacklist' | 'whitelist', urls: string[]) {
  return key === 'blacklist' ? { blacklist: urls } : { whitelist: urls };
}

class OptionsController {
  private editingUrls = new Map<number, string>();
  private statusPollTimer: number | undefined;
  private isAddingUrl = false;

  constructor() {
    void this.initialize();
  }

  private async initialize() {
    translatePage();
    // Subscribe before the first render, so a change landing mid-render still triggers a repaint instead of leaving a section stale
    this.setupEventListeners();
    await this.render();
  }

  private setupEventListeners() {
    // Every render below is driven by this subscription, so writes never re-render inline: the onChanged echo of each write lands here
    onSettingsChanged((changedKeys) => {
      // Only re-render the parts that actually changed
      if (changedKeys.includes('spacing_mode')) {
        this.renderSpacingMode().catch(console.error);
      }

      if (changedKeys.includes('filter_mode') || changedKeys.includes('blacklist') || changedKeys.includes('whitelist')) {
        this.renderFilterMode().catch(console.error);
      }

      if (changedKeys.includes('is_mute_sound_effects')) {
        this.renderMuteCheckbox().catch(console.error);
      }

      if (changedKeys.includes('is_enable_text_autospace')) {
        this.renderTextAutospaceCheckbox().catch(console.error);
      }

      if (changedKeys.includes('is_enable_ai_spacing')) {
        this.renderAiSpacingCheckbox().catch(console.error);
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'spacing_mode_btn') {
        this.toggleSpacingMode().catch(console.error);
      } else if (target.id === 'filter_mode_btn') {
        this.toggleFilterMode().catch(console.error);
      } else if (target.classList.contains('url-display-input')) {
        const index = parseInt(target.dataset.index || '0');
        void this.startEditingUrl(index);
      } else if (target.classList.contains('remove-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        void this.removeUrl(index);
      } else if (target.classList.contains('save-edit-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        void this.saveEditingUrl(index);
      } else if (target.id === 'save-new-url-btn') {
        void this.saveNewUrl();
      } else if (target.id === 'cancel-new-url-btn') {
        this.cancelNewUrl();
      } else if (target.classList.contains('cancel-edit-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.cancelEditingUrl(index);
      } else if (target.id === 'add-url-btn') {
        this.showAddUrlInput();
      } else if (target.id === 'restore-defaults-btn') {
        void this.handleRestoreListDefaults();
      } else if (target.id === 'ai-model-download-btn') {
        this.handleModelDownload().catch(console.error);
      }
    });

    document.addEventListener('keypress', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'new-url-input' && e.key === 'Enter') {
        void this.saveNewUrl();
      }
    });

    document.addEventListener('change', async (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'mute-checkbox') {
        const muteCheckbox = target as HTMLInputElement;
        try {
          await updateSettings({ is_mute_sound_effects: muteCheckbox.checked });
        } catch (error) {
          // The checkbox already flipped visually: repaint it from confirmed settings
          console.error('Failed to save settings:', error);
          await this.renderMuteCheckbox();
        }
      } else if (target.id === 'text-autospace-checkbox') {
        const textAutospaceCheckbox = target as HTMLInputElement;
        try {
          await updateSettings({ is_enable_text_autospace: textAutospaceCheckbox.checked });
        } catch (error) {
          console.error('Failed to save settings:', error);
          await this.renderTextAutospaceCheckbox();
        }
      } else if (target.id === 'ai-spacing-checkbox') {
        const aiSpacingCheckbox = target as HTMLInputElement;
        try {
          await updateSettings({ is_enable_ai_spacing: aiSpacingCheckbox.checked });
        } catch (error) {
          console.error('Failed to save settings:', error);
          await this.renderAiSpacingCheckbox();
        }
      }
    });
  }

  private async render() {
    await this.renderSpacingMode();
    await this.renderFilterMode();
    await this.renderMuteCheckbox();
    await this.renderTextAutospaceCheckbox();
    await this.renderAiSpacingCheckbox();
    // Last, because it is the only render that waits on something outside storage
    await this.renderAiModelStatus();
  }

  private async renderSpacingMode() {
    const current = await getSettings();
    const button = document.getElementById('spacing_mode_btn') as HTMLButtonElement;
    button.textContent = chrome.i18n.getMessage(current.spacing_mode);

    const ruleSection = document.getElementById('filter_mode_section') as HTMLElement;
    const clickMessage = document.getElementById('spacing_when_click_msg') as HTMLElement;
    if (current.spacing_mode === 'spacing_when_load') {
      ruleSection.style.display = 'block';
      clickMessage.style.display = 'none';
    } else {
      ruleSection.style.display = 'none';
      clickMessage.style.display = 'block';
    }
  }

  private async renderFilterMode() {
    const current = await getSettings();
    const button = document.getElementById('filter_mode_btn') as HTMLButtonElement;
    button.textContent = chrome.i18n.getMessage(current.filter_mode);

    await this.renderUrlList();
  }

  private async renderUrlList() {
    const settings = await getSettings();
    const urls = settings[settings.filter_mode];
    const container = document.getElementById('url-list-container') as HTMLDivElement;

    const listTemplate = document.getElementById('url-list-template') as HTMLTemplateElement;
    const listFragment = listTemplate.content.cloneNode(true) as DocumentFragment;

    const urlList = listFragment.querySelector('#url-list') as HTMLUListElement;
    const addButton = listFragment.querySelector('#add-url-btn') as HTMLAnchorElement;
    const restoreButton = listFragment.querySelector('#restore-defaults-btn') as HTMLAnchorElement;
    const helpLink = listFragment.querySelector('#url-list-help a') as HTMLAnchorElement;

    addButton.textContent = chrome.i18n.getMessage('button_add_new_url');
    restoreButton.textContent = chrome.i18n.getMessage('button_restore_defaults');
    helpLink.textContent = chrome.i18n.getMessage('link_learn_match_patterns');

    if (urls.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-list-message';
      emptyItem.textContent = chrome.i18n.getMessage('empty_list');
      urlList.appendChild(emptyItem);
    }

    for (const [index, url] of urls.entries()) {
      const editingUrl = this.editingUrls.get(index);

      if (editingUrl !== undefined) {
        const editTemplate = document.getElementById('url-edit-template') as HTMLTemplateElement;
        const editItem = editTemplate.content.cloneNode(true) as DocumentFragment;

        const input = editItem.querySelector('.url-edit-input') as HTMLInputElement;
        const saveBtn = editItem.querySelector('.save-edit-url-btn') as HTMLButtonElement;
        const cancelBtn = editItem.querySelector('.cancel-edit-btn') as HTMLButtonElement;

        input.value = editingUrl;
        input.setAttribute('data-index', index.toString());
        saveBtn.setAttribute('data-index', index.toString());
        saveBtn.textContent = chrome.i18n.getMessage('button_save');
        cancelBtn.setAttribute('data-index', index.toString());
        cancelBtn.textContent = chrome.i18n.getMessage('button_cancel');

        urlList.appendChild(editItem);
      } else {
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

    if (this.isAddingUrl) {
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

    if (this.isAddingUrl && addButton.parentElement) {
      addButton.parentElement.style.display = 'none';
    }

    container.replaceChildren(listFragment);

    document.getElementById('new-url-input')?.focus();
  }

  private async renderMuteCheckbox() {
    const current = await getSettings();
    const checkbox = document.getElementById('mute-checkbox') as HTMLInputElement;
    checkbox.checked = current.is_mute_sound_effects;
  }

  private async renderTextAutospaceCheckbox() {
    const current = await getSettings();
    const checkbox = document.getElementById('text-autospace-checkbox') as HTMLInputElement;
    const isSupported = CSS.supports('text-autospace', 'normal');

    // Display-only off when unsupported: never write back, the synced setting still applies on other devices
    checkbox.checked = isSupported && current.is_enable_text_autospace;
    checkbox.disabled = !isSupported;
    checkbox.closest('.toggle')?.classList.toggle('toggle-disabled', !isSupported);
    const notSupportedMessage = document.getElementById('text-autospace-not-supported-msg') as HTMLElement;
    notSupportedMessage.style.display = isSupported ? 'none' : 'block';
  }

  private async renderAiSpacingCheckbox() {
    const current = await getSettings();
    const checkbox = document.getElementById('ai-spacing-checkbox') as HTMLInputElement;
    const isSupported = await isModelSupported();

    // Display-only off when the model can never run here: never write back, the synced setting still applies on other devices
    checkbox.checked = isSupported && current.is_enable_ai_spacing;
    checkbox.disabled = !isSupported;
    checkbox.closest('.toggle')?.classList.toggle('toggle-disabled', !isSupported);
  }

  // The model's state is browser-wide and independent of the toggle: the setting can be on while the model is still absent, and then the page just keeps the rules output
  private async renderAiModelStatus() {
    const statusText = document.getElementById('ai-model-status') as HTMLElement;
    const downloadButton = document.getElementById('ai-model-download-btn') as HTMLButtonElement;

    const availability = await getModelAvailability();
    // Only an absent model can be fetched, and a multi-gigabyte download is the user's call
    downloadButton.style.display = availability === 'downloadable' ? 'block' : 'none';
    statusText.textContent = chrome.i18n.getMessage(`ai_model_${availability}`);
    // A download Chrome started itself ends without any event for us (a create() joined to it reported no progress and then rejected), so we poll until the state moves
    clearTimeout(this.statusPollTimer);
    if (availability === 'downloading') {
      this.statusPollTimer = window.setTimeout(() => this.renderAiModelStatus().catch(console.error), 5000);
    }
  }

  private async handleModelDownload() {
    const statusText = document.getElementById('ai-model-status') as HTMLElement;
    const downloadButton = document.getElementById('ai-model-download-btn') as HTMLButtonElement;
    downloadButton.disabled = true;
    // downloadModel() resolves only after the whole download, so the status line switches now rather than at the re-render below
    statusText.textContent = chrome.i18n.getMessage('ai_model_downloading');
    try {
      await downloadModel();
    } finally {
      downloadButton.disabled = false;
      await this.renderAiModelStatus();
    }
  }

  private async toggleSpacingMode() {
    const current = await getSettings();
    const newSpacingMode = current.spacing_mode === 'spacing_when_load' ? 'spacing_when_click' : 'spacing_when_load';
    await updateSettings({ spacing_mode: newSpacingMode });

    await playSound(newSpacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken');
  }

  private async toggleFilterMode() {
    const current = await getSettings();
    const newFilterMode = current.filter_mode === 'blacklist' ? 'whitelist' : 'blacklist';
    await updateSettings({ filter_mode: newFilterMode });

    await playSound(newFilterMode === 'blacklist' ? 'Shouryuuken' : 'Hadouken');
  }

  private showAddUrlInput() {
    this.isAddingUrl = true;
    void this.renderUrlList();
  }

  private async saveNewUrl() {
    const input = document.getElementById('new-url-input') as HTMLInputElement;
    const newUrl = input.value.trim();

    // Optimistically close the input: on 'added' the subscription re-renders with it already gone, so the list paints exactly once
    this.isAddingUrl = false;
    let outcome: 'added' | 'duplicate' | 'invalid';
    try {
      outcome = newUrl ? await this.addToActiveList(newUrl) : 'invalid';
    } catch (error) {
      console.error('Failed to save URL:', error);
      this.isAddingUrl = true;
      return;
    }

    if (outcome === 'invalid') {
      this.isAddingUrl = true;
      alert(chrome.i18n.getMessage('error_invalid_match_pattern'));
      return;
    }

    if (outcome === 'duplicate') {
      // The entry is already visible in the list, so just close the input
      await this.renderUrlList();
    }
  }

  private cancelNewUrl() {
    this.isAddingUrl = false;
    void this.renderUrlList();
  }

  private async startEditingUrl(index: number) {
    const settings = await getSettings();
    this.editingUrls.set(index, settings[settings.filter_mode][index]!);
    await this.renderUrlList();

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

    // Optimistically leave edit mode: on 'saved' the subscription re-renders with the row already back in display state
    this.editingUrls.delete(index);
    let outcome: 'saved' | 'invalid';
    try {
      outcome = newUrl ? await this.editActiveList(index, newUrl) : 'invalid';
    } catch (error) {
      console.error('Failed to save URL:', error);
      this.editingUrls.set(index, newUrl);
      return;
    }

    if (outcome === 'invalid') {
      this.editingUrls.set(index, newUrl);
      alert(chrome.i18n.getMessage('error_invalid_match_pattern'));
    }
  }

  private cancelEditingUrl(index: number) {
    this.editingUrls.delete(index);
    void this.renderUrlList();
  }

  private async removeUrl(index: number) {
    try {
      await this.removeFromActiveList(index);
    } catch (error) {
      console.error('Failed to remove URL:', error);
    }
  }

  private async handleRestoreListDefaults() {
    if (confirm(chrome.i18n.getMessage('confirm_restore_defaults'))) {
      try {
        // Restore only the current filter mode list to its default value
        await this.restoreActiveListDefaults();
      } catch (error) {
        console.error('Failed to restore defaults:', error);
      }
    }
  }

  private async addToActiveList(pattern: string) {
    if (!isValidMatchPattern(pattern)) {
      return 'invalid' as const;
    }
    const settings = await getSettings();
    const key = settings.filter_mode;
    if (settings[key].includes(pattern)) {
      return 'duplicate' as const;
    }
    await updateSettings(listPatch(key, [...settings[key], pattern]));
    return 'added' as const;
  }

  private async editActiveList(index: number, pattern: string) {
    if (!isValidMatchPattern(pattern)) {
      return 'invalid' as const;
    }
    const settings = await getSettings();
    const key = settings.filter_mode;
    if (index < 0 || index >= settings[key].length) {
      return 'invalid' as const;
    }
    const urls = [...settings[key]];
    urls[index] = pattern;
    await updateSettings(listPatch(key, urls));
    return 'saved' as const;
  }

  private async removeFromActiveList(index: number) {
    const settings = await getSettings();
    const key = settings.filter_mode;
    if (index < 0 || index >= settings[key].length) {
      return;
    }
    const urls = [...settings[key]];
    urls.splice(index, 1);
    await updateSettings(listPatch(key, urls));
  }

  private async restoreActiveListDefaults() {
    const settings = await getSettings();
    const key = settings.filter_mode;
    await updateSettings(listPatch(key, [...DEFAULT_SETTINGS[key]]));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
