import { translatePage } from './i18n';
import type { Settings } from './types';
import utils, { DEFAULT_SETTINGS } from './utils';
import { isValidMatchPattern } from './match-pattern';

class OptionsController {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private editingUrls: Map<number, string> = new Map();
  private addUrlInput: HTMLInputElement | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.settings = (await chrome.storage.sync.get(this.settings)) as Settings;

    translatePage();
    this.render();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'spacing_mode_btn') {
        this.changeSpacingMode().catch(console.error);
      } else if (target.id === 'filter_mode_btn') {
        this.changeFilterMode().catch(console.error);
      } else if (target.classList.contains('remove-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.removeUrl(index);
      } else if (target.classList.contains('edit-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.startEditingUrl(index);
      } else if (target.classList.contains('save-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.saveEditingUrl(index).catch(console.error);
      } else if (target.classList.contains('cancel-edit-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.cancelEditingUrl(index);
      } else if (target.id === 'add-url-btn') {
        this.showAddUrlInput();
      } else if (target.id === 'save-new-url-btn') {
        this.addNewUrl().catch(console.error);
      } else if (target.id === 'cancel-new-url-btn') {
        this.hideAddUrlInput();
      }
    });

    const muteCheckbox = document.getElementById('mute-checkbox') as HTMLInputElement;
    if (muteCheckbox) {
      muteCheckbox.addEventListener('change', () => {
        this.settings.is_mute_sound_effects = muteCheckbox.checked;
        chrome.storage.sync.set({ is_mute_sound_effects: muteCheckbox.checked });
      });
    }
  }

  private render(): void {
    this.renderSpacingMode();
    this.renderFilterMode();
    this.renderUrlList();
    this.renderMuteCheckbox();
  }

  private renderSpacingMode(): void {
    const button = document.getElementById('spacing_mode_btn') as HTMLButtonElement;
    if (button) {
      // Show "auto_spacing_mode" text when in auto mode, otherwise show manual mode text
      const i18nKey = this.settings.spacing_mode === 'spacing_when_load' ? 'auto_spacing_mode' : 'manual_spacing_mode';
      button.textContent = chrome.i18n.getMessage(i18nKey);
    }

    // Show/hide filter mode section
    const ruleSection = document.querySelector('.filter_mode_group') as HTMLElement;
    const clickMessage = document.getElementById('spacing_when_click_msg') as HTMLElement;

    if (this.settings.spacing_mode === 'spacing_when_load') {
      ruleSection?.style.setProperty('display', 'block');
      clickMessage?.style.setProperty('display', 'none');
    } else {
      ruleSection?.style.setProperty('display', 'none');
      clickMessage?.style.setProperty('display', 'block');
    }
  }

  private renderFilterMode(): void {
    const button = document.getElementById('filter_mode_btn') as HTMLButtonElement;
    if (button) {
      button.textContent = chrome.i18n.getMessage(this.settings.filter_mode);
    }
  }

  private renderUrlList(): void {
    const container = document.getElementById('url-list-container');
    if (!container) return;

    // Get URLs from the current rule, ensure it's always an array
    const urls = this.settings[this.settings.filter_mode as 'blacklist' | 'whitelist'] || [];

    let html = '<ul class="filter_mode_list">';

    for (const [index, url] of urls.entries()) {
      if (this.editingUrls.has(index)) {
        html += `
          <li class="animate-repeat">
            <input type="text" class="url-edit-input" value="${this.escapeHtml(this.editingUrls.get(index) || url)}" data-index="${index}" />
            <button class="btn btn-sm save-url-btn" data-index="${index}">${chrome.i18n.getMessage('button_save')}</button>
            <button class="btn btn-sm btn-ghost cancel-edit-btn" data-index="${index}">${chrome.i18n.getMessage('button_cancel')}</button>
          </li>
        `;
      } else {
        html += `
          <li class="animate-repeat">
            <a href="#" class="gradientEllipsis edit-url-btn" data-index="${index}" title="${this.escapeHtml(url)}">${this.escapeHtml(url)}</a>
            <button class="btn btn-sm btn-ghost remove-url-btn" data-index="${index}">${chrome.i18n.getMessage('button_remove')}</button>
          </li>
        `;
      }
    }

    // Add new URL input
    if (this.addUrlInput) {
      html += `
        <li>
          <input type="text" class="url-edit-input" id="new-url-input" placeholder="${chrome.i18n.getMessage('placeholder_enter_url')}" />
          <button class="btn btn-sm save-url-btn" id="save-new-url-btn">${chrome.i18n.getMessage('button_save')}</button>
          <button class="btn btn-sm btn-ghost cancel-edit-btn" id="cancel-new-url-btn">${chrome.i18n.getMessage('button_cancel')}</button>
        </li>
      `;
    } else {
      html += `
        <li>
          <a href="#" id="add-url-btn">${chrome.i18n.getMessage('button_add_new_url')}</a>
        </li>
      `;
    }

    html += '</ul>';

    // Add help link for match patterns
    html += `
      <div class="url-list-help">
        <small class="text-muted">
          <a href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns" target="_blank" rel="noopener">
            ${chrome.i18n.getMessage('link_learn_match_patterns')}
          </a>
        </small>
      </div>
    `;

    container.innerHTML = html;

    // Focus on input if adding new URL
    if (this.addUrlInput) {
      const input = document.getElementById('new-url-input') as HTMLInputElement;
      input?.focus();
    }
  }

  private renderMuteCheckbox(): void {
    const checkbox = document.getElementById('mute-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = this.settings.is_mute_sound_effects;
    }
  }

  private async changeSpacingMode(): Promise<void> {
    // Toggle between auto and manual mode
    const isCurrentlyAutoMode = this.settings.spacing_mode === 'spacing_when_load';
    const newIsAutoMode = !isCurrentlyAutoMode;

    // Use shared toggle function
    await utils.toggleAutoSpacing(newIsAutoMode);
    await utils.playSound(newIsAutoMode ? 'Shouryuuken' : 'Hadouken');

    // Update local settings
    this.settings.spacing_mode = newIsAutoMode ? 'spacing_when_load' : 'spacing_when_click';

    // Re-render UI
    this.render();
  }

  private async changeFilterMode(): Promise<void> {
    // Toggle between new rules (blacklist/whitelist)
    this.settings.filter_mode = this.settings.filter_mode === 'blacklist' ? 'whitelist' : 'blacklist';
    await utils.playSound(this.settings.filter_mode === 'blacklist' ? 'Shouryuuken' : 'Hadouken');

    chrome.storage.sync.set({ filter_mode: this.settings.filter_mode });
    this.render();
  }

  private startEditingUrl(index: number): void {
    const urls = this.settings[this.settings.filter_mode as 'blacklist' | 'whitelist'];
    this.editingUrls.set(index, urls[index]);
    this.renderUrlList();

    // Focus on the input
    setTimeout(() => {
      const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  private async saveEditingUrl(index: number): Promise<void> {
    const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
    const newUrl = input?.value.trim();

    if (this.isValidMatchPattern(newUrl)) {
      await utils.playSound('YeahBaby');

      const ruleKey = this.settings.filter_mode as 'blacklist' | 'whitelist';
      this.settings[ruleKey][index] = newUrl;
      const update: Partial<Settings> = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      chrome.storage.sync.set(update);

      this.editingUrls.delete(index);
      this.renderUrlList();
    } else {
      await utils.playSound('WahWahWaaah');
      alert(chrome.i18n.getMessage('error_invalid_match_pattern'));
    }
  }

  private cancelEditingUrl(index: number): void {
    this.editingUrls.delete(index);
    this.renderUrlList();
  }

  private removeUrl(index: number): void {
    const ruleKey = this.settings.filter_mode as 'blacklist' | 'whitelist';
    this.settings[ruleKey].splice(index, 1);
    const update: Partial<Settings> = {};
    update[ruleKey] = [...this.settings[ruleKey]];
    chrome.storage.sync.set(update);

    this.renderUrlList();
  }

  private showAddUrlInput(): void {
    this.addUrlInput = document.createElement('input');
    this.renderUrlList();
  }

  private hideAddUrlInput(): void {
    this.addUrlInput = null;
    this.renderUrlList();
  }

  private async addNewUrl(): Promise<void> {
    const input = document.getElementById('new-url-input') as HTMLInputElement;
    const newUrl = input?.value.trim();

    if (this.isValidMatchPattern(newUrl)) {
      await utils.playSound('YeahBaby');

      const ruleKey = this.settings.filter_mode as 'blacklist' | 'whitelist';
      this.settings[ruleKey].push(newUrl);
      const update: Partial<Settings> = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      chrome.storage.sync.set(update);

      this.addUrlInput = null;
      this.renderUrlList();
    } else {
      await utils.playSound('WahWahWaaah');
      alert(chrome.i18n.getMessage('error_invalid_match_pattern'));
    }
  }

  private isValidMatchPattern(pattern: string): boolean {
    return isValidMatchPattern(pattern);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
