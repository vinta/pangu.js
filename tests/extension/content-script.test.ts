import { afterEach, expect, it, vi } from 'vitest';
import type { ContentScriptResponse, MessageToContentScript } from '../../browser-extensions/chrome/src/messages';
import { DEFAULT_SETTINGS } from '../../browser-extensions/chrome/src/settings/storage';

async function loadContentScript(readyState = 'complete') {
  vi.resetModules();
  let resolveSettings!: (settings: typeof DEFAULT_SETTINGS) => void;
  let rejectSettings!: (error: Error) => void;
  const settings = new Promise<typeof DEFAULT_SETTINGS>((resolve, reject) => {
    resolveSettings = resolve;
    rejectSettings = reject;
  });
  const get = vi.fn(() => settings);
  const document = Object.assign(new EventTarget(), { readyState, documentElement: { textContent: '' } });
  const pangu = {
    onTextNodesSettled: null as typeof window.pangu.onTextNodesSettled,
    autoSpacingPage: vi.fn(),
    spacingPage: vi.fn(),
    applyLateFixes: vi.fn(),
  };
  const node = {} as Text;
  pangu.spacingPage.mockImplementation(() => {
    pangu.onTextNodesSettled?.([{ node, unspaced: '氣溫是-5度', settled: '氣溫是 - 5 度' }]);
  });
  const addListener = vi.fn<(listener: (message: MessageToContentScript, sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => unknown) => void>();
  const sendMessage = vi.fn(async () => ({ ok: true, candidateLabels: ['負'] }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', { pangu });
  vi.stubGlobal('chrome', { storage: { sync: { get } }, runtime: { onMessage: { addListener }, sendMessage } });
  await import('../../browser-extensions/chrome/src/content-script');
  return { document, pangu, get, sendMessage, onMessage: addListener.mock.calls[0]![0], resolveSettings, rejectSettings };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(['loading', 'complete'])('waits for initialization before manual spacing when the document is %s', async (readyState) => {
  const { document, pangu, get, sendMessage, onMessage, resolveSettings } = await loadContentScript(readyState);
  const sendResponse = vi.fn();
  const keepsChannelOpen = onMessage({ action: 'MANUAL_SPACING' }, {}, sendResponse);

  expect(pangu.spacingPage).not.toHaveBeenCalled();
  expect(sendResponse).not.toHaveBeenCalled();
  expect(keepsChannelOpen).toBe(true);
  if (readyState === 'loading') {
    expect(get).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }
  await Promise.resolve();
  expect(get).toHaveBeenCalledTimes(1);
  expect(pangu.spacingPage).not.toHaveBeenCalled();
  expect(sendResponse).not.toHaveBeenCalled();

  resolveSettings(DEFAULT_SETTINGS);
  await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ success: true }));

  expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(1);
  expect(pangu.spacingPage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({ type: 'CLASSIFY_CANDIDATES', kind: 'hyphen-sign', candidates: [{ sentence: '氣溫是-5度', at: 3 }] });
  expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node: {}, settled: '氣溫是 - 5 度', data: '氣溫是 -5 度' }]);
  expect(get).toHaveBeenCalledTimes(1);
});

it('answers PING synchronously and reports failed initialization to a waiting manual request', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { pangu, onMessage, rejectSettings } = await loadContentScript();
  const pong = vi.fn();
  expect(onMessage({ action: 'PING' }, {}, pong)).not.toBe(true);
  expect(pong).toHaveBeenCalledWith({ success: true });

  const sendResponse = vi.fn();
  expect(onMessage({ action: 'MANUAL_SPACING' }, {}, sendResponse)).toBe(true);
  rejectSettings(new Error('storage unavailable'));

  await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ success: false }));
  expect(pangu.spacingPage).not.toHaveBeenCalled();
  expect(pangu.autoSpacingPage).not.toHaveBeenCalled();
});
