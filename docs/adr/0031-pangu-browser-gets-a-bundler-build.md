# `pangu/browser` gets a bundler build

`pangu/browser` pointed at `dist/browser/pangu.js`, the single file made for CDNs. It inlines the engine. A bundle importing `pangu/browser` and `pangu/shared` carried the engine twice, the same trap [ADR 0029](0029-shared-is-a-public-entry.md) recorded for the pangu.space Worker. Measured on the extension's content script: 54.6 KB with source imports, 74.2 KB with those 2 package paths.

`src/browser/pangu.ts` is now `src/browser/index.ts`, and it builds twice:

- `dist/browser/index.js`: what `pangu/browser` resolves to. It imports `../shared/index.js` and its own `dom/` and `scheduling/` files, built by the `defaultEsm` environment of [ADR 0030](0030-node-esm-and-cli-import-the-shared-entry.md)
- `dist/browser/pangu.js`: the same source as one self-contained file, for CDNs and for people who download it. Same path as before, 0 imports

`dist/browser/pangu.umd.js` does not change. The rename is what lets both builds exist: with `preserveModules` the output path is the source path, so an entry named `pangu.ts` would write over the CDN file.

`pangu/browser` also exports `DomWalker`. The extension needs `DomWalker.isIgnoredElement()`, and a regular caller could not reach it. Its statics follow the same rule as the shared patterns in ADR 0029: they can be renamed or removed in any release.

Not taken:

- Making `dist/browser/pangu.js` itself import its siblings. It breaks one-file downloads, and cdnjs would need a PR to mirror `browser/dom/` and `browser/scheduling/`
- A narrow `isIgnoredElement()` on `BrowserPangu`. One more name to keep, and the next thing the extension needs from `DomWalker` would ask the same question again
