/**
 * Check if a URL matches any of the given match patterns using URLPattern API
 * Chrome match pattern format: <scheme>://<host><path>
 * https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
 */
export function isUrlMatchPatterns(url: string, matchPatterns: string[]): boolean {
  return matchPatterns.some((pattern) => {
    try {
      // Handle special case
      if (pattern === '<all_urls>') {
        return new URLPattern({ protocol: '{http,https,file}' }).test(url);
      }

      // URLPattern supports Chrome match patterns directly, including subdomain wildcards!
      const urlPattern = new URLPattern(pattern);
      return urlPattern.test(url);
    } catch {
      return false;
    }
  });
}

/**
 * Validate if a string is a valid Chrome extension match pattern
 * Only allows https://, http://, file://, or *:// protocols
 */
export function isValidMatchPattern(pattern: string): boolean {
  if (pattern === '<all_urls>') {
    return true;
  }

  // Only allow:
  // https://
  // http://
  // file:///
  // *:// which matches only http or https
  if (!pattern.match(/^(https?:\/\/|file:\/\/\/|\*:\/\/)/)) {
    return false;
  }

  try {
    // URLPattern supports Chrome match patterns directly, including subdomain wildcards!
    new URLPattern(pattern);
    return true;
  } catch {
    return false;
  }
}
