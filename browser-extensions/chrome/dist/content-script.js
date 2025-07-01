(function() {
  "use strict";
  async function autoSpacingPage() {
    const pangu = window.pangu;
    if (pangu) {
      pangu.enableIdleSpacing();
      pangu.enableVisibilityCheck();
      pangu.autoSpacingPage();
    }
  }
  function spacingPage() {
    const pangu = window.pangu;
    if (pangu) {
      pangu.spacingPageWithIdleCallback({
        onComplete: () => {
          console.log("[Pangu.js] Manual spacing completed");
        },
        onProgress: (processed, total) => {
          console.log(`[Pangu.js] Progress: ${processed}/${total} (${Math.round(processed / total * 100)}%)`);
        }
      });
    }
  }
  const loadedMessage = { type: "CONTENT_SCRIPT_LOADED" };
  chrome.runtime.sendMessage(loadedMessage);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoSpacingPage);
  } else {
    autoSpacingPage();
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "PING") {
      sendResponse({ success: true });
    } else if (message.action === "MANUAL_SPACING") {
      spacingPage();
      sendResponse({ success: true });
    }
  });
})();
