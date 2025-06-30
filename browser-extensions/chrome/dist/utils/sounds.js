import { g as getCachedSettings } from "./settings.js";
function translatePage() {
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const messageKey = element.getAttribute("data-i18n");
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        if (element.tagName === "INPUT" && element.type === "button") {
          element.value = message;
        } else if (element.tagName === "TITLE") {
          document.title = message;
        } else {
          element.textContent = message;
        }
      }
    }
  }
}
const SOUND_FILES = {
  Hadouken: "sounds/StreetFighter-Hadouken.mp3",
  Shouryuuken: "sounds/StreetFighter-Shouryuuken.mp3",
  YeahBaby: "sounds/AustinPowers-YeahBaby.mp3",
  WahWahWaaah: "sounds/ManciniPinkPanther-WahWahWaaah.mp3"
};
let currentAudio = null;
async function playSound(name) {
  const settings = await getCachedSettings();
  if (!settings.is_mute_sound_effects) {
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
export {
  playSound as p,
  stopSound as s,
  translatePage as t
};
