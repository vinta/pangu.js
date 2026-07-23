import { createSettingsStore } from '../../browser-extensions/chrome/src/utils/settings';
import type { ReadonlySettings, Settings } from '../../browser-extensions/chrome/src/utils/types';
import { inMemoryStorage } from './in-memory-storage';
import { describe, expect, it } from 'vitest';

// Storage events settle on later microtasks, so contract checks that assert
// "nothing further happened" must let the queue drain first
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface SubscriberCall {
  settings: ReadonlySettings;
  changedKeys: readonly (keyof Settings)[];
}

function recordSubscriber(calls: SubscriberCall[]) {
  return (settings: ReadonlySettings, changedKeys: readonly (keyof Settings)[]) => {
    calls.push({ settings, changedKeys });
  };
}

describe('get', () => {
  it('returns every default when storage is empty', async () => {
    const settings = createSettingsStore(inMemoryStorage());

    const result = await settings.get();

    expect(result.spacing_mode).toBe('spacing_when_load');
    expect(result.filter_mode).toBe('blacklist');
    expect(result.whitelist).toEqual([]);
    expect(result.is_mute_sound_effects).toBe(false);
    expect(result.is_enable_text_autospace).toBe(true);
    expect(result.blacklist).toContain('https://docs.google.com/*');
  });

  it('merges stored values over defaults', async () => {
    const settings = createSettingsStore(inMemoryStorage({ spacing_mode: 'spacing_when_click', whitelist: ['https://example.com/*'] }));

    const result = await settings.get();

    expect(result.spacing_mode).toBe('spacing_when_click');
    expect(result.whitelist).toEqual(['https://example.com/*']);
    expect(result.filter_mode).toBe('blacklist');
  });

  it('hands out copies, so mutating a result never reaches the cache', async () => {
    const settings = createSettingsStore(inMemoryStorage());

    const first = (await settings.get()) as Settings;
    first.spacing_mode = 'spacing_when_click';
    first.blacklist.push('https://corrupted.example/*');

    const second = await settings.get();
    expect(second.spacing_mode).toBe('spacing_when_load');
    expect(second.blacklist).not.toContain('https://corrupted.example/*');
  });
});

describe('update', () => {
  it('persists the change and resolves after storage accepted it', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);

    await settings.update({ spacing_mode: 'spacing_when_click' });

    expect(storage.data.spacing_mode).toBe('spacing_when_click');
    expect((await settings.get()).spacing_mode).toBe('spacing_when_click');
  });
});

describe('subscribe', () => {
  it('notifies exactly once per change, after the write, with only the keys that changed', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    // filter_mode already defaults to blacklist, so only spacing_mode changes
    await settings.update({ spacing_mode: 'spacing_when_click', filter_mode: 'blacklist' });
    await settle();

    expect(calls).toHaveLength(1);
    expect(calls[0].changedKeys).toEqual(['spacing_mode']);
    expect(calls[0].settings.spacing_mode).toBe('spacing_when_click');
  });

  it('does not notify or write when nothing actually changes', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    await settings.update({ filter_mode: 'blacklist' });
    await settle();

    expect(calls).toHaveLength(0);
    expect('filter_mode' in storage.data).toBe(false);
  });

  it('gives each subscriber its own snapshot', async () => {
    const settings = createSettingsStore(inMemoryStorage());
    const seen: string[] = [];
    settings.subscribe((s) => {
      // A hostile subscriber mutating through a cast must not reach its siblings
      (s as Settings).spacing_mode = 'spacing_when_click';
    });
    settings.subscribe((s) => {
      seen.push(s.spacing_mode);
    });

    await settings.update({ is_mute_sound_effects: true });
    await settle();

    expect(seen).toEqual(['spacing_when_load']);
  });

  it('stops notifying after unsubscribe', async () => {
    const settings = createSettingsStore(inMemoryStorage());
    const calls: SubscriberCall[] = [];
    const unsubscribe = settings.subscribe(recordSubscriber(calls));

    unsubscribe();
    await settings.update({ is_mute_sound_effects: true });
    await settle();

    expect(calls).toHaveLength(0);
  });
});

describe('update failure', () => {
  it('rejects, keeps the cache clean, and notifies nobody when storage refuses the write', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));
    storage.rejectWrites = true;

    await expect(settings.update({ is_mute_sound_effects: true })).rejects.toThrow('QUOTA_BYTES');
    await settle();

    expect((await settings.get()).is_mute_sound_effects).toBe(false);
    expect(calls).toHaveLength(0);
    expect('is_mute_sound_effects' in storage.data).toBe(false);
  });
});

describe('external changes', () => {
  it('updates the cache and notifies when another context changes a setting', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);
    await settings.get();
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    storage.emitExternal({ spacing_mode: 'spacing_when_click' });
    await settle();

    expect(calls).toHaveLength(1);
    expect(calls[0].changedKeys).toEqual(['spacing_mode']);
    expect((await settings.get()).spacing_mode).toBe('spacing_when_click');
  });

  it('ignores external no-op changes and unknown keys', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);
    await settings.get();
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    storage.emitExternal({ filter_mode: 'blacklist', some_legacy_key: 42 });
    await settle();

    expect(calls).toHaveLength(0);
  });

  it('notifies changes that arrive before the first read, as on a service worker wake', async () => {
    const storage = inMemoryStorage({ spacing_mode: 'spacing_when_load' });
    const settings = createSettingsStore(storage);
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    // No get() has happened: the change event itself is the first signal,
    // exactly what a woken service worker sees
    storage.emitExternal({ spacing_mode: 'spacing_when_click' });
    await settle();

    expect(calls).toHaveLength(1);
    expect(calls[0].changedKeys).toEqual(['spacing_mode']);
    expect(calls[0].settings.spacing_mode).toBe('spacing_when_click');
  });

  it('falls back to the default when a known key is removed externally', async () => {
    const storage = inMemoryStorage({ is_enable_text_autospace: false });
    const settings = createSettingsStore(storage);
    await settings.get();
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    storage.emitExternal({ is_enable_text_autospace: undefined });
    await settle();

    expect(calls).toHaveLength(1);
    expect((await settings.get()).is_enable_text_autospace).toBe(true);
  });
});

describe('active list', () => {
  it('reads the list selected by filter mode', async () => {
    const settings = createSettingsStore(inMemoryStorage({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'] }));

    expect(await settings.activeList()).toEqual(['https://example.com/*']);
  });

  it('adds a valid pattern to the active list', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);

    const outcome = await settings.addToActiveList('https://example.com/*');

    expect(outcome).toBe('added');
    expect(await settings.activeList()).toContain('https://example.com/*');
    expect(storage.data.blacklist).toContain('https://example.com/*');
  });

  it('rejects a duplicate without writing or notifying', async () => {
    const storage = inMemoryStorage({ blacklist: ['https://example.com/*'] });
    const settings = createSettingsStore(storage);
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    const outcome = await settings.addToActiveList('https://example.com/*');
    await settle();

    expect(outcome).toBe('duplicate');
    expect(await settings.activeList()).toEqual(['https://example.com/*']);
    expect(calls).toHaveLength(0);
  });

  it('rejects an invalid pattern without writing', async () => {
    const settings = createSettingsStore(inMemoryStorage());

    expect(await settings.addToActiveList('ftp://example.com/*')).toBe('invalid');
    expect(await settings.activeList()).not.toContain('ftp://example.com/*');
  });

  it('edits an entry in place', async () => {
    const settings = createSettingsStore(inMemoryStorage({ blacklist: ['https://a.example/*', 'https://b.example/*'] }));

    const outcome = await settings.editActiveList(1, 'https://c.example/*');

    expect(outcome).toBe('saved');
    expect(await settings.activeList()).toEqual(['https://a.example/*', 'https://c.example/*']);
  });

  it('treats an invalid pattern or index as invalid and changes nothing', async () => {
    const settings = createSettingsStore(inMemoryStorage({ blacklist: ['https://a.example/*'] }));

    expect(await settings.editActiveList(0, 'not a pattern')).toBe('invalid');
    expect(await settings.editActiveList(5, 'https://c.example/*')).toBe('invalid');
    expect(await settings.activeList()).toEqual(['https://a.example/*']);
  });

  it('removes an entry by index', async () => {
    const settings = createSettingsStore(inMemoryStorage({ blacklist: ['https://a.example/*', 'https://b.example/*'] }));

    await settings.removeFromActiveList(0);

    expect(await settings.activeList()).toEqual(['https://b.example/*']);
  });

  it('restores only the active list to its defaults', async () => {
    const storage = inMemoryStorage({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'], blacklist: ['https://custom.example/*'] });
    const settings = createSettingsStore(storage);

    await settings.restoreActiveListDefaults();

    expect(await settings.activeList()).toEqual([]);
    expect((await settings.get()).blacklist).toEqual(['https://custom.example/*']);
  });
});

describe('reconcile', () => {
  it('adds missing defaults, prunes unknown keys, and keeps stored values, all without notifying', async () => {
    const storage = inMemoryStorage({ spacing_mode: 'spacing_when_click', spacing_rule: 'legacy', old_flag: true });
    const settings = createSettingsStore(storage);
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    await settings.reconcile();
    await settle();

    expect(storage.data.spacing_mode).toBe('spacing_when_click');
    expect('spacing_rule' in storage.data).toBe(false);
    expect('old_flag' in storage.data).toBe(false);
    expect(storage.data.filter_mode).toBe('blacklist');
    expect(storage.data.is_enable_text_autospace).toBe(true);
    expect(storage.data.blacklist).toContain('https://docs.google.com/*');
    expect(calls).toHaveLength(0);
  });

  it('is quiet when storage already matches the schema', async () => {
    const storage = inMemoryStorage();
    const settings = createSettingsStore(storage);
    await settings.reconcile();
    const dataAfterFirst = { ...storage.data };
    const calls: SubscriberCall[] = [];
    settings.subscribe(recordSubscriber(calls));

    await settings.reconcile();
    await settle();

    expect(storage.data).toEqual(dataAfterFirst);
    expect(calls).toHaveLength(0);
  });
});
