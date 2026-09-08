import { afterEach, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../browser-extensions/chrome/src/settings/storage';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([undefined, 'No tab with id: 501953259.', 'Unexpected icon failure'])('handles the asynchronous icon callback: %s', async (message) => {
  vi.resetModules();
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warningLog = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const onUpdated = vi.fn<typeof chrome.tabs.onUpdated.addListener>();
  let errorRead = false;
  let callbackActive = false;
  const setIcon = vi.fn((_details: unknown, callback?: () => void) => {
    queueMicrotask(() => {
      callbackActive = true;
      callback?.();
      callbackActive = false;
      if (message && !errorRead) {
        console.error(`Unchecked runtime.lastError: ${message}`);
      }
    });
  });
  vi.stubGlobal('chrome', {
    action: { setIcon },
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
      get lastError() {
        errorRead = callbackActive;
        return callbackActive && message ? { message } : undefined;
      },
    },
    storage: { sync: { get: async () => DEFAULT_SETTINGS }, onChanged: { addListener: vi.fn() } },
    tabs: { onCreated: { addListener: vi.fn() }, onUpdated: { addListener: onUpdated } },
  });
  await import('../../browser-extensions/chrome/src/service-worker');

  await onUpdated.mock.calls[0]![0](501953259, { status: 'loading' }, { url: 'https://example.com/' } as chrome.tabs.Tab);

  expect(setIcon).toHaveBeenCalledOnce();
  expect(errorLog).not.toHaveBeenCalled();
  if (message === 'Unexpected icon failure') {
    expect(warningLog).toHaveBeenCalledWith('Failed to updateTabIcon for tab 501953259:', message);
  } else {
    expect(warningLog).not.toHaveBeenCalled();
  }
});
