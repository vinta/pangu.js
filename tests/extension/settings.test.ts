import { DEFAULT_SETTINGS, getSettings, onSettingsChanged, reconcileSettings, updateSettings } from '../../browser-extensions/chrome/src/utils/settings';
import type { Settings } from '../../browser-extensions/chrome/src/utils/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

// Stands in for chrome.storage in vitest: sync.get honors the defaults-object form the module relies on, and every write notifies onChanged listeners with the echo the real API fires
// in the writing context, only for keys whose value actually changed.
function stubChromeStorage(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = structuredClone(initial);
  const listeners: ((changes: Record<string, StorageChange>, areaName: string) => void)[] = [];

  const write = (newValues: Record<string, unknown>) => {
    const changes: Record<string, StorageChange> = {};
    for (const [key, value] of Object.entries(newValues)) {
      if (JSON.stringify(data[key]) === JSON.stringify(value)) {
        continue;
      }
      changes[key] = { oldValue: data[key], newValue: value };
      if (value === undefined) {
        delete data[key];
      } else {
        data[key] = structuredClone(value);
      }
    }
    if (Object.keys(changes).length > 0) {
      for (const listener of listeners) {
        listener({ ...changes }, 'sync');
      }
    }
  };

  const sync = {
    async get(arg: Record<string, unknown> | null) {
      if (arg === null) {
        return structuredClone(data);
      }
      const result: Record<string, unknown> = {};
      for (const [key, fallback] of Object.entries(arg)) {
        result[key] = structuredClone(key in data ? data[key] : fallback);
      }
      return result;
    },
    async set(items: Record<string, unknown>) {
      write(items);
    },
    async remove(keys: string[]) {
      write(Object.fromEntries(keys.map((key) => [key, undefined])));
    },
  };

  const onChanged = {
    addListener(listener: (changes: Record<string, StorageChange>, areaName: string) => void) {
      listeners.push(listener);
    },
  };

  vi.stubGlobal('chrome', { storage: { sync, onChanged } });

  return { data, sync };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getSettings', () => {
  it('returns every default when storage is empty', async () => {
    stubChromeStorage();

    const result = await getSettings();

    expect(result.spacing_mode).toBe('spacing_when_load');
    expect(result.filter_mode).toBe('blacklist');
    expect(result.whitelist).toEqual([]);
    expect(result.is_mute_sound_effects).toBe(false);
    expect(result.is_enable_text_autospace).toBe(true);
    expect(result.blacklist).toContain('https://docs.google.com/*');
  });

  it('merges stored values over defaults', async () => {
    stubChromeStorage({ spacing_mode: 'spacing_when_click', whitelist: ['https://example.com/*'] });

    const result = await getSettings();

    expect(result.spacing_mode).toBe('spacing_when_click');
    expect(result.whitelist).toEqual(['https://example.com/*']);
    expect(result.filter_mode).toBe('blacklist');
  });
});

describe('updateSettings', () => {
  it('persists the change and resolves after storage accepted it', async () => {
    const storage = stubChromeStorage();

    await updateSettings({ spacing_mode: 'spacing_when_click' });

    expect(storage.data.spacing_mode).toBe('spacing_when_click');
    expect((await getSettings()).spacing_mode).toBe('spacing_when_click');
  });
});

describe('onSettingsChanged', () => {
  it('reports the changed keys for a write, own writes included', async () => {
    stubChromeStorage();
    const calls: (keyof Settings)[][] = [];
    onSettingsChanged((changedKeys) => calls.push(changedKeys));

    await updateSettings({ spacing_mode: 'spacing_when_click' });

    expect(calls).toEqual([['spacing_mode']]);
  });

  it('ignores keys no version of Settings knows', async () => {
    const storage = stubChromeStorage();
    const calls: (keyof Settings)[][] = [];
    onSettingsChanged((changedKeys) => calls.push(changedKeys));

    await storage.sync.set({ legacy_key: true });

    expect(calls).toEqual([]);
  });
});

describe('reconcileSettings', () => {
  it('adds missing defaults, prunes unknown keys, and keeps stored values', async () => {
    const storage = stubChromeStorage({ spacing_mode: 'spacing_when_click', legacy_key: 123 });

    await reconcileSettings();

    expect(storage.data.spacing_mode).toBe('spacing_when_click');
    expect(storage.data.filter_mode).toBe('blacklist');
    expect(storage.data.blacklist).toEqual(DEFAULT_SETTINGS.blacklist);
    expect('legacy_key' in storage.data).toBe(false);
  });

  it('writes and notifies nothing when storage already matches the schema', async () => {
    const storage = stubChromeStorage({ ...DEFAULT_SETTINGS });
    const calls: (keyof Settings)[][] = [];
    onSettingsChanged((changedKeys) => calls.push(changedKeys));

    await reconcileSettings();

    expect(storage.data).toEqual(DEFAULT_SETTINGS);
    expect(calls).toEqual([]);
  });
});
