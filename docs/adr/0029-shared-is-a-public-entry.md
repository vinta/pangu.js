# `pangu/shared` is a public entry

[pangu.space](https://pangu.space)'s API Worker detects ambiguous shapes with the same regexes `spaceText()` applies. `exports` listed only `.` and `./browser`, so it vendored a copy of `CJK` and `DIGIT_PLUS_CJK` that had to be re-copied on every version bump.

Add `./shared` to `exports`, pointing at the `dist/shared/index.js` and `dist/shared/index.d.ts` the tarball already ships. ESM only, same shape as `./browser`. No build change. `lint:package` runs `attw` on it with the `esm-only` profile, because the script lists entrypoints by hand.

The `export` keyword in `src/shared/index.ts` is the public surface. Every exported name is API now: renaming or unexporting one is a breaking change. That includes `Pangu`, `PlaceholderReplacer` and a bare `pangu` instance, which is a feature: a Worker imports the engine and the patterns from one path and bundles one copy (16.9 KB). Importing `pangu` plus the patterns from a second path bundled the engine twice (34.2 KB), because the node entry inlines it per [ADR 0012](0012-cjs-half-is-self-contained.md).

Not taken:

- A `src/shared/patterns.ts` split behind `pangu/shared/patterns`. It needs a new build environment and importer changes, and the Worker still bundles every pattern twice
- Re-exporting the patterns from `.`. The CJS half would need a class field per constant, and `./browser` would not match

`pangu` is an instance on every path, of a different class each: `NodePangu` from `.`, `BrowserPangu` from `./browser`, `Pangu` from `./shared`. Types match runtime on each path, so the trap in [ADR 0010](0010-dot-entry-is-the-node-build.md) does not return.

The `g`-flag patterns are the engine's own objects. `spaceText()` only calls `.replace()`, which resets `lastIndex`, so a caller's `.test()` cannot corrupt spacing. It can still surprise the caller, so the README says so.
