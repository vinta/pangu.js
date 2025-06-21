chrome.runtime.sendMessage({ purpose: "can_spacing" }, (response) => {
  if (!response.result) {
    return;
  }
  if (typeof window.pangu !== "undefined" && window.pangu.autoSpacingPage) {
    window.pangu.autoSpacingPage();
  }
});
