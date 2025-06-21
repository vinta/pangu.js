import type { Settings } from './types';
import { translatePage } from './i18n';
import utils, { DEFAULT_SETTINGS } from './utils';

class OptionsController {
  private settings: Settings = { ...DEFAULT_SETTINGS };

  private editingUrls: Map<number, string> = new Map();
  private addUrlInput: HTMLInputElement | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Translate page
    translatePage();

    // Set i18n text for dynamic elements
    this.setI18nText();

    // Load settings
    await this.loadSettings();

    // Set up event listeners
    this.setupEventListeners();

    // Initial render
    this.render();
  }

  private setI18nText(): void {
    const elements = {
      page_title: chrome.i18n.getMessage('extension_name'),
      header_title: chrome.i18n.getMessage('extension_name'),
      subtitle: chrome.i18n.getMessage('subtitle'),
      quote: chrome.i18n.getMessage('quote'),
      label_spacing_mode: chrome.i18n.getMessage('label_spacing_mode'),
      label_filter_mode: chrome.i18n.getMessage('label_filter_mode'),
      label_other_options: '其他：',
      spacing_when_click_msg: chrome.i18n.getMessage('spacing_when_click_msg'),
    };

    for (const [id, text] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    }

    // Set page title
    document.title = chrome.i18n.getMessage('extension_name');

    // Set mute label
    const muteLabel = document.getElementById('label_is_mute');
    if (muteLabel) {
      muteLabel.textContent = chrome.i18n.getMessage('label_is_mute');
    }
  }

  private async loadSettings(): Promise<void> {
    // Load settings directly from chrome.storage instead of messaging
    // chrome.storage.sync.get with defaults will return merged values
    this.settings = (await chrome.storage.sync.get(this.settings)) as Settings;
  }


  private setupEventListeners(): void {
    // Spacing mode button
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

    // Mute checkbox
    const muteCheckbox = document.getElementById('mute-checkbox') as HTMLInputElement;
    if (muteCheckbox) {
      muteCheckbox.addEventListener('change', () => {
        this.settings.is_mute_sound_effects = muteCheckbox.checked;
        this.saveSettings({ is_mute_sound_effects: muteCheckbox.checked });
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

    // Add new URL input
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

    html += '</ul>';

    // Add help link for match patterns
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

    this.saveSettings({ filter_mode: this.settings.filter_mode });
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

    if (this.isValidUrl(newUrl)) {
      await utils.playSound('YeahBaby');

      const ruleKey = this.settings.filter_mode as 'blacklist' | 'whitelist';
      this.settings[ruleKey][index] = newUrl;
      const update: Partial<Settings> = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      this.saveSettings(update);

      this.editingUrls.delete(index);
      this.renderUrlList();
    } else {
      await utils.playSound('WahWahWaaah');
      alert('Invalid match pattern. Format: <scheme>://<host><path>\nExample: *://example.com/*');
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
    this.saveSettings(update);

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

    if (this.isValidUrl(newUrl)) {
      await utils.playSound('YeahBaby');

      const ruleKey = this.settings.filter_mode as 'blacklist' | 'whitelist';
      this.settings[ruleKey].push(newUrl);
      const update: Partial<Settings> = {};
      update[ruleKey] = [...this.settings[ruleKey]];
      this.saveSettings(update);

      this.addUrlInput = null;
      this.renderUrlList();
    } else {
      await utils.playSound('WahWahWaaah');
      alert('Invalid match pattern. Format: <scheme>://<host><path>\nExample: *://example.com/*');
    }
  }

  private isValidUrl(url: string): boolean {
    return this.isValidMatchPattern(url);
  }

  private isValidMatchPattern(pattern: string): boolean {
    // Basic match pattern validation
    // Format: <scheme>://<host><path>
    const matchPatternRegex = /^(\*|https?|file|ftp):\/\/(\*|\*\.[^\/]+|[^\/]+)(\/.*)?$/;

    // Special case for <all_urls>
    if (pattern === '<all_urls>') {
      return true;
    }

    return matchPatternRegex.test(pattern);
  }

  private saveSettings(update: Partial<Settings>): void {
    chrome.storage.sync.set(update);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
