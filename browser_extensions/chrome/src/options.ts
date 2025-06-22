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

  private setupEventListeners(): void {
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
        this.changeFilterMode().catch(console.error);
      } else if (target.classList.contains('remove-url-btn')) {
        const index = parseInt(target.dataset.index || '0');
        this.removeUrl(index);
      } else if (target.classList.contains('edit-url-btn')) {
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
    if (button) {
      button.textContent = chrome.i18n.getMessage(settings.spacing_mode);
    }

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
    if (button) {
      button.textContent = chrome.i18n.getMessage(settings.filter_mode);
    }

    await this.renderUrlList();
  }

  private async renderUrlList() {
    const settings = await utils.getCachedSettings();
    const container = document.getElementById('url-list-container');
    if (!container) {
      return;
    }

    const urls = settings[settings.filter_mode as 'blacklist' | 'whitelist'] || [];
    let html = '<ul class="filter_mode_list">';

    for (const [index, url] of urls.entries()) {
      const editingUrl = this.editingUrls.get(index);
      if (editingUrl !== undefined) {
        // Editing mode
        html += `
          <li>
            <input type="text" class="url-edit-input" value="${this.escapeHtml(editingUrl)}" data-index="${index}">
            <button class="btn btn-sm save-url-btn" data-index="${index}">${chrome.i18n.getMessage('button_save')}</button>
            <button class="btn btn-sm cancel-edit-btn" data-index="${index}">${chrome.i18n.getMessage('button_cancel')}</button>
          </li>
        `;
      } else {
        // Display mode
        html += `
          <li class="animate-repeat">
            <a href="${url}" target="_blank" class="gradientEllipsis">${url}</a>
            <button class="btn btn-sm edit-url-btn" data-index="${index}">
              <svg class="icon icon-sm"><use xlink:href="#icon-edit"></use></svg>
            </button>
            <button class="btn btn-sm remove-url-btn" data-index="${index}">${chrome.i18n.getMessage('button_remove')}</button>
          </li>
        `;
      }
    }

    // Add new URL input if shown
    if (this.addUrlInput) {
      html += `
        <li>
          <input type="text" class="url-edit-input" id="new-url-input" placeholder="${chrome.i18n.getMessage('placeholder_enter_url')}">
          <button class="btn btn-sm" id="save-new-url-btn">${chrome.i18n.getMessage('button_save')}</button>
          <button class="btn btn-sm" id="cancel-new-url-btn">${chrome.i18n.getMessage('button_cancel')}</button>
        </li>
      `;
    }

    html += '</ul>';

    // Add "add new" button
    if (!this.addUrlInput) {
      html += `<div class="mt-4">
        <a href="#" id="add-url-btn">${chrome.i18n.getMessage('button_add_new_url')}</a>
      </div>`;
    }

    // Add help link
    html += `<div class="url-list-help">
      <a href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns" target="_blank">
        ${chrome.i18n.getMessage('link_learn_match_patterns')}
      </a>
    </div>`;

    container.innerHTML = html;

    // Set up event listeners for new elements
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
    const nextSpacingMode = settings.spacing_mode === 'spacing_when_load' ? 'spacing_when_click' : 'spacing_when_load';
    await chrome.storage.sync.set({ spacing_mode: nextSpacingMode });

    await utils.playSound(nextSpacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken');

    await this.renderSpacingMode();
  }

  private async changeFilterMode() {
    const settings = await utils.getCachedSettings();
    // Toggle between blacklist and whitelist
    const newFilterMode = settings.filter_mode === 'blacklist' ? 'whitelist' : 'blacklist';
    await utils.playSound(newFilterMode === 'blacklist' ? 'Shouryuuken' : 'Hadouken');

    chrome.storage.sync.set({ filter_mode: newFilterMode });
    await this.render();
  }

  private startEditingUrl(index: number): void {
    const settings = utils.getCachedSettings();
    settings.then(async (s) => {
      const urls = s[s.filter_mode as 'blacklist' | 'whitelist'];
      this.editingUrls.set(index, urls[index]);
      await this.renderUrlList();

      // Focus on the input
      const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
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

  private cancelEditingUrl(index: number): void {
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

  private showAddUrlInput(): void {
    this.addUrlInput = document.createElement('input');
    this.renderUrlList();
  }

  private setupUrlInputListeners(): void {
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

  private async saveNewUrl() {
    const input = document.getElementById('new-url-input') as HTMLInputElement;
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
    const urls = [...settings[ruleKey], newUrl];

    const update = { [ruleKey]: urls };
    chrome.storage.sync.set(update);

    this.addUrlInput = null;
    await this.renderUrlList();
  }

  private cancelNewUrl(): void {
    this.addUrlInput = null;
    this.renderUrlList();
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
