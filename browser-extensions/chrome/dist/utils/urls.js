function isValidMatchPattern(pattern) {
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
export {
  isValidMatchPattern as i
};
