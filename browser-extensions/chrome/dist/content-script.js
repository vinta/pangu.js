(function() {
	//#region browser-extensions/chrome/src/content-script.ts
	async function autoSpacingPage() {
		const pangu = window.pangu;
		if (pangu) pangu.autoSpacingPage();
	}
	function spacingPage() {
		const pangu = window.pangu;
		if (pangu) pangu.spacingPage();
	}
	chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_LOADED" });
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoSpacingPage);
	else autoSpacingPage();
	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.action === "PING") sendResponse({ success: true });
		else if (message.action === "MANUAL_SPACING") {
			spacingPage();
			sendResponse({ success: true });
		}
	});
	//#endregion
})();
