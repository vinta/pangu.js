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
