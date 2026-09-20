# The Node.js ESM entry and the CLI import the shared entry

Every output used to inline its own copy of the engine. That was harmless while `dist/shared/index.js` was private. [ADR 0029](0029-shared-is-a-public-entry.md) made it public, so `pangu` and `pangu/shared` became 2 copies of one class in the same module graph:

```js
import pangu from 'pangu';
import { Pangu } from 'pangu/shared';

pangu instanceof Pangu; // false
```

A bundle importing both paths also carried the engine twice (34.2 KB vs 16.9 KB).

`dist/node/index.js` now imports `../shared/index.js`, and `dist/node/cli.js` imports `./index.js`. The `instanceof` check above returns `true`. `dist/node/index.js` goes from 16.5 KB to 0.5 KB, `dist/node/cli.js` from 19.4 KB to 3.0 KB. The file list in `dist/` does not change.

The other 3 outputs stay self-contained, each for its own reason:

- `dist/browser/pangu.js`: a standalone module for people who download it or load it from a CDN. cdnjs only mirrors the paths listed in its config, so a new sibling file would need a PR there
- `dist/browser/pangu.umd.js`: loaded by a plain `<script>` tag, and Vite refuses UMD with multiple entries
- `dist/node/index.cjs`: `require(esm)` needs Node.js 20.19+ while `engines` says `>=20.0.0`, and Jest never gets it, see [ADR 0012](0012-cjs-half-is-self-contained.md)

The build is one environment, `defaultEsm`, with 3 entries and `output.preserveModules`. Multiple entries alone are not enough. On Vite 8.1.5, Rolldown moves the engine into a hashed `shared-6tKhGmJV.js` and turns the public `shared/index.js` into a facade that re-exports mangled aliases. `preserveEntrySignatures` does not change that.

The trigger is the top-level `await main()` in `src/node/cli.ts`. Rolldown merges a common chunk back into its entry, but it turns that off when any module uses top-level await. With the `await` stripped, the same 3 entries build clean without `preserveModules`. We keep `preserveModules` anyway, so one `await` cannot change the published layout. It mirrors `src/`, so every import in `dist/` is the import in the source.

It costs 2 things. `dist/node/index.js` no longer works when copied out alone. A new module under `src/shared/` or `src/node/` becomes a new published file.

Not taken:

- Marking `../shared/index.js` external. ADR 0012 deleted that hack: externals are for other people's packages
- The `module-sync` condition, so `require` and `import` load one ESM file. `require('pangu')` would return the namespace object, not the instance, which ADR 0012 already rejected
- Sharing the CLI but not the Node.js ESM entry, or the reverse. It needs one more environment and the 2 outputs stop matching

Addendum (2026-09-20): `defaultEsm` now has 4 entries. `src/browser/index.ts` joined it as the bundler build of `pangu/browser`, see [ADR 0031](0031-pangu-browser-gets-a-bundler-build.md). `dist/browser/pangu.js` is still self-contained.
