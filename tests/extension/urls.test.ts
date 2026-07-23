import { DEFAULT_SETTINGS } from '../../browser-extensions/chrome/src/utils/settings';
import type { Settings } from '../../browser-extensions/chrome/src/utils/types';
import { isValidUrl, shouldContentScriptBeActive } from '../../browser-extensions/chrome/src/utils/urls';
import { describe, expect, it } from 'vitest';

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('isValidUrl', () => {
  it('accepts http, https, and file urls', () => {
    expect(isValidUrl('http://example.com/')).toBe(true);
    expect(isValidUrl('https://example.com/')).toBe(true);
    expect(isValidUrl('file:///Users/vinta/test.html')).toBe(true);
  });

  it('rejects browser-internal and unsupported schemes', () => {
    expect(isValidUrl('chrome://extensions/')).toBe(false);
    expect(isValidUrl('chrome://newtab/')).toBe(false);
    expect(isValidUrl('ftp://example.com/')).toBe(false);
  });
});

describe('shouldContentScriptBeActive', () => {
  it('is inactive without a url, as on pages whose url the extension cannot see', () => {
    expect(shouldContentScriptBeActive(makeSettings(), undefined)).toBe(false);
    expect(shouldContentScriptBeActive(makeSettings(), '')).toBe(false);
  });

  it('is inactive on browser-internal pages', () => {
    expect(shouldContentScriptBeActive(makeSettings(), 'chrome://extensions/')).toBe(false);
  });

  it('is inactive everywhere in manual mode', () => {
    const current = makeSettings({ spacing_mode: 'spacing_when_click' });
    expect(shouldContentScriptBeActive(current, 'https://example.com/')).toBe(false);
  });

  it('is active on pages not matching the blacklist', () => {
    expect(shouldContentScriptBeActive(makeSettings(), 'https://example.com/')).toBe(true);
  });

  it('is inactive on blacklisted pages', () => {
    expect(shouldContentScriptBeActive(makeSettings(), 'https://docs.google.com/document/d/abc')).toBe(false);
    expect(shouldContentScriptBeActive(makeSettings(), 'https://www.netflix.com/browse')).toBe(false);
  });

  it('skips invalid patterns instead of failing', () => {
    const current = makeSettings({ blacklist: ['not-a-pattern', 'https://example.com/*'] });
    expect(shouldContentScriptBeActive(current, 'https://example.com/foo')).toBe(false);
    expect(shouldContentScriptBeActive(current, 'https://other.com/')).toBe(true);
  });

  it('is active only on whitelisted pages in whitelist mode', () => {
    const current = makeSettings({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'] });
    expect(shouldContentScriptBeActive(current, 'https://example.com/foo')).toBe(true);
    expect(shouldContentScriptBeActive(current, 'https://other.com/')).toBe(false);
  });

  it('is inactive everywhere in whitelist mode with an empty whitelist', () => {
    const current = makeSettings({ filter_mode: 'whitelist' });
    expect(shouldContentScriptBeActive(current, 'https://example.com/')).toBe(false);
  });
});
