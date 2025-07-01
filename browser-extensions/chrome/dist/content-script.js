(function() {
  "use strict";
  async function autoSpacingPage() {
    const pangu = window.pangu;
    if (pangu) {
      pangu.enableIdleSpacing({
        chunkSize: 10,
        // Process 10 text nodes per idle cycle
        timeout: 5e3
        // 5 second timeout
      });
      pangu.enableVisibilityCheck({
        checkDuringIdle: true,
        commonHiddenPatterns: {
          clipRect: true,
          displayNone: true,
          visibilityHidden: true,
          opacityZero: true,
          heightWidth1px: true
        }
      });
      pangu.enablePerformanceMonitoring();
      pangu.autoSpacingPage();
      setTimeout(() => {
        console.log("[Pangu.js] Performance Report:");
        pangu.logPerformanceResults();
      }, 1e4);
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
