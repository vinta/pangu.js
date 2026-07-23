import type { Settings } from './types';

export function isValidMatchPattern(pattern: string) {
  // We only allow:
  // https://
  // http://
  // file:///
  // *://
  if (!pattern.match(/^(https?:\/\/|file:\/\/\/|\*:\/\/)/)) {
    return false;
  }

  try {
    new URLPattern(pattern);
    return true;
  } catch {
    return false;
  }
}

export function isValidUrl(url: string) {
  // valid urls, e.g., http://, https://, file://
  // invalid urls, e.g., chrome://extensions/, chrome://flags/, ftp://
  return /^(http(s?)|file)/i.test(url);
}

export function shouldContentScriptBeActive(current: Settings, url: string | undefined) {
  if (!url || !isValidUrl(url)) {
    return false;
  }

  // If in manual mode, content script shouldn't be active
  if (current.spacing_mode === 'spacing_when_click') {
    return false;
  }

  // Check blacklist/whitelist
  const urlPatterns = current[current.filter_mode];
  for (const pattern of urlPatterns) {
    try {
      const urlPattern = new URLPattern(pattern);
      if (urlPattern.test(url)) {
        // If URL matches blacklist, should NOT be active
        // If URL matches whitelist, SHOULD be active
        return current.filter_mode === 'whitelist';
      }
    } catch {
      // Invalid pattern, skip
    }
  }

  // If no patterns matched:
  // - For blacklist mode: should be active (not blacklisted)
  // - For whitelist mode: should NOT be active (not whitelisted)
  return current.filter_mode === 'blacklist';
}
