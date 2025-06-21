const DEFAULT_SETTINGS = {
  spacing_mode: "spacing_when_load",
  spacing_rule: "blacklists",
  blacklists: [
    // TODO: support regex
    "//docs.google.com",
    "//gist.github.com",
    "/blob/",
    "/commit/",
    "/pull/"
  ],
  whitelists: [],
  is_mute_sound_effects: false
};
export {
  DEFAULT_SETTINGS as D
};
