//#region browser-extensions/chrome/src/utils/urls.ts
function isValidMatchPattern(pattern) {
	if (!pattern.match(/^(https?:\/\/|file:\/\/\/|\*:\/\/)/)) return false;
	try {
		new URLPattern(pattern);
		return true;
	} catch {
		return false;
	}
}
//#endregion
export { isValidMatchPattern as t };
