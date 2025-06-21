/**
 * Modern i18n helper for Chrome Extensions
 * Automatically translates elements with data-i18n attributes
 */

export function translatePage(): void {
  // Translate all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      // Only replace if we have a translation (keeps default Chinese text if no translation)
      if (message) {
        if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'button') {
          (element as HTMLInputElement).value = message;
        } else {
          element.textContent = message;
        }
      }
    }
  });

  // Translate all elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n-placeholder');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        (element as HTMLInputElement).placeholder = message;
      }
    }
  });

  // Translate all elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n-title');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.setAttribute('title', message);
      }
    }
  });

  // Set page title if it has data-i18n attribute
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const messageKey = titleElement.getAttribute('data-i18n');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        document.title = message;
      }
    }
  }
}

// Auto-translate when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', translatePage);
} else {
  translatePage();
}