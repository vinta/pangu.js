import { getCachedSettings } from './settings';

export type SoundName = 'Hadouken' | 'Shouryuuken' | 'YeahBaby' | 'WahWahWaaah';

const SOUND_FILES: Record<SoundName, string> = {
  Hadouken: 'sounds/StreetFighter-Hadouken.mp3',
  Shouryuuken: 'sounds/StreetFighter-Shouryuuken.mp3',
  YeahBaby: 'sounds/AustinPowers-YeahBaby.mp3',
  WahWahWaaah: 'sounds/ManciniPinkPanther-WahWahWaaah.mp3',
};

export async function playSound(name: SoundName) {
  const settings = await getCachedSettings();
  if (!settings.is_mute_sound_effects) {
    const audio = new Audio(chrome.runtime.getURL(SOUND_FILES[name]));
    audio.play().catch((e) => console.log('Sound play failed:', e));
  }
}