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

export function isUrlMatchPatterns(url: string, matchPatterns: string[]) {
  return matchPatterns.some((pattern) => {
    try {
      const urlPattern = new URLPattern(pattern);
      return urlPattern.test(url);
    } catch {
      return false;
    }
  });
}
