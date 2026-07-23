import {
  DEFAULT_SETTINGS,
  addToActiveList,
  editActiveList,
  getActiveList,
  getSettings,
  onSettingsChanged,
  reconcileSettings,
  removeFromActiveList,
  restoreActiveListDefaults,
  updateSettings,
} from '../../browser-extensions/chrome/src/utils/settings';
import type { Settings } from '../../browser-extensions/chrome/src/utils/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

// Stands in for chrome.storage in vitest: sync.get honors the defaults-object
// form the module relies on, and every write notifies onChanged listeners with
// the echo the real API fires in the writing context, only for keys whose
// value actually changed.
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

describe('active list', () => {
  it('reads the list selected by filter mode', async () => {
    stubChromeStorage({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'] });

    expect(await getActiveList()).toEqual(['https://example.com/*']);
  });

  it('adds a valid pattern to the active list', async () => {
    stubChromeStorage();

    expect(await addToActiveList('https://example.com/*')).toBe('added');

    const list = await getActiveList();
    expect(list).toContain('https://example.com/*');
    expect(list).toContain('https://docs.google.com/*');
  });

  it('rejects a duplicate without writing', async () => {
    const storage = stubChromeStorage({ blacklist: ['https://example.com/*'] });

    expect(await addToActiveList('https://example.com/*')).toBe('duplicate');

    expect(storage.data.blacklist).toEqual(['https://example.com/*']);
  });

  it('rejects an invalid pattern without writing', async () => {
    const storage = stubChromeStorage();

    expect(await addToActiveList('not a pattern')).toBe('invalid');

    expect('blacklist' in storage.data).toBe(false);
  });

  it('edits an entry in place', async () => {
    stubChromeStorage({ blacklist: ['https://example.com/*', 'https://example.org/*'] });

    expect(await editActiveList(1, 'https://example.net/*')).toBe('saved');

    expect(await getActiveList()).toEqual(['https://example.com/*', 'https://example.net/*']);
  });

  it('treats an invalid pattern or index as invalid and changes nothing', async () => {
    const storage = stubChromeStorage({ blacklist: ['https://example.com/*'] });

    expect(await editActiveList(0, 'not a pattern')).toBe('invalid');
    expect(await editActiveList(1, 'https://example.net/*')).toBe('invalid');
    expect(await editActiveList(-1, 'https://example.net/*')).toBe('invalid');

    expect(storage.data.blacklist).toEqual(['https://example.com/*']);
  });

  it('removes an entry by index', async () => {
    stubChromeStorage({ blacklist: ['https://example.com/*', 'https://example.org/*'] });

    await removeFromActiveList(0);

    expect(await getActiveList()).toEqual(['https://example.org/*']);
  });

  it('restores only the active list to its defaults', async () => {
    const storage = stubChromeStorage({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'], blacklist: ['https://example.org/*'] });

    await restoreActiveListDefaults();

    expect(storage.data.whitelist).toEqual(DEFAULT_SETTINGS.whitelist);
    expect(storage.data.blacklist).toEqual(['https://example.org/*']);
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
    const storage = stubChromeStorage(structuredClone(DEFAULT_SETTINGS));
    const calls: (keyof Settings)[][] = [];
    onSettingsChanged((changedKeys) => calls.push(changedKeys));

    await reconcileSettings();

    expect(storage.data).toEqual(DEFAULT_SETTINGS);
    expect(calls).toEqual([]);
  });
});
