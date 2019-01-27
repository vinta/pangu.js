chrome.runtime.sendMessage({purpose: 'can_spacing'}, function(response) {
  if (!response.result) {
    return;
  }

  pangu.autoSpacingPage();
});
