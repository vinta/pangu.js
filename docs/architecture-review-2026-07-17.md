# Architecture review (2026-07-17)

Deepening candidates from a hot-spot-scoped review of the codebase, using the vocabulary in `CONTEXT.md` (boundary spacing, text spacing, pangu element) and the deep-module terms module, interface, seam, adapter, locality, leverage. Candidate 1 shipped in PR #289. Candidates 2 to 4 are recorded here to revisit later. Every file:line and zero-caller claim below was verified against the repo on the review date.

## 1. Boundary spacing module (shipped in #289)

Extract the pair-spacing verdict out of `BrowserPangu.spacingTextNodes` (`src/browser/pangu.ts:152-331`), where pure spacing decisions are interleaved with DOM mutation for 180 lines and reachable only through Playwright.

Decisions already made:

- New DOM-free module `src/browser/boundary-spacing.ts`. Two entry points: a per-pair verdict (`none`, `prepend-next`, `append-current`, `insert-element`) and a per-node rule (trim-leading-after-hidden, standalone-quote prepend).
- Context is flat facts. The module runs the two-character `spacingText` probe itself and owns the visibility veto rules. Tree climbing and tag regexes stay adapter-side in `DomWalker`.
- Strict two-step: commit 1 is purely structural and preserves the hand-rolled narrow regexes bit-for-bit (`/[一-鿿]/` at `pangu.ts:178,246` misses kana). Commit 2 swaps in shared's CJK class and revisits the skipped FIXME at `tests/browser/pangu.playwright.ts:71`.
- Vitest tests for this module import from `src/` as an internal-seam exception to ADR-0001.

Outcome: landed as `src/browser/boundary-spacing.ts` (structural `ab9c586`, behavioral `9739551`). The skipped quote-spacing FIXME turned out to need a text spacing fix, not the class swap: a solitary NBSP normalization (`88ab44c`, #287) unblocked it. The extraction also gave the previously dead `ANY_CJK` export its first importer, removing it from the dead surface inventory below.

## 2. Extension settings module (deferred)

`utils/settings.ts` is shallow, a read-only cache. Reads cross `getCachedSettings()` while twelve raw `chrome.storage.sync.set` writes go around it (3 in `popup.ts`, 7 in `options.ts`, 2 in `service-worker.ts`). The active blacklist or whitelist is re-derived seven times. The extension has zero tests.

Latent race: `getCachedSettings()` returns a live mutable reference. `popup.ts:324` mutates it in place while the cache's own `onChanged` listener rebuilds the object, and `options.ts:21` registers a second `onChanged` listener with no ordering guarantee against the cache's.

Deepening: one settings module owning reads, writes, list operations, and the defaults and migration logic now in `service-worker.ts`. `chrome.storage` becomes an adapter behind the seam, an in-memory adapter unlocks vitest. Two adapters make the seam real.

## 3. Spacing eligibility policy (deferred)

"Which pages get spacing" is implemented twice in two pattern languages. The popup predicts with URLPattern (`popup.ts:236-253`), the service worker registers Chrome match patterns (`service-worker.ts:61-67`), and the repo's own test documents that the semantics diverge on `*://` (`tests/browser/urlpattern.playwright.ts:21-24`).

They already disagree today: `popup.ts:205` accepts `file://` as valid while the manifest no longer grants file host permission, so the popup can show active on pages Chrome never injects into. URL validation is forked three ways (`utils/urls.ts:7`, `popup.ts:205`, hardcoded matches in `service-worker.ts:57`). The injected-file list exists twice (`popup.ts:175`, `service-worker.ts:55`).

Deepening: one eligibility module answering "is this URL eligible" for the popup and emitting the content-script registration for the service worker, with Chrome match-pattern semantics encoded once. Vitest-testable, URLPattern is global in Node 24. `urlpattern.playwright.ts` retires.

## 4. Shrink BrowserPangu's interface (phase 1 shipped in #290, phase 2 deferred)

The interface exposes its internal composition. Callers steer spacing by mutating nested config two levels deep (`pangu.taskScheduler.config.enabled`), the two knobs create three execution paths documented by a 28-line comment (`pangu.ts:51-78`), and that comment has already drifted: it promises visibility-on always batches through requestIdleCallback, but `pangu.ts:338` re-checks the scheduler flag and can fall through to synchronous. The sync-or-async decision is re-read at four sites (`pangu.ts:119,336,338,422` plus `task-scheduler.ts:73`).

The author already designed this once: commit `b641e4b` added a 278-line proposal replacing the config flags with explicit sync and async methods, estimated to remove ~250 lines of branching, later deleted unimplemented. Recover with `git show b641e4b`.

Note: `taskScheduler.config` and `visibilityDetector.config` are documented public npm surface, so this is a major-version change.

Outcome (phase 1, 2026-07-18): the scheduling decision now lives behind one private `schedule()` seam (structural `8801602`, behavioral `5bcad19`, spec #290). The observer drain is mode-blind: sync mode gained cross-node boundary spacing, and the merged runs are now sorted into reverse document order with per-run dedupe, which also fixed wrong-direction pair evaluation in the default queued mode for append-style batches. `processInChunks`, the unreachable sync fallback, the doubled visibility guards, and the 28-line call-flow comment are gone. The config knobs stay public surface; replacing them with explicit sync/async methods remains the major-gated phase 2.

## Dead surface inventory (verified, zero callers)

- `DomWalker.canIgnoreNode` (`dom-walker.ts:58-71`), its rules live duplicated in the TreeWalker filter at `dom-walker.ts:24-43`
- `DomWalker.presentationalTags` (`dom-walker.ts:4`)
- `TaskScheduler.updateConfig` and `VisibilityDetector.updateConfig`, every live caller mutates `.config` directly
- `TaskScheduler.clear`
- The `onComplete` plumbing through `spacingTextNodesInQueue` into `TaskQueue`, no caller ever passes one
- `stopAutoSpacingPage` has no in-repo caller (it is documented public npm surface, keep unless a major version prunes it)
- `content-script.ts:9-10` sets both config knobs to values that are already the defaults

Outcome: everything above except `stopAutoSpacingPage` was removed on `refactor/remove-dead-surface`. `TaskQueue.clear` stays: the queue is reachable via the public `taskScheduler.queue` getter.

## Other verified facts

- `NodePangu` is implemented twice: `src/node/index.ts:6-15` and verbatim in `src/node/index.cjs.ts:8-17` to avoid a circular import. A change to one silently strands CJS consumers.
- CLAUDE.md documents the settings key `spacing_rule`, the code uses `filter_mode` (`utils/types.ts:3`). The documented interface does not exist.
- Vitest importing from `dist/` is deliberate, see `docs/adr/0001-vitest-imports-dist.md`. Reviews should not re-suggest flipping it.
