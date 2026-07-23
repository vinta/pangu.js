import type { ReadonlySettings, Settings } from './types';
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

// The storage the settings store sits on: chrome.storage.sync in the extension,
// an in-memory implementation in vitest. Two adapters make the seam real.
// Change events keep chrome's oldValue/newValue shape: the store needs oldValue
// to recognize changes that arrive before it ever read (a woken service worker).
export interface StorageValueChange {
  oldValue?: unknown;
  newValue?: unknown;
}

export interface StoragePort {
  get(): Promise<Record<string, unknown>>;
  set(items: Partial<Settings>): Promise<void>;
  remove(keys: string[]): Promise<void>;
  onChanged(listener: (changes: Record<string, StorageValueChange>) => void): void;
}

export type SettingsSubscriber = (settings: ReadonlySettings, changedKeys: readonly (keyof Settings)[]) => void;

export interface SettingsStore {
  get(): Promise<ReadonlySettings>;
  update(partial: Partial<Settings>): Promise<void>;
  subscribe(subscriber: SettingsSubscriber): () => void;
  reconcile(): Promise<void>;
  activeList(): Promise<readonly string[]>;
  addToActiveList(pattern: string): Promise<'added' | 'duplicate' | 'invalid'>;
  editActiveList(index: number, pattern: string): Promise<'saved' | 'invalid'>;
  removeFromActiveList(index: number): Promise<void>;
  restoreActiveListDefaults(): Promise<void>;
}

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

function cloneSettings(settings: Settings) {
  return { ...settings, blacklist: [...settings.blacklist], whitelist: [...settings.whitelist] };
}

function overlayDefaults(raw: Record<string, unknown>) {
  const settings = cloneSettings(DEFAULT_SETTINGS);
  for (const key of SETTINGS_KEYS) {
    if (key in raw) {
      Object.assign(settings, { [key]: raw[key] });
    }
  }
  return settings;
}

// Builds a Partial<Settings> for the list picked by filter mode without a
// computed-key cast
function listPatch(key: 'blacklist' | 'whitelist', urls: string[]) {
  return key === 'blacklist' ? { blacklist: urls } : { whitelist: urls };
}

function valueEquals(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return a === b;
}

// Applies the known keys of `changes` onto `cache` (a removed key falls back to
// its default) and reports which keys actually changed value. Diffing here is
// also what dedupes the echo event storage fires for the store's own writes.
function applyToCache(cache: Settings, changes: Record<string, unknown>) {
  const changedKeys: (keyof Settings)[] = [];
  for (const key of SETTINGS_KEYS) {
    if (!(key in changes)) {
      continue;
    }
    const next = changes[key] ?? DEFAULT_SETTINGS[key];
    if (!valueEquals(cache[key], next)) {
      Object.assign(cache, { [key]: Array.isArray(next) ? [...next] : next });
      changedKeys.push(key);
    }
  }
  return changedKeys;
}

// The production adapter. Only referenced when a store is constructed, so
// importing this module never touches the chrome global.
const chromeSyncStorage: StoragePort = {
  get: () => chrome.storage.sync.get(null),
  set: (items) => chrome.storage.sync.set(items),
  remove: (keys) => chrome.storage.sync.remove(keys),
  onChanged: (listener) => {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        listener(changes);
      }
    });
  },
};

export function createSettingsStore(storage: StoragePort = chromeSyncStorage) {
  let cache: Settings | null = null;
  let loading: Promise<Settings> | null = null;
  const subscribers: SettingsSubscriber[] = [];
  let eventChain: Promise<void> = Promise.resolve();

  const ensureLoaded = async () => {
    if (cache) {
      return cache;
    }
    loading ??= storage.get().then((raw) => {
      cache ??= overlayDefaults(raw);
      return cache;
    });
    return loading;
  };

  const notify = (changedKeys: (keyof Settings)[]) => {
    if (!cache || changedKeys.length === 0) {
      return;
    }
    for (const subscriber of [...subscribers]) {
      // Each subscriber gets its own snapshot, so none can corrupt a sibling's
      subscriber(cloneSettings(cache), [...changedKeys]);
    }
  };

  // External changes (other contexts, other devices, and the echoes of this
  // store's own writes) are serialized so they apply in arrival order
  storage.onChanged((changes) => {
    // Captured at arrival: by the time a queued handler runs, an earlier
    // handler's fresh load may already have absorbed this event's values
    const arrivedCold = cache === null;
    eventChain = eventChain
      .then(async () => {
        const current = await ensureLoaded();
        const newValues: Record<string, unknown> = {};
        for (const [key, change] of Object.entries(changes)) {
          newValues[key] = change.newValue;
        }
        const changedKeys = applyToCache(current, newValues);
        if (arrivedCold) {
          // Cold arrival (a woken service worker): the cache diff alone can
          // miss keys the initial load already held, so union in the event's
          // own oldValue/newValue diff
          for (const key of SETTINGS_KEYS) {
            if (key in changes && !valueEquals(changes[key].oldValue, changes[key].newValue) && !changedKeys.includes(key)) {
              changedKeys.push(key);
            }
          }
        }
        notify(changedKeys);
      })
      .catch(console.error);
  });

  const store: SettingsStore = {
    async get() {
      return cloneSettings(await ensureLoaded());
    },

    async update(partial) {
      const current = await ensureLoaded();
      const toWrite: Partial<Settings> = {};
      for (const key of SETTINGS_KEYS) {
        if (key in partial && !valueEquals(partial[key], current[key])) {
          Object.assign(toWrite, { [key]: partial[key] });
        }
      }
      if (Object.keys(toWrite).length === 0) {
        return;
      }
      await storage.set(toWrite);
      notify(applyToCache(current, toWrite));
    },

    subscribe(subscriber) {
      subscribers.push(subscriber);
      return () => {
        const index = subscribers.indexOf(subscriber);
        if (index >= 0) {
          subscribers.splice(index, 1);
        }
      };
    },

    // Brings synced storage in line with the current schema: adds missing
    // defaults, prunes keys no version of Settings knows. Nothing user-visible
    // changes (reads overlay defaults already), so subscribers stay quiet:
    // priming the cache first routes the write echoes into the warm diff,
    // where they cancel against the overlaid defaults.
    async reconcile() {
      await ensureLoaded();
      const raw = await storage.get();
      const missing: Partial<Settings> = {};
      for (const key of SETTINGS_KEYS) {
        if (!(key in raw)) {
          Object.assign(missing, { [key]: DEFAULT_SETTINGS[key] });
        }
      }
      const unknownKeys = Object.keys(raw).filter((key) => !(key in DEFAULT_SETTINGS));
      if (Object.keys(missing).length > 0) {
        await storage.set(missing);
      }
      if (unknownKeys.length > 0) {
        await storage.remove(unknownKeys);
      }
    },

    async activeList() {
      const current = await ensureLoaded();
      return [...current[current.filter_mode]];
    },

    async addToActiveList(pattern) {
      if (!isValidMatchPattern(pattern)) {
        return 'invalid';
      }
      const current = await ensureLoaded();
      const key = current.filter_mode;
      if (current[key].includes(pattern)) {
        return 'duplicate';
      }
      await store.update(listPatch(key, [...current[key], pattern]));
      return 'added';
    },

    async editActiveList(index, pattern) {
      if (!isValidMatchPattern(pattern)) {
        return 'invalid';
      }
      const current = await ensureLoaded();
      const key = current.filter_mode;
      if (index < 0 || index >= current[key].length) {
        return 'invalid';
      }
      const urls = [...current[key]];
      urls[index] = pattern;
      await store.update(listPatch(key, urls));
      return 'saved';
    },

    async removeFromActiveList(index) {
      const current = await ensureLoaded();
      const key = current.filter_mode;
      if (index < 0 || index >= current[key].length) {
        return;
      }
      const urls = [...current[key]];
      urls.splice(index, 1);
      await store.update(listPatch(key, urls));
    },

    async restoreActiveListDefaults() {
      const current = await ensureLoaded();
      const key = current.filter_mode;
      await store.update(listPatch(key, [...DEFAULT_SETTINGS[key]]));
    },
  };

  return store;
}

let storeInstance: SettingsStore | undefined;

// Callers bind this once per scope (`const settings = getSettingsStore();`)
// and call methods on the binding, never inline off the accessor
export function getSettingsStore() {
  storeInstance ??= createSettingsStore();
  return storeInstance;
}
