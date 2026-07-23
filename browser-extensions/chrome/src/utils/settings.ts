import type { Settings } from './types';
import { isValidMatchPattern } from './urls';

export const DEFAULT_SETTINGS: Settings = {
  spacing_mode: 'spacing_when_load',
  filter_mode: 'blacklist',
  blacklist: [
    'https://docs.google.com/*',
    'https://gist.github.com/*',
    'https://github.com/*/*/blob/*',
    'https://github.com/*/*/commit/*',
    'https://github.com/*/*/compare/*',
    'https://github.com/*/*/pull/*',
    'https://github.com/vinta/pangu.js/issues*',
    'https://www.netflix.com/*',
  ],
  whitelist: [],
  is_mute_sound_effects: false,
  is_enable_text_autospace: true,
};

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

// chrome.storage.sync reads from a local database (cloud sync happens in the
// background), so reading fresh on every call is cheap; there is no cache.
// get(DEFAULT_SETTINGS) fills missing keys with defaults natively.
export async function getSettings() {
  return (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
}

export async function updateSettings(partial: Partial<Settings>) {
  await chrome.storage.sync.set(partial);
}

// The onChanged echo of this context's own writes is the render path: UI
// handlers only write, and every repaint is driven from here
export function onSettingsChanged(callback: (changedKeys: (keyof Settings)[]) => void) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return;
    }
    const changedKeys = SETTINGS_KEYS.filter((key) => key in changes);
    if (changedKeys.length > 0) {
      callback(changedKeys);
    }
  });
}

// Builds a Partial<Settings> for the list picked by filter mode without a
// computed-key cast
function listPatch(key: 'blacklist' | 'whitelist', urls: string[]) {
  return key === 'blacklist' ? { blacklist: urls } : { whitelist: urls };
}

export async function getActiveList() {
  const current = await getSettings();
  return current[current.filter_mode];
}

export async function addToActiveList(pattern: string) {
  if (!isValidMatchPattern(pattern)) {
    return 'invalid' as const;
  }
  const current = await getSettings();
  const key = current.filter_mode;
  if (current[key].includes(pattern)) {
    return 'duplicate' as const;
  }
  await updateSettings(listPatch(key, [...current[key], pattern]));
  return 'added' as const;
}

export async function editActiveList(index: number, pattern: string) {
  if (!isValidMatchPattern(pattern)) {
    return 'invalid' as const;
  }
  const current = await getSettings();
  const key = current.filter_mode;
  if (index < 0 || index >= current[key].length) {
    return 'invalid' as const;
  }
  const urls = [...current[key]];
  urls[index] = pattern;
  await updateSettings(listPatch(key, urls));
  return 'saved' as const;
}

export async function removeFromActiveList(index: number) {
  const current = await getSettings();
  const key = current.filter_mode;
  if (index < 0 || index >= current[key].length) {
    return;
  }
  const urls = [...current[key]];
  urls.splice(index, 1);
  await updateSettings(listPatch(key, urls));
}

export async function restoreActiveListDefaults() {
  const current = await getSettings();
  const key = current.filter_mode;
  await updateSettings(listPatch(key, [...DEFAULT_SETTINGS[key]]));
}

// Brings synced storage in line with the current schema on install/update:
// adds missing defaults, prunes keys no version of Settings knows
export async function reconcileSettings() {
  const raw = await chrome.storage.sync.get(null);
  const missing: Partial<Settings> = {};
  for (const key of SETTINGS_KEYS) {
    if (!(key in raw)) {
      Object.assign(missing, { [key]: DEFAULT_SETTINGS[key] });
    }
  }
  if (Object.keys(missing).length > 0) {
    await chrome.storage.sync.set(missing);
  }
  const unknownKeys = Object.keys(raw).filter((key) => !(key in DEFAULT_SETTINGS));
  if (unknownKeys.length > 0) {
    await chrome.storage.sync.remove(unknownKeys);
  }
}
