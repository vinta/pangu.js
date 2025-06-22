/**
 * Check if a URL matches any of the given match patterns using URLPattern API
 * Chrome match pattern format: <scheme>://<host><path>
 * https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
 */
export function isUrlMatchPatterns(url: string, matchPatterns: string[]): boolean {
  return matchPatterns.some(pattern => {
    try {
      // Handle special case
      if (pattern === '<all_urls>') {
        return new URLPattern({ protocol: '{http,https,file,ftp}' }).test(url);
      }

      // URLPattern supports Chrome match patterns directly for most cases!
      const urlPattern = new URLPattern(pattern);
      return urlPattern.test(url);
    } catch {
      // Some patterns like *.example.com/* might not work directly
      // Fall back to manual conversion for those cases
      try {
        const urlPattern = convertComplexPattern(pattern);
        return urlPattern.test(url);
      } catch {
        return false;
      }
    }
  });
}

/**
 * Convert complex Chrome patterns that URLPattern doesn't support directly
 */
function convertComplexPattern(pattern: string): URLPattern {
  // Handle subdomain wildcards like *.example.com/*
  if (pattern.includes('://*.')) {
    const match = pattern.match(/^(\*|https?|file|ftp):\/\/\*\.([^\/]+)(\/.*)?$/);
    if (match) {
      const [, protocol, domain, pathname = '/*'] = match;
      return new URLPattern({
        protocol: protocol === '*' ? '{http,https}' : protocol,
        hostname: `{,*.}${domain}`,
        pathname
      });
    }
  }
  
  throw new Error('Unsupported pattern format');
}

/**
 * Validate if a string is a valid Chrome extension match pattern
 */
export function isValidMatchPattern(pattern: string): boolean {
  if (pattern === '<all_urls>') {
    return true;
  }

  try {
    // Try direct URLPattern first
    new URLPattern(pattern);
    return true;
  } catch {
    // Try complex pattern conversion
    try {
      convertComplexPattern(pattern);
      return true;
    } catch {
      return false;
    }
  }
}