import type { Settings } from './storage';

// Chrome match pattern grammar, in the subset ADR 0023 keeps: <scheme>://<host>[:<port>]<path>
const MATCH_PATTERN = /^(\*|https?):\/\/(\*|(?:\*\.)?[^/*:?]+)(?::(\*|\d+))?(\/[^?]*)(?:\?(.*))?$/;

// A match pattern reads every character except `*` literally, so URLPattern's own syntax gets escaped
function escapeUrlPatternSyntax(part: string) {
  return part.replace(/[(){}:+?\\]/g, '\\$&');
}

// The string form of URLPattern reads a host wildcard (`*.example.com`) as subdomains only and pins a missing port to the scheme default, so the init form carries the match pattern's meaning instead
function matchPatternToUrlPattern(pattern: string): URLPattern | null {
  const match = MATCH_PATTERN.exec(pattern);
  if (!match) {
    return null;
  }
  const [, scheme = '', host = '', port, path = '', query] = match;
  try {
    return new URLPattern({
      protocol: scheme === '*' ? 'http{s}?' : scheme,
      hostname: host.startsWith('*.') ? `{*.}?${host.slice(2)}` : host,
      port: port ?? '*',
      pathname: escapeUrlPatternSyntax(path),
      // Chrome matches the path against path plus query. URLPattern matches the query on its own, so `/search?*` also matches a bare `/search`
      search: query === undefined ? '*' : escapeUrlPatternSyntax(query),
    });
  } catch {
    return null;
  }
}

export function isValidMatchPattern(pattern: string) {
  return matchPatternToUrlPattern(pattern) !== null;
}

export function isValidUrl(url: string) {
  // valid urls, e.g., http://, https://
  // invalid urls, e.g., chrome://extensions/, chrome://flags/, file://, ftp://
  return /^http(s?)/i.test(url);
}

function isUrlExcludedByFilter(settings: Settings, url: string) {
  for (const pattern of settings[settings.filter_mode]) {
    // An invalid pattern is skipped
    if (matchPatternToUrlPattern(pattern)?.test(url)) {
      // If URL matches blacklist, it is excluded
      // If URL matches whitelist, it is not excluded
      return settings.filter_mode === 'blacklist';
    }
  }

  // If no patterns matched:
  // - For blacklist mode: not excluded (not blacklisted)
  // - For whitelist mode: excluded (not whitelisted)
  return settings.filter_mode === 'whitelist';
}

export function shouldAutoSpace(settings: Settings, url: string) {
  return settings.spacing_mode === 'spacing_when_load' && !isUrlExcludedByFilter(settings, url);
}

// Drives the popup status row (顯靈中/神隱中): stricter than shouldShowOffIcon below, it also reports pages the extension cannot run on as inactive
export function shouldShowActiveStatus(settings: Settings, url: string | undefined) {
  if (!url || !isValidUrl(url)) {
    return false;
  }

  // If in manual mode, content script shouldn't be active
  if (settings.spacing_mode === 'spacing_when_click') {
    return false;
  }

  return !isUrlExcludedByFilter(settings, url);
}

export function shouldShowOffIcon(settings: Settings, url: string | undefined) {
  // Manual mode turns spacing off on every tab, including pages without a url
  if (settings.spacing_mode === 'spacing_when_click') {
    return true;
  }

  // Pages the extension merely cannot run on (chrome://, new tab pages, urls it cannot read) show the default icon.
  if (!url) {
    return false;
  }

  return isUrlExcludedByFilter(settings, url);
}
