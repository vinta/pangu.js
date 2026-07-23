import type { StoragePort, StorageValueChange } from '../../browser-extensions/chrome/src/utils/settings';

// Mirrors chrome.storage.sync closely enough for the store's contract:
// set() and remove() notify the change listeners with oldValue/newValue pairs
// (the echo the real API fires in the writing context), emitExternal()
// simulates another device syncing a change in, and rejectWrites stands in for
// sync quota errors.
export interface InMemoryStorage extends StoragePort {
  data: Record<string, unknown>;
  rejectWrites: boolean;
  emitExternal(newValues: Record<string, unknown>): void;
}

export function inMemoryStorage(initial: Record<string, unknown> = {}): InMemoryStorage {
  const listeners: ((changes: Record<string, StorageValueChange>) => void)[] = [];

  const emit = (changes: Record<string, StorageValueChange>) => {
    for (const listener of listeners) {
      listener({ ...changes });
    }
  };

  const applyAndDescribe = (newValues: Record<string, unknown>) => {
    const changes: Record<string, StorageValueChange> = {};
    for (const [key, value] of Object.entries(newValues)) {
      changes[key] = { oldValue: storage.data[key], newValue: value };
      if (value === undefined) {
        delete storage.data[key];
      } else {
        storage.data[key] = value;
      }
    }
    return changes;
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
      emit(applyAndDescribe({ ...items }));
    },
    async remove(keys) {
      if (storage.rejectWrites) {
        throw new Error('QUOTA_BYTES quota exceeded');
      }
      const newValues: Record<string, unknown> = {};
      for (const key of keys) {
        newValues[key] = undefined;
      }
      emit(applyAndDescribe(newValues));
    },
    onChanged(listener) {
      listeners.push(listener);
    },
    emitExternal(newValues) {
      emit(applyAndDescribe(newValues));
    },
  };

  return storage;
}
