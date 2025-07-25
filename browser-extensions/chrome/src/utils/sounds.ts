import { getCachedSettings } from './settings';

export type SoundName = 'Hadouken' | 'Shouryuuken' | 'YeahBaby' | 'WahWahWaaah';

const SOUND_FILES: Record<SoundName, string> = {
  Hadouken: 'sounds/StreetFighter-Hadouken.mp3',
  Shouryuuken: 'sounds/StreetFighter-Shouryuuken.mp3',
  YeahBaby: 'sounds/AustinPowers-YeahBaby.mp3',
  WahWahWaaah: 'sounds/ManciniPinkPanther-WahWahWaaah.mp3',
};

let currentAudio: HTMLAudioElement | null = null;

export async function playSound(name: SoundName) {
  const settings = await getCachedSettings();
  if (!settings.is_mute_sound_effects) {
    stopSound();

    const audio = new Audio(chrome.runtime.getURL(SOUND_FILES[name]));
    currentAudio = audio;

    audio.addEventListener('ended', () => {
      currentAudio = null;
    });

    audio.play().catch((error) => console.log('Sound play failed:', error));
  }
}

export function stopSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
