# Architecture review (2026-07-17)

Deepening candidates from a hot-spot-scoped review of the codebase, using the vocabulary in `CONTEXT.md` (boundary spacing, text spacing, pangu element) and the deep-module terms module, interface, seam, adapter, locality, leverage. Candidate 1 is being implemented now. Candidates 2 to 4 are recorded here to revisit later. Every file:line and zero-caller claim below was verified against the repo on the review date.

## 1. Boundary spacing module (in progress)

Extract the pair-spacing verdict out of `BrowserPangu.spacingTextNodes` (`src/browser/pangu.ts:152-331`), where pure spacing decisions are interleaved with DOM mutation for 180 lines and reachable only through Playwright.

Decisions already made:

- New DOM-free module `src/browser/boundary-spacing.ts`. Two entry points: a per-pair verdict (`none`, `prepend-next`, `append-current`, `insert-element`) and a per-node rule (trim-leading-after-hidden, standalone-quote prepend).
- Context is flat facts. The module runs the two-character `spacingText` probe itself and owns the visibility veto rules. Tree climbing and tag regexes stay adapter-side in `DomWalker`.
- Strict two-step: commit 1 is purely structural and preserves the hand-rolled narrow regexes bit-for-bit (`/[一-鿿]/` at `pangu.ts:178,246` misses kana). Commit 2 swaps in shared's CJK class and revisits the skipped FIXME at `tests/browser/pangu.playwright.ts:71`.
- Vitest tests for this module import from `src/` as an internal-seam exception to ADR-0001.

## 2. Extension settings module (deferred)

`utils/settings.ts` is shallow, a read-only cache. Reads cross `getCachedSettings()` while twelve raw `chrome.storage.sync.set` writes go around it (3 in `popup.ts`, 7 in `options.ts`, 2 in `service-worker.ts`). The active blacklist or whitelist is re-derived seven times. The extension has zero tests.

Latent race: `getCachedSettings()` returns a live mutable reference. `popup.ts:324` mutates it in place while the cache's own `onChanged` listener rebuilds the object, and `options.ts:21` registers a second `onChanged` listener with no ordering guarantee against the cache's.

Deepening: one settings module owning reads, writes, list operations, and the defaults and migration logic now in `service-worker.ts`. `chrome.storage` becomes an adapter behind the seam, an in-memory adapter unlocks vitest. Two adapters make the seam real.

## 3. Spacing eligibility policy (deferred)

"Which pages get spacing" is implemented twice in two pattern languages. The popup predicts with URLPattern (`popup.ts:236-253`), the service worker registers Chrome match patterns (`service-worker.ts:61-67`), and the repo's own test documents that the semantics diverge on `*://` (`tests/browser/urlpattern.playwright.ts:21-24`).

They already disagree today: `popup.ts:205` accepts `file://` as valid while the manifest no longer grants file host permission, so the popup can show active on pages Chrome never injects into. URL validation is forked three ways (`utils/urls.ts:7`, `popup.ts:205`, hardcoded matches in `service-worker.ts:57`). The injected-file list exists twice (`popup.ts:175`, `service-worker.ts:55`).

Deepening: one eligibility module answering "is this URL eligible" for the popup and emitting the content-script registration for the service worker, with Chrome match-pattern semantics encoded once. Vitest-testable, URLPattern is global in Node 24. `urlpattern.playwright.ts` retires.

## 4. Shrink BrowserPangu's interface (deferred)

The interface exposes its internal composition. Callers steer spacing by mutating nested config two levels deep (`pangu.taskScheduler.config.enabled`), the two knobs create three execution paths documented by a 28-line comment (`pangu.ts:51-78`), and that comment has already drifted: it promises visibility-on always batches through requestIdleCallback, but `pangu.ts:338` re-checks the scheduler flag and can fall through to synchronous. The sync-or-async decision is re-read at four sites (`pangu.ts:119,336,338,422` plus `task-scheduler.ts:73`).

The author already designed this once: commit `b641e4b` added a 278-line proposal replacing the config flags with explicit sync and async methods, estimated to remove ~250 lines of branching, later deleted unimplemented. Recover with `git show b641e4b`.

Note: `taskScheduler.config` and `visibilityDetector.config` are documented public npm surface, so this is a major-version change.

## Dead surface inventory (verified, zero callers)

- `DomWalker.canIgnoreNode` (`dom-walker.ts:58-71`), its rules live duplicated in the TreeWalker filter at `dom-walker.ts:24-43`
- `DomWalker.presentationalTags` (`dom-walker.ts:4`)
- `TaskScheduler.updateConfig` and `VisibilityDetector.updateConfig`, every live caller mutates `.config` directly
- `TaskScheduler.clear`
- The `onComplete` plumbing through `spacingTextNodesInQueue` into `TaskQueue`, no caller ever passes one
- `ANY_CJK` export from `src/shared/index.ts:495`, zero importers while `pangu.ts` hand-rolls a narrower CJK regex
- `stopAutoSpacingPage` has no in-repo caller (it is documented public npm surface, keep unless a major version prunes it)
- `content-script.ts:9-10` sets both config knobs to values that are already the defaults

## Other verified facts

- `NodePangu` is implemented twice: `src/node/index.ts:6-15` and verbatim in `src/node/index.cjs.ts:8-17` to avoid a circular import. A change to one silently strands CJS consumers.
- CLAUDE.md documents the settings key `spacing_rule`, the code uses `filter_mode` (`utils/types.ts:3`). The documented interface does not exist.
- Vitest importing from `dist/` is deliberate, see `docs/adr/0001-vitest-imports-dist.md`. Reviews should not re-suggest flipping it.
