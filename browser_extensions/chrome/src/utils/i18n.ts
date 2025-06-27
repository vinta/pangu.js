/**
 * Modern i18n helper for Chrome Extensions
 * Translates elements with data-i18n attributes
 */

export function translatePage() {
  // Translate all elements with data-i18n attribute
  for (const element of document.querySelectorAll('[data-i18n]')) {
    const messageKey = element.getAttribute('data-i18n');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      // Only replace if we have a translation (keeps default Chinese text if no translation)
      if (message) {
        if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'button') {
          (element as HTMLInputElement).value = message;
        } else if (element.tagName === 'TITLE') {
          document.title = message;
        } else {
          element.textContent = message;
        }
      }
    }
  }
}
