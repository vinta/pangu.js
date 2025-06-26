import { getCachedSettings } from './settings';

export type SoundName = 'Hadouken' | 'Shouryuuken' | 'YeahBaby' | 'WahWahWaaah';

const SOUND_FILES: Record<SoundName, string> = {
  Hadouken: 'sounds/StreetFighter-Hadouken.mp3',
  Shouryuuken: 'sounds/StreetFighter-Shouryuuken.mp3',
  YeahBaby: 'sounds/AustinPowers-YeahBaby.mp3',
  WahWahWaaah: 'sounds/ManciniPinkPanther-WahWahWaaah.mp3',
};

// Keep track of currently playing audio
let currentAudio: HTMLAudioElement | null = null;

export async function playSound(name: SoundName) {
  const settings = await getCachedSettings();
  if (!settings.is_mute_sound_effects) {
    // Stop any currently playing sound
    stopSound();
    
    const audio = new Audio(chrome.runtime.getURL(SOUND_FILES[name]));
    currentAudio = audio;
    
    // Clear reference when sound finishes
    audio.addEventListener('ended', () => {
      currentAudio = null;
    });
    
    audio.play().catch((e) => console.log('Sound play failed:', e));
  }
}

export function stopSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
