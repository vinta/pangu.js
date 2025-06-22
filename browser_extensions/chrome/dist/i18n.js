function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const messageKey = element.getAttribute("data-i18n");
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        if (element.tagName === "INPUT" && element.type === "button") {
          element.value = message;
        } else {
          element.textContent = message;
        }
      }
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const messageKey = element.getAttribute("data-i18n-placeholder");
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.placeholder = message;
      }
    }
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const messageKey = element.getAttribute("data-i18n-title");
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.setAttribute("title", message);
      }
    }
  });
  const titleElement = document.querySelector("title[data-i18n]");
  if (titleElement) {
    const messageKey = titleElement.getAttribute("data-i18n");
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        document.title = message;
      }
    }
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", translatePage);
} else {
  translatePage();
}
export {
  translatePage as t
};
