# Architecture review (2026-07-18)

Follow-up to `docs/architecture-review-2026-07-17.md`, scoped to `src/` with the ask "simplify logic, call flows, interfaces". The generated HTML report lived outside the repo, so this file is the durable record of its candidates and their outcomes. Vocabulary: `CONTEXT.md` (text spacing, boundary spacing, pangu element) plus the deep-module terms module, interface, seam, adapter, depth, locality.

## 1. One scheduling seam in the browser DOM processor

Restated candidate 4 phase 1 of the 2026-07-17 review: the sync-or-queued decision was re-read at four sites and the visibility flag at three more, and the observer path re-implemented `spacingNode`'s dispatch with different semantics.

Outcome: already shipped the same day the review was generated (structural `8801602`, behavioral `5bcad19`, veto follow-up `7bed8e4`, spec #290). The phase-1 outcome note lives in the 2026-07-17 doc. Phase 2 stays parked (#291, Safari `requestIdleCallback`).

## 2. One boundary climb, owned by DomWalker

Boundary spacing derived its DOM facts from four hand-rolled tree climbs per pair with two subtly different stop rules: `findCurrentBoundaryNode` and `findNextBoundaryNode` stopped ON a space-sensitive node while the two climbs inside the between-runs scan stopped BELOW a space-sensitive parent. The divergence required a `containerOfNext` compensation inside the scan, and the scan could both miss real whitespace (it started inside `<a>`, where the run has no siblings) and read whitespace sitting past the boundary.

Outcome: landed via the #289 recipe. Structural `684efc2` moved both climbs into `DomWalker.findBoundaryNode` and a temporary `DomWalker.findScanAncestor`, preserving each stop rule bit-for-bit. Behavioral `ae0bb91` deleted `findScanAncestor` and rewrote `scanBetweenTextRuns` to walk the document-order gap between the two boundary nodes (climb from the current boundary, then descend into the sibling holding the next boundary). Two climbs per pair, one stop rule, no compensation. The unification fixed two bugs on the way, pinned by four Playwright tests: a missed space when a wrapped link is followed by trailing text (whitespace past the boundary no longer vetoes), and redundant DOM spaces when real whitespace already separates runs across a space-sensitive edge.

## 3. Flatten the text spacing engine's duplicate branches

`spacingText`'s slash-count fork wrote the same three replaces twice (the `slashCount === 0` and `<= 1` branches were line-for-line identical) and the third branch repeated their first replace. Three regexes were rebuilt on every call while their ~60 siblings live at module scope. `PlaceholderReplacer.reset()` had zero callers, and a `self` alias guarded arrow callbacks that already capture `this`.

Outcome: landed as structural `12c3fa0`. The shared replace is hoisted above a `slashCount <= 1` / else fork, `SINGLE_QUOTE_PURE_CJK`, the bracket-fix patterns, and the final-hashtag regex moved to module scope, and `reset()` and the alias are gone. Module-scope `/g` regexes are safe here because they are only used with `String.replace`, which resets `lastIndex`, and are never re-entered from their own replace callbacks. Keep that invariant when hoisting more patterns.

## Verified facts, not candidates

- `VisibilityDetector`'s five `commonHiddenPatterns` sub-flags were interface surface no caller ever flipped. Outcome: pruned in `42a7c2b`, riding the 8.0.0 major. The hidden-element checks stay, gated only by `enabled`. `stopAutoSpacingPage` stays too: it is documented API and the escape hatch for `autoSpacingPage`, so removing it would be a feature removal, not a tidy.
- The chunked path silently skips boundary spacing at every chunk seam, because pairs only form within a chunk. Reachable only with the scheduler on and visibility detection off. Outcome: ticketed as #292, fix deliberately deferred.
- `NodePangu` stays implemented twice (`node/index.ts`, `node/index.cjs.ts`). The CJS wrapper is the module-shape adapter that makes `require('pangu')` return the instance itself. Keep, keep in sync.
