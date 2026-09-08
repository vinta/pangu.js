import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentScriptResponse } from '../../browser-extensions/chrome/src/messages';
import { DEFAULT_SETTINGS, type Settings } from '../../browser-extensions/chrome/src/settings/storage';
import type { SettledTextNode } from '../../src/browser/pangu';

const aiSpacing = vi.hoisted(() => ({ applyAiSpacing: vi.fn(), warmUpAiSpacing: vi.fn() }));
vi.mock('../../browser-extensions/chrome/src/ai-spacing/content-script', () => aiSpacing);

async function loadContentScript(settings: Settings | Promise<Settings>, url = 'https://docs.google.com/document/d/abc') {
  vi.resetModules();
  const pangu = {
    autoSpacingPage: vi.fn(),
    stopAutoSpacingPage: vi.fn(),
    spacingPage: vi.fn(),
    onTextNodesSettled: null as ((nodes: SettledTextNode[]) => void) | null,
  };
  const addMessageListener = vi.fn<typeof chrome.runtime.onMessage.addListener>();
  const addNavigationListener = vi.fn();
  const location = { href: url };
  vi.doMock('../../src/browser/pangu', () => ({ default: pangu }));
  vi.stubGlobal('location', location);
  vi.stubGlobal('navigation', { addEventListener: addNavigationListener });
  vi.stubGlobal('chrome', { storage: { sync: { get: async () => settings } }, runtime: { onMessage: { addListener: addMessageListener } } });
  await import('../../browser-extensions/chrome/src/content-script');

  const receiveMessage = addMessageListener.mock.calls[0]![0];
  const click = () => new Promise<ContentScriptResponse>((resolve) => receiveMessage({ action: 'MANUAL_SPACING' }, {}, resolve));
  const navigate = (url: string) => {
    const from = { url: location.href };
    location.href = url;
    addNavigationListener.mock.calls[0]![1]({ from });
  };
  return { pangu, receiveMessage, click, navigate };
}

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('manual spacing activation', () => {
  it('answers PING immediately but waits for AI initialization before starting manual spacing', async () => {
    let finishSettings!: (settings: Settings) => void;
    const settings = new Promise<Settings>((resolve) => {
      finishSettings = resolve;
    });
    const { pangu, receiveMessage, click } = await loadContentScript(settings);
    const pingResponse = vi.fn();
    receiveMessage({ action: 'PING' }, {}, pingResponse);
    expect(pingResponse).toHaveBeenCalledWith({ success: true });

    const manualResponse = vi.fn();
    expect(receiveMessage({ action: 'MANUAL_SPACING' }, {}, manualResponse)).toBe(true);
    expect(manualResponse).not.toHaveBeenCalled();
    expect(pangu.autoSpacingPage).not.toHaveBeenCalled();
    const nodes: SettledTextNode[] = [{ node: {} as Text, unspaced: '公視+上架', settled: '公視 + 上架' }];
    pangu.autoSpacingPage.mockImplementation(() => pangu.onTextNodesSettled?.(nodes));

    finishSettings({ ...DEFAULT_SETTINGS, spacing_mode: 'spacing_when_click' });
    await vi.waitFor(() => expect(manualResponse).toHaveBeenCalledWith({ success: true }));
    expect(aiSpacing.applyAiSpacing).toHaveBeenCalledWith(nodes);
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(1);
    expect(await click()).toEqual({ success: true });
    expect(aiSpacing.warmUpAiSpacing).toHaveBeenCalledTimes(2);
    expect(pangu.spacingPage).not.toHaveBeenCalled();
  });

  it.each(['spacing_when_load', 'spacing_when_click'] as const)('starts on an excluded URL in %s without enabling disabled AI', async (spacing_mode) => {
    const { pangu, click } = await loadContentScript({ ...DEFAULT_SETTINGS, spacing_mode, is_enable_ai_spacing: false });
    expect(pangu.autoSpacingPage).not.toHaveBeenCalled();
    expect(await click()).toEqual({ success: true });
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(1);
    expect(pangu.onTextNodesSettled).toBeNull();
    expect(aiSpacing.warmUpAiSpacing).not.toHaveBeenCalled();
    expect(pangu.spacingPage).not.toHaveBeenCalled();
  });

  it('keeps manual activation on same-URL history updates but stops when the URL changes, even to an allowed URL', async () => {
    const url = 'https://example.com/';
    const { pangu, click, navigate } = await loadContentScript({ ...DEFAULT_SETTINGS, spacing_mode: 'spacing_when_click' }, url);
    expect(pangu.autoSpacingPage).not.toHaveBeenCalled();
    await click();
    pangu.stopAutoSpacingPage.mockClear();

    navigate(url);
    expect(pangu.stopAutoSpacingPage).not.toHaveBeenCalled();
    navigate(`${url}#next`);
    expect(pangu.stopAutoSpacingPage).toHaveBeenCalledTimes(1);
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(1);
    await click();
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(2);
  });

  it('reports failed initialization instead of spacing before settings are available', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let failSettings!: (error: Error) => void;
    const settings = new Promise<Settings>((_resolve, reject) => {
      failSettings = reject;
    });
    const { pangu, click } = await loadContentScript(settings);
    const response = click();
    failSettings(new Error('Storage is unavailable'));
    expect(await response).toEqual({ success: false });
    expect(pangu.autoSpacingPage).not.toHaveBeenCalled();
  });

  it('does not carry a pending manual click to a different URL', async () => {
    let finishSettings!: (settings: Settings) => void;
    const settings = new Promise<Settings>((resolve) => {
      finishSettings = resolve;
    });
    const { pangu, click } = await loadContentScript(settings);
    const response = click();
    location.href = 'https://example.com/next';
    finishSettings({ ...DEFAULT_SETTINGS, spacing_mode: 'spacing_when_click' });
    expect(await response).toEqual({ success: false });
    expect(pangu.autoSpacingPage).not.toHaveBeenCalled();
  });

  it('reports a failed manual start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { pangu, click } = await loadContentScript({ ...DEFAULT_SETTINGS, spacing_mode: 'spacing_when_click' });
    pangu.autoSpacingPage.mockImplementation(() => {
      throw new Error('Spacing failed');
    });
    expect(await click()).toEqual({ success: false });
  });
});

describe('automatic spacing activation', () => {
  it('reapplies URL filters after a manual override', async () => {
    const { pangu, click, navigate } = await loadContentScript(DEFAULT_SETTINGS, 'https://example.com/');
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(1);
    expect(pangu.onTextNodesSettled).toBeTypeOf('function');

    const excludedUrl = 'https://docs.google.com/document/d/abc';
    navigate(excludedUrl);
    expect(pangu.stopAutoSpacingPage).toHaveBeenCalledTimes(1);
    await click();
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(2);
    navigate(excludedUrl);
    expect(pangu.stopAutoSpacingPage).toHaveBeenCalledTimes(1);
    navigate(`${excludedUrl}?next`);
    expect(pangu.stopAutoSpacingPage).toHaveBeenCalledTimes(2);
    navigate('https://example.com/next');
    expect(pangu.autoSpacingPage).toHaveBeenCalledTimes(3);
    expect(aiSpacing.warmUpAiSpacing).toHaveBeenCalledTimes(3);
  });
});
