import type { StoragePort } from '../../browser-extensions/chrome/src/utils/settings';

// Mirrors chrome.storage.sync closely enough for the store's contract:
// set() and remove() notify the change listeners (the echo the real API fires
// in the writing context), emitExternal() simulates another device syncing a
// change in, and rejectWrites stands in for sync quota errors.
export interface InMemoryStorage extends StoragePort {
  data: Record<string, unknown>;
  rejectWrites: boolean;
  emitExternal(changes: Record<string, unknown>): void;
}

export function inMemoryStorage(initial: Record<string, unknown> = {}): InMemoryStorage {
  const listeners: ((changes: Record<string, unknown>) => void)[] = [];

  const emit = (changes: Record<string, unknown>) => {
    for (const listener of listeners) {
      listener({ ...changes });
    }
  };

  const storage: InMemoryStorage = {
    data: { ...initial },
    rejectWrites: false,
    async get() {
      return { ...storage.data };
    },
    async set(items) {
      if (storage.rejectWrites) {
        throw new Error('QUOTA_BYTES quota exceeded');
      }
      Object.assign(storage.data, items);
      emit({ ...items });
    },
    async remove(keys) {
      if (storage.rejectWrites) {
        throw new Error('QUOTA_BYTES quota exceeded');
      }
      const changes: Record<string, unknown> = {};
      for (const key of keys) {
        delete storage.data[key];
        changes[key] = undefined;
      }
      emit(changes);
    },
    onChanged(listener) {
      listeners.push(listener);
    },
    emitExternal(changes) {
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined) {
          delete storage.data[key];
        } else {
          storage.data[key] = value;
        }
      }
      emit(changes);
    },
  };

  return storage;
}
