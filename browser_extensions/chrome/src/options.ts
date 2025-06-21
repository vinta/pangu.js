import { ExtensionSettings } from './types';
import { translatePage } from './i18n';
import utils_chrome from './utils_chrome';

class OptionsController {
  private settings: ExtensionSettings = {
    spacing_mode: 'spacing_when_load',
    spacing_rule: 'blacklists',
    blacklists: [],
    whitelists: [],
    is_mute_sound_effects: false
  };
  
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
      'page_title': utils_chrome.get_i18n('extension_name'),
      'header_title': utils_chrome.get_i18n('extension_name'),
      'subtitle': utils_chrome.get_i18n('subtitle'),
      'quote': utils_chrome.get_i18n('quote'),
      'label_spacing_mode': utils_chrome.get_i18n('label_spacing_mode'),
      'label_spacing_rule': utils_chrome.get_i18n('label_spacing_rule'),
      'label_other_options': '其他：',
      'spacing_when_click_msg': utils_chrome.get_i18n('spacing_when_click_msg')
    };

    for (const [id, text] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    }

    // Set page title
    document.title = utils_chrome.get_i18n('extension_name');
    
    // Set mute label
    const muteLabel = document.getElementById('label_is_mute');
    if (muteLabel) {
      muteLabel.textContent = utils_chrome.get_i18n('label_is_mute');
    }
  }

  private async loadSettings(): Promise<void> {
    const settings = await utils_chrome.getCachedSettings();
    this.settings = settings;
  }

  private setupEventListeners(): void {
    // Spacing mode button
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'spacing_mode_btn') {
        this.changeSpacingMode();
      } else if (target.id === 'spacing_rule_btn') {
        this.changeSpacingRule();
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
      } else if (target.id === 'save-new-url-btn') {
        this.addNewUrl();
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
    this.renderSpacingRule();
    this.renderUrlList();
    this.renderMuteCheckbox();
  }

  private renderSpacingMode(): void {
    const button = document.getElementById('spacing_mode_btn') as HTMLInputElement;
    if (button) {
      button.value = utils_chrome.get_i18n(this.settings.spacing_mode);
    }

    // Show/hide spacing rule section
    const ruleSection = document.querySelector('.spacing_rule_group') as HTMLElement;
    const clickMessage = document.getElementById('spacing_when_click_msg') as HTMLElement;
    
    if (this.settings.spacing_mode === 'spacing_when_load') {
      ruleSection?.style.setProperty('display', 'block');
      clickMessage?.style.setProperty('display', 'none');
    } else {
      ruleSection?.style.setProperty('display', 'none');
      clickMessage?.style.setProperty('display', 'block');
    }
  }

  private renderSpacingRule(): void {
    const button = document.getElementById('spacing_rule_btn') as HTMLInputElement;
    if (button) {
      button.value = utils_chrome.get_i18n(this.settings.spacing_rule);
    }
  }

  private renderUrlList(): void {
    const container = document.getElementById('url-list-container');
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
    
    // Add new URL input
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
    
    html += '</ul>';
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

  private changeSpacingMode(): void {
    this.playSound('Hadouken');
    
    this.settings.spacing_mode = this.settings.spacing_mode === 'spacing_when_load' 
      ? 'spacing_when_click' 
      : 'spacing_when_load';
    
    this.saveSettings({ spacing_mode: this.settings.spacing_mode });
    this.render();
  }

  private changeSpacingRule(): void {
    this.playSound('Shouryuuken');
    
    this.settings.spacing_rule = this.settings.spacing_rule === 'blacklists' 
      ? 'whitelists' 
      : 'blacklists';
    
    this.saveSettings({ spacing_rule: this.settings.spacing_rule });
    this.render();
  }

  private startEditingUrl(index: number): void {
    const urls = this.settings[this.settings.spacing_rule];
    this.editingUrls.set(index, urls[index]);
    this.renderUrlList();
    
    // Focus on the input
    setTimeout(() => {
      const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  private saveEditingUrl(index: number): void {
    const input = document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
    const newUrl = input?.value.trim();
    
    if (this.isValidUrl(newUrl)) {
      this.playSound('YeahBaby');
      const urls = this.settings[this.settings.spacing_rule];
      urls[index] = newUrl;
      this.editingUrls.delete(index);
      
      const update: Partial<ExtensionSettings> = {};
      update[this.settings.spacing_rule] = urls;
      this.saveSettings(update);
      this.renderUrlList();
    } else {
      this.playSound('WahWahWaaah');
      alert('Invalid URL');
    }
  }

  private cancelEditingUrl(index: number): void {
    this.editingUrls.delete(index);
    this.renderUrlList();
  }

  private removeUrl(index: number): void {
    const urls = this.settings[this.settings.spacing_rule];
    urls.splice(index, 1);
    
    const update: Partial<ExtensionSettings> = {};
    update[this.settings.spacing_rule] = urls;
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

  private addNewUrl(): void {
    const input = document.getElementById('new-url-input') as HTMLInputElement;
    const newUrl = input?.value.trim();
    
    if (this.isValidUrl(newUrl)) {
      this.playSound('YeahBaby');
      const urls = this.settings[this.settings.spacing_rule];
      urls.push(newUrl);
      
      const update: Partial<ExtensionSettings> = {};
      update[this.settings.spacing_rule] = urls;
      this.saveSettings(update);
      
      this.addUrlInput = null;
      this.renderUrlList();
    } else {
      this.playSound('WahWahWaaah');
      alert('Invalid URL');
    }
  }

  private isValidUrl(url: string): boolean {
    return url && url.length > 0;
  }

  private saveSettings(update: Partial<ExtensionSettings>): void {
    utils_chrome.SYNC_STORAGE.set(update);
  }

  private playSound(name: string): void {
    if (!this.settings.is_mute_sound_effects) {
      const sounds: Record<string, string> = {
        'Hadouken': '../sounds/StreetFighter-Hadouken.mp3',
        'Shouryuuken': '../sounds/StreetFighter-Shouryuuken.mp3',
        'YeahBaby': '../sounds/AustinPowers-YeahBaby.mp3',
        'WahWahWaaah': '../sounds/WahWahWaaah.mp3'
      };

      const audio = new Audio(sounds[name]);
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    }
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