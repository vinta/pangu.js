import type { Settings } from './types';

export function isValidMatchPattern(pattern: string) {
  // We only allow:
  // https://
  // http://
  // *://
  if (!pattern.match(/^(https?:\/\/|\*:\/\/)/)) {
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
  // valid urls, e.g., http://, https://
  // invalid urls, e.g., chrome://extensions/, chrome://flags/, file://, ftp://
  return /^http(s?)/i.test(url);
}

function isUrlExcludedByFilter(current: Settings, url: string) {
  const urlPatterns = current[current.filter_mode];
  for (const pattern of urlPatterns) {
    try {
      const urlPattern = new URLPattern(pattern);
      if (urlPattern.test(url)) {
        // If URL matches blacklist, it is excluded
        // If URL matches whitelist, it is not excluded
        return current.filter_mode === 'blacklist';
      }
    } catch {
      // Invalid pattern, skip
    }
  }

  // If no patterns matched:
  // - For blacklist mode: not excluded (not blacklisted)
  // - For whitelist mode: excluded (not whitelisted)
  return current.filter_mode === 'whitelist';
}

// Drives the popup status row (顯靈中/神隱中): stricter than shouldShowOffIcon below, it also reports pages the extension cannot run on as inactive
export function shouldShowActiveStatus(current: Settings, url: string | undefined) {
  if (!url || !isValidUrl(url)) {
    return false;
  }

  // If in manual mode, content script shouldn't be active
  if (current.spacing_mode === 'spacing_when_click') {
    return false;
  }

  return !isUrlExcludedByFilter(current, url);
}

// The off icon only calls out spacing the user turned off themselves: manual mode, or a url excluded by their blacklist/whitelist. Pages the extension merely cannot run on (chrome://, new tab pages, urls it cannot read) keep the default icon.
export function shouldShowOffIcon(current: Settings, url: string | undefined) {
  if (current.spacing_mode !== 'spacing_when_load') {
    return true;
  }
  if (!url) {
    return false;
  }
  return isUrlExcludedByFilter(current, url);
}
