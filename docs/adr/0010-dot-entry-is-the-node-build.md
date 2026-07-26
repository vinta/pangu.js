# 0010. The `.` entry is the Node.js build, and nothing swaps it for the browser

Date: 2026-07-27

## Status

Accepted. Removes the top-level `browser` field introduced long before `exports` existed. Shipped in v9.0.0.

## Context

`package.json` carried a legacy `browser` field that told bundlers to substitute the browser build whenever they resolved the `.` entry:

```json
"browser": {
  "./dist/node/index.js": "./dist/browser/pangu.js",
  "./dist/node/index.cjs": "./dist/browser/pangu.umd.js"
}
```

Every bundler that reads that field honored it. TypeScript does not. `tsc` deliberately excludes `browser` from its condition set under every `moduleResolution` mode, and `customConditions` is the only way to add it, which is a setting only the consumer can write. There is no package-side switch that makes types follow the swap.

So `.` meant two different classes depending on who was asking, and the two classes have genuinely different surfaces: `NodePangu` has `spacingFile()` and `spacingFileSync()`, `BrowserPangu` has `spacingNode()` and `autoSpacingPage()`.

Both directions were wrong, and one of them was dangerous. Measured against the published v8.2.0 package in a Vite app with `moduleResolution: bundler`:

```ts
import pangu from 'pangu';
pangu.spacingNode(document.body);  // TS2339, but works at runtime
pangu.spacingFile('./some.txt');   // typechecks clean, throws at runtime
```

The second line is the one that forced the decision. `typeof pangu.spacingFile` is `undefined` in that bundle. TypeScript was blessing a call that crashes, and `attw` cannot detect it because `attw` does not model the `browser` condition either.

The obvious modern fix looked like upgrading the legacy field to a `browser` condition inside `exports`, which is what `publint` suggests and what current packaging guides recommend. That was tested and rejected: it moves the swap onto a standardized mechanism but changes nothing about the type side, so the trap survives. It also widens the swap to exports-only resolvers such as esm.sh and Deno, which the legacy field never reached.

## Decision

`.` is the Node.js build. It resolves to `NodePangu` for types and for runtime, in every resolver, with no substitution anywhere.

The top-level `browser` field is deleted, and no `browser` condition is added in its place. Browser code uses the `./browser` subpath, which has always been the documented path and whose types have always matched its runtime.

The condition is not merely unused, it is refused. A future reader following `publint` or a packaging guide will be tempted to add it back. Adding it restores the mismatch this ADR exists to remove.

## Consequences

**This is a breaking change, hence v9.0.0.** Browser code doing bare `import pangu from 'pangu'` and calling `spacingNode()` or `autoSpacingPage()` worked before and throws now. That code has always had a type error, so the break is visible to anyone who typechecks, but it is a real runtime break for anyone who did not.

**`spacingText()` in the browser is unaffected.** The Node build works in a browser bundle. `node:fs` is imported at module scope but only touched inside `spacingFile()` and `spacingFileSync()`, and bundlers stub it, so the text engine runs normally. Verified: a Vite browser build of `import pangu from 'pangu'; pangu.spacingText('當你凝視著bug')` returns `當你凝視著 bug`. Bundlers do emit an externalization warning for `node:fs`, which is a useful nudge toward `pangu/browser`.

**Consumers who want the old behavior have a supported route.** Setting `customConditions: ["browser"]` in tsconfig is the TypeScript-sanctioned mechanism, but it only helps if a `browser` condition exists, and this ADR is the decision not to publish one. The supported route is `pangu/browser`.

**`publint` now passes clean.** Its standing suggestion was specifically about the object-valued `browser` field, so removing the field resolves it rather than ignoring it.

**`main` and `module` stay.** Both point at the Node build, which is now unambiguously what `.` means, so they are consistent with `exports` rather than in tension with it.

**Verified.** `attw` is green on all four resolution modes for `.` and on the esm-only profile for `./browser`. `publint` reports no problems.
