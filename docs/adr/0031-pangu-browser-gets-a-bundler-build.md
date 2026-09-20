# `pangu/browser` gets a bundler build, and the extension uses it like everyone else

`pangu/browser` pointed at `dist/browser/pangu.js`, the single file made for CDNs. It inlines the engine. A bundle importing `pangu/browser` and `pangu/shared` carried the engine twice, the same trap [ADR 0029](0029-shared-is-a-public-entry.md) recorded for the pangu.space Worker. Measured on the extension's content script: 54.6 KB with source imports, 74.2 KB with those 2 package paths.

`src/browser/pangu.ts` is now `src/browser/index.ts`, and it builds twice:

- `dist/browser/index.js`: what `pangu/browser` resolves to. It imports `../shared/index.js` and its own `dom/` and `scheduling/` files, built by the `defaultEsm` environment of [ADR 0030](0030-node-esm-and-cli-import-the-shared-entry.md)
- `dist/browser/pangu.js`: the same source as one self-contained file, for CDNs and for people who download it. Same path as before, 0 imports

`dist/browser/pangu.umd.js` does not change. The rename is what lets both builds exist: with `preserveModules` the output path is the source path, so an entry named `pangu.ts` would write over the CDN file.

`pangu/browser` also exports `DomWalker`. The extension needs `DomWalker.isIgnoredElement()`, and a regular caller could not reach it. Its statics follow the same rule as the shared patterns in ADR 0029: they can be renamed or removed in any release.

## The extension is a regular caller

The Chrome extension imported `../../../src/browser/pangu` and `src/shared/index` directly. It could reach things no user can, and nothing in this repo used `exports` the way pangu.space does.

Now it imports `pangu/browser` and `pangu/shared`, and reads the built `dist/`. One exception: `browser-extensions/chrome/package.json` says `"pangu": "file:../.."`, so `node_modules/pangu` is a symlink to this repo. We never need to publish to develop the extension and the core together. The content script is the same size as before (54,650 to 54,656 bytes), with 1 engine.

`npm run setup:extension` creates the symlink, and `build:extension` runs it first. A `postinstall` hook would never fire: `ignore-scripts` is on locally and in CI. It writes no lockfile, a symlink has no version to lock. The zip script excludes `node_modules/` and `package.json`, because `zip -r` follows the symlink and would pack the whole repo.

The extension reads `dist/`, so after editing `src/` run `build:lib` before `build:extension`. `test:extension` builds first, like `test:shared` and `test:node`.

It costs 2 things:

- DevTools shows the engine as `dist/shared/index.js` and `dist/browser/*.js`, not the `.ts` sources. The content script's sourcemap stops at the built files, the same view any package user gets. They are unminified, one file per source module
- cdnjs mirrors `browser/*.js`, so it will pick up `browser/index.js`, whose `./dom/` and `./scheduling/` imports it does not mirror. Nobody is sent to that URL. The fix is a PR to cdnjs/packages: exclude `index.js` or widen the globs

Not taken:

- Making `dist/browser/pangu.js` itself import its siblings. It breaks one-file downloads, and cdnjs would need a PR to mirror `browser/dom/` and `browser/scheduling/`
- A narrow `isIgnoredElement()` on `BrowserPangu`. One more name to keep, and the next thing the extension needs from `DomWalker` would ask the same question again
- Root `workspaces` with `"pangu": "*"`. npm installed the registry copy with no warning, because workspaces link workspace packages, never the root
- No `package.json` at all. Node.js resolves `pangu/browser` through the root `exports` by self-reference, and it passed every check. The dependency stays invisible in the extension folder
- Moving the extension scripts into `chrome/package.json`. The tests, typecheck, lint and `vite` stay at the root, so it only splits the commands across 2 files
