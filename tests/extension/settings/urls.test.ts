import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../../../browser-extensions/chrome/src/settings/storage';
import { isValidMatchPattern, isValidUrl, shouldAutoSpace, shouldShowActiveStatus, shouldShowOffIcon } from '../../../browser-extensions/chrome/src/settings/urls';

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('isValidMatchPattern', () => {
  it('accepts the subset of Chrome match patterns from ADR 0023', () => {
    expect(isValidMatchPattern('*://*.example.com/*')).toBe(true);
    expect(isValidMatchPattern('http://localhost:3000/*')).toBe(true);
    expect(isValidMatchPattern('https://github.com/*/*/blob/*')).toBe(true);
    expect(isValidMatchPattern('https://www.google.com/search?*')).toBe(true);
  });

  it('rejects what Chrome rejects and what the content script never runs on', () => {
    expect(isValidMatchPattern('not-a-pattern')).toBe(false);
    expect(isValidMatchPattern('https://example.com')).toBe(false);
    expect(isValidMatchPattern('https://*example.com/*')).toBe(false);
    expect(isValidMatchPattern('file:///Users/vinta/*')).toBe(false);
    expect(isValidMatchPattern('<all_urls>')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts http and https urls', () => {
    expect(isValidUrl('http://example.com/')).toBe(true);
    expect(isValidUrl('https://example.com/')).toBe(true);
  });

  it('rejects browser-internal and unsupported schemes', () => {
    expect(isValidUrl('chrome://extensions/')).toBe(false);
    expect(isValidUrl('chrome://newtab/')).toBe(false);
    expect(isValidUrl('file:///Users/vinta/test.html')).toBe(false);
    expect(isValidUrl('ftp://example.com/')).toBe(false);
  });
});

describe('shouldShowActiveStatus', () => {
  it('is inactive without a url, as on pages whose url the extension cannot see', () => {
    expect(shouldShowActiveStatus(makeSettings(), undefined)).toBe(false);
    expect(shouldShowActiveStatus(makeSettings(), '')).toBe(false);
  });

  it('is inactive on browser-internal pages', () => {
    expect(shouldShowActiveStatus(makeSettings(), 'chrome://extensions/')).toBe(false);
  });

  it('is inactive everywhere in manual mode', () => {
    const current = makeSettings({ spacing_mode: 'spacing_when_click' });
    expect(shouldShowActiveStatus(current, 'https://example.com/')).toBe(false);
  });

  it('is active on pages not matching the blacklist', () => {
    expect(shouldShowActiveStatus(makeSettings(), 'https://example.com/')).toBe(true);
  });

  it('is inactive on blacklisted pages', () => {
    expect(shouldShowActiveStatus(makeSettings(), 'https://docs.google.com/document/d/abc')).toBe(false);
    expect(shouldShowActiveStatus(makeSettings(), 'https://www.netflix.com/browse')).toBe(false);
  });

  it('skips invalid patterns instead of failing', () => {
    const current = makeSettings({ blacklist: ['not-a-pattern', 'https://example.com/*'] });
    expect(shouldShowActiveStatus(current, 'https://example.com/foo')).toBe(false);
    expect(shouldShowActiveStatus(current, 'https://other.com/')).toBe(true);
  });

  it('is active only on whitelisted pages in whitelist mode', () => {
    const current = makeSettings({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'] });
    expect(shouldShowActiveStatus(current, 'https://example.com/foo')).toBe(true);
    expect(shouldShowActiveStatus(current, 'https://other.com/')).toBe(false);
  });

  it('is inactive everywhere in whitelist mode with an empty whitelist', () => {
    const current = makeSettings({ filter_mode: 'whitelist' });
    expect(shouldShowActiveStatus(current, 'https://example.com/')).toBe(false);
  });
});

describe('shouldShowOffIcon', () => {
  it('shows the off icon everywhere in manual mode, even on pages without a url', () => {
    const current = makeSettings({ spacing_mode: 'spacing_when_click' });
    expect(shouldShowOffIcon(current, 'https://example.com/')).toBe(true);
    expect(shouldShowOffIcon(current, undefined)).toBe(true);
  });

  it('keeps the default icon on pages the extension merely cannot run on', () => {
    expect(shouldShowOffIcon(makeSettings(), undefined)).toBe(false);
    expect(shouldShowOffIcon(makeSettings(), '')).toBe(false);
    expect(shouldShowOffIcon(makeSettings(), 'chrome://extensions/')).toBe(false);
  });

  it('keeps the default icon on pages not matching the blacklist', () => {
    expect(shouldShowOffIcon(makeSettings(), 'https://example.com/')).toBe(false);
  });

  it('shows the off icon on blacklisted pages', () => {
    expect(shouldShowOffIcon(makeSettings(), 'https://docs.google.com/document/d/abc')).toBe(true);
  });

  it('shows the off icon on non-whitelisted pages in whitelist mode', () => {
    const current = makeSettings({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'] });
    expect(shouldShowOffIcon(current, 'https://example.com/foo')).toBe(false);
    expect(shouldShowOffIcon(current, 'https://other.com/')).toBe(true);
  });
});

describe('shouldAutoSpace', () => {
  it('waits for a click in manual mode, regardless of URL filters', () => {
    const current = makeSettings({ spacing_mode: 'spacing_when_click' });
    expect(shouldAutoSpace(current, 'https://example.com/')).toBe(false);
    expect(shouldAutoSpace(current, 'https://docs.google.com/document/d/abc')).toBe(false);
  });

  it('spaces pages not matching the blacklist', () => {
    expect(shouldAutoSpace(makeSettings(), 'https://github.com/vinta/pangu.js')).toBe(true);
  });

  it('stops on blacklisted pages', () => {
    expect(shouldAutoSpace(makeSettings(), 'https://github.com/vinta/pangu.js/issues/316')).toBe(false);
    expect(shouldAutoSpace(makeSettings(), 'https://github.com/vinta/pangu.js/blob/master/README.md')).toBe(false);
  });

  it('spaces only whitelisted pages in whitelist mode', () => {
    const current = makeSettings({ filter_mode: 'whitelist', whitelist: ['https://example.com/*'] });
    expect(shouldAutoSpace(current, 'https://example.com/foo')).toBe(true);
    expect(shouldAutoSpace(current, 'https://other.com/')).toBe(false);
  });

  it('reads a host wildcard as the host and every subdomain, as Chrome does', () => {
    const current = makeSettings({ blacklist: ['*://*.example.com/*'] });
    expect(shouldAutoSpace(current, 'https://example.com/')).toBe(false);
    expect(shouldAutoSpace(current, 'https://www.example.com/')).toBe(false);
    expect(shouldAutoSpace(current, 'https://example.com.evil.net/')).toBe(true);
  });

  it('matches any port unless the pattern names one, as Chrome does', () => {
    const current = makeSettings({ blacklist: ['http://localhost/*', 'https://example.com:8443/*'] });
    expect(shouldAutoSpace(current, 'http://localhost:3000/app')).toBe(false);
    expect(shouldAutoSpace(current, 'https://example.com:8443/')).toBe(false);
    expect(shouldAutoSpace(current, 'https://example.com/')).toBe(true);
  });

  it('matches the query part when the pattern has one, and a missing query too', () => {
    const current = makeSettings({ blacklist: ['https://www.google.com/search?*'] });
    expect(shouldAutoSpace(current, 'https://www.google.com/search?q=pangu')).toBe(false);
    expect(shouldAutoSpace(current, 'https://www.google.com/search')).toBe(false);
    expect(shouldAutoSpace(current, 'https://www.google.com/maps?q=pangu')).toBe(true);
  });

  it('reads every path character except `*` literally', () => {
    const current = makeSettings({ blacklist: ['https://en.wikipedia.org/wiki/C++*', 'https://en.wikipedia.org/wiki/Python_(programming_language)'] });
    expect(shouldAutoSpace(current, 'https://en.wikipedia.org/wiki/C++')).toBe(false);
    expect(shouldAutoSpace(current, 'https://en.wikipedia.org/wiki/Python_(programming_language)')).toBe(false);
    expect(shouldAutoSpace(current, 'https://en.wikipedia.org/wiki/Python')).toBe(true);
  });
});
