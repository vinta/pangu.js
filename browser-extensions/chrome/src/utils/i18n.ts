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

  // Translate elements whose message contains HTML declared via placeholders in messages.json
  for (const element of document.querySelectorAll('[data-i18n-html]')) {
    const messageKey = element.getAttribute('data-i18n-html');
    if (messageKey) {
      // No escaping: escapeLt would also escape the HTML in messages.json placeholders, and messages ship inside the extension package so they are as trusted as this page
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.innerHTML = message;
      }
    }
  }
}
