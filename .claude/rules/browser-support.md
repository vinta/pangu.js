# Browser Support

A build target transpiles syntax only. An API or CSS feature must clear the floor of every product that ships the file, by its own `version_added`, before it goes in.

| Code                             | Floor                                                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/`, `src/browser/`    | the lower of the extension's `minimum_chrome_version` and the library's `build.target` in `vite.config.ts`; `src/shared/` also `engines.node` |
| `browser-extensions/chrome/src/` | `minimum_chrome_version` in `browser-extensions/chrome/manifest.json`                                                                         |
| `src/node/`                      | `engines.node` in `package.json`                                                                                                              |

`eslint.config.js` enforces the `src/shared/` and `src/browser/` floor with `baseline-js/use-baseline`, whose `available` year mirrors `minimum_chrome_version`; a floor bump changes both. Extension-only code is out of its scope because it uses Chrome-only APIs on purpose.

Baseline status alone is not clearance: the extension floor is older than Baseline widely available, and the test browsers are current, so a too-new API passes every test and fails only on users' machines.
