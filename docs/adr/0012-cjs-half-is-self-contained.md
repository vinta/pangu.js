# 0012. pangu still ships CommonJS, and the CJS pass is self-contained

Date: 2026-07-27

## Status

Accepted.

## Context

Two questions get asked of this build, and they have the same answer often enough that they belong in one record.

**Why ship CommonJS at all in 2026?** Node 22 and later can `require()` an ESM module, so the usual argument for a dual package is gone. The blocker is not resolution, it is shape. `require(esm)` returns the module namespace object, so `const pangu = require('pangu')` would hand back `{ default, pangu, NodePangu, __esModule }` instead of the instance. The README has documented `const pangu = require('pangu')` returning the instance for years.

Node does provide an escape hatch. An ESM module can `export { pangu as "module.exports" }`, and `require()` then returns exactly that value. This was tested and works, including destructuring. It was rejected for two reasons. First, that interop ships unflagged only in Node 20.19+ and 22.12+, so with `engines` at `>=20.0.0` an ESM-only package would break `require('pangu')` on every Node 20 before 20.19. Second, and independent of Node versions, Jest's CJS test environment implements its own `require` on top of the vm module and never inherits Node's `require(esm)`, so every Jest consumer that loads pangu without ESM transform configuration depends on a real CJS file existing. pangu is widely enough installed that the CJS half is cheap insurance against both. If that calculus changes, this is the route: it deletes the `.cts` source and two thirds of the build config. Re-evaluated against the Node docs and kept on 2026-07-27.

**Why does the CJS half need its own source file?** `export = pangu` is TypeScript's only syntax for `module.exports = <value>`, and it is legal only in a CJS-emitting file. Under `verbatimModuleSyntax` that file must also use `require` rather than `import`. So `src/node/index.cts` exists because of a language constraint, not a preference.

What it should **not** do is re-implement `NodePangu`. It used to, alongside a hand-wired cross-output dependency: it did `require('../shared/index.cjs')`, and the config marked that literal string external with `makeAbsoluteExternalsRelative: false` so Rolldown would not rewrite it. That made one bundler pass depend on a file another pass of the same build emits, and it required a dedicated `sharedCjs` environment whose only output was a 14.5 KB file no consumer could reach, since `exports` exposes only `.` and `./browser`.

That externalization avoided no duplication. `dist/shared/index.cjs` was already a byte-for-byte CJS twin of `dist/shared/index.js`.

## Decision

The CJS pass is self-contained. `src/node/index.cts` requires the ESM entry and lets the bundler inline everything it needs.

This deletes the `sharedCjs` environment, the `'../shared/index.cjs'` external, `makeAbsoluteExternalsRelative: false`, the duplicated `NodePangu` class, and the two comments that existed to explain the hack. Externals are for other people's packages, not for another output of your own build.

The require binding is aliased (`const { NodePangu: NodePanguClass } = ...`). Without the alias it collides with the inlined `class NodePangu`, and Rolldown renames the class to `NodePangu$1`, which is observable through `constructor.name` and in stack traces.

## Consequences

**A TypeScript 5.3+ floor on `index.d.cts`, accepted deliberately.** Because the `.cts` now references types from the ESM entry, `tsc` emits `typeof import("./index.js", { with: { "resolution-mode": "import" } })`. That `with` syntax needs TypeScript 5.3 or later on the consumer side. The old duplicated class was quietly buying portability to older TypeScript. This is the one real cost of the change, `attw` does not flag it, and it is the thing to revisit if someone reports it.

**Package grows by about 3 KB.** `dist/node/index.cjs` goes from 0.6 KB to 18.3 KB, while `dist/shared/index.cjs` (14.5 KB) stops being emitted. Net change on a roughly 504 KB package.

**Build order stopped mattering for the CJS pass.** It no longer reads another environment's output, so the only remaining ordering constraint in `builder.buildApp` is that `esm` runs first because it is the one that empties `dist/`.

**Verified.** The `require()` surface is unchanged: `constructor.name` is still `NodePangu`, `spacingText()` works, `const { NodePangu } = require('pangu')` destructures, and `.default` and `.pangu` are present. `attw` is green on all four resolution modes, `publint` reports no problems, and `export = pangu` still appears in the emitted `.d.cts`.

## Notes

Vite library mode was kept over tsdown, which is otherwise the better-fitting tool for this job and is slated to become Rolldown Vite's library mode. The reason is local: Vite is not removable from this repo because the Chrome extension build needs it, so adopting tsdown would mean running two bundlers to save a config file. Worth revisiting if the extension build ever moves or if Vite's own library mode absorbs tsdown.
