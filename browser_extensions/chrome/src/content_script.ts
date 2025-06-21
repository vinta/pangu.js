// Content script that runs on web pages to apply spacing
declare global {
  interface Window {
    pangu: {
      autoSpacingPage(): void;
    };
  }
}

chrome.runtime.sendMessage({ purpose: 'can_spacing' }, (response) => {
  if (!response.result) {
    return;
  }

  // Apply spacing if allowed
  if (typeof window.pangu !== 'undefined' && window.pangu.autoSpacingPage) {
    window.pangu.autoSpacingPage();
  }
});