import { n as getCachedSettings } from "./settings.js";
//#region browser-extensions/chrome/src/utils/i18n.ts
/**
* Modern i18n helper for Chrome Extensions
* Translates elements with data-i18n attributes
*/
function translatePage() {
	for (const element of document.querySelectorAll("[data-i18n]")) {
		const messageKey = element.getAttribute("data-i18n");
		if (messageKey) {
			const message = chrome.i18n.getMessage(messageKey);
			if (message) if (element.tagName === "INPUT" && element.type === "button") element.value = message;
			else if (element.tagName === "TITLE") document.title = message;
			else element.textContent = message;
		}
	}
}
//#endregion
//#region browser-extensions/chrome/src/utils/sounds.ts
var SOUND_FILES = {
	Hadouken: "sounds/StreetFighter-Hadouken.mp3",
	Shouryuuken: "sounds/StreetFighter-Shouryuuken.mp3",
	YeahBaby: "sounds/AustinPowers-YeahBaby.mp3",
	WahWahWaaah: "sounds/ManciniPinkPanther-WahWahWaaah.mp3"
};
var currentAudio = null;
async function playSound(name) {
	if (!(await getCachedSettings()).is_mute_sound_effects) {
		stopSound();
		const audio = new Audio(chrome.runtime.getURL(SOUND_FILES[name]));
		currentAudio = audio;
		audio.addEventListener("ended", () => {
			currentAudio = null;
		});
		audio.play().catch((e) => console.log("Sound play failed:", e));
	}
}
function stopSound() {
	if (currentAudio) {
		currentAudio.pause();
		currentAudio.currentTime = 0;
		currentAudio = null;
	}
}
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
export { translatePage as i, playSound as n, stopSound as r, _defineProperty as t };
