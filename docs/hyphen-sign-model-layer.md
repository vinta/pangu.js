# Hyphen-sign model layer

pangu's rules read a hyphen-minus between a CJK character and a digit as an operator ([ADR 0015](adr/0015-hyphen-before-digit-reads-as-operator.md)), because at that shape no rule can separate a year range from a signed number: whatever it decides for `博客來-4%` it decides for `氣溫是-5度`. The model layer restores the sign reading on the spans where it is the right one, for extension users who turn it on. This document is how the layer is built. The decision to build one at all, and what that decision closed, is [ADR 0016](adr/0016-hyphen-before-digit-gets-a-model-layer.md). The API it runs on is described in [`prompt-api-reference.md`](prompt-api-reference.md).

## Contract

The rules flag the span, the model classifies its reading from an enum, and the rules insert or remove spaces deterministically per label. The model never emits text, which is what keeps [ADR 0009](adr/0009-nbsp-suppresses-spacing-never-rewritten.md) intact: the only byte the layer can ever remove is a space pangu itself inserted.

The layer is a late fix on top of a finished result, not a step the output depends on. The synchronous rules pass runs unchanged and its output is what the page gets; the model pass afterwards adjusts only the spans it reads as signed numbers. With the model absent, unavailable, or slow, today's output stands.

## Constraints

- **Zero-regression bar.** Control cases — the spans the rules already get right — must never flip. A configuration that wins an ambiguous case at the cost of one control fails outright. Wins and flips are reported split, never blended into one accuracy number.
- **Latency budget.** At most 30 seconds per page for the late-fix pass, under half a second warm per span.
- **Opt-in, extension-only.** No model dependency reaches the npm package. The extension feature-detects with `availability()` and degrades to rules-only, so the manifest floor stays at Chrome 99 and detection is a runtime check rather than a manifest bump.
- **zh is the measured envelope.** Every prompt variant and every corpus case behind this layer is Chinese, and the numbers carry no further. It nevertheless ships without a page-language gate; if ja or ko pages prove problematic, the gate candidates are `chrome.i18n.detectLanguage` (Chrome 99+, inside the manifest floor) with `documentElement.lang` as a pre-check.

## Decisions

1. **Sentence windowing: sentence-slice, not whole node.** The `sentence` sent per flagged hyphen is a slice of the pre-spacing text node data, cut at CJK sentence terminators (`。．！？；` and newline) around the hyphen, capped at roughly 120 characters per side when no terminator appears. The whole measured envelope is single short sentences and the system prompt frames its input as 整句話, so a paragraph blob is off-envelope in presentation, not merely expensive. The window is over pre-spacing bytes because that is what the finder needs for provenance.
2. **Budget: a per-batch deadline, and no dedupe.** The page budget is enforced content-side as a 30-second deadline per `CLASSIFY_SPANS` round trip; late answers are dropped and the rules output stands. No result caching or span dedupe ships. Framework re-render churn re-classifies the same spans, which is accepted: temperature-0 answers are deterministic, so the output stays stable and only battery is spent.
3. **Prompt source: an extension-local constant.** The extension and any experiment harness that measures prompts are separate things serving different purposes, so the extension carries its own copy of the winning prompt bytes and imports nothing. Duplicated bytes are the accepted cost of an extension that stands alone.
4. **Finder scope: a single text node.** Only a tight `CJK-digit` shape inside one text node is flagged. Cross-node shapes, where the hyphen and the digit sit on either side of an element boundary, are out: un-insert provenance across boundary verdicts has no measured basis.
5. **Seam: a callback property on `BrowserPangu`.** The extension is the only assigner, and unset means the finder never runs, which keeps the npm build inert without a build flag. Subclassing and event dispatch were both considered and rejected as indirection.
6. **The shipping classifier carries no eval instrumentation.** No variant parameter, no per-variant session map, no label-bijection machinery, no presented-order support, no telemetry fields, no concurrency helper, no per-span correlation ids. Request and response arrays zip by index, order-preserved by a sequential loop.
7. **The options page talks to the model directly.** Extension pages are ordinary `chrome-extension://` documents and expose `LanguageModel`, so rendering a status line needs no service-worker round trip. This claim is graded [secondary] in the reference document and is not verified by an automated test; if it fails to hold, the options page renders its "unsupported" status rather than breaking, and a slim worker-message fallback stays unbuilt until real evidence calls for it.
8. **API naming is hyphen-specific.** `onHyphenSpans` and `applyHyphenSignFixes`, not a generic sense-classifier vocabulary. The names describe the one shape the layer reads today rather than promising a classifier that does not exist yet. If a second symbol class earns a model later, renaming the seam is mechanical — one callback property and one method, with the extension as the only assigner — and that is cheaper than a generic name carrying a single shape for however long this ships alone.
9. **Prompt API types come from `@types/dom-chromium-ai`.** The DefinitelyTyped package covers the ambient `LanguageModel` class, `Availability`, `CreateMonitor` with the `downloadprogress` event, the system-first `initialPrompts` tuple, `responseConstraint`, and both context-accounting spelling sets. It types `params()` as unconditionally present, so the classifier keeps runtime guards for it rather than trusting the type.

## Component specification

### Finder (`src/browser`, on `BrowserPangu`)

Runs inside `applyTextRunSpacing`, in the `apply-text-spacing` branch, where the pre-spacing `textNode.data` is still in hand. For each tight `CJK-digit` match it builds a candidate carrying `sentence` (the pre-spacing slice, with `at` recomputed relative to it, always containing the preceding CJK character), `node`, `postIndex` (the hyphen's index in the node's settled post-spacing data), and `postSnapshot` (the node's data as it stands at the batch tail).

Collection splits in two, and the split is not incidental. `sentence`, `at`, and the hyphen's ordinal — which `-` this is, counting hyphen-minus characters in the pre-spacing data — are computed from the pre-spacing bytes inside `applyTextRunSpacing`. Everything positional waits for the batch tail, after `spacingTextNodes` completes and all boundary writes have landed, because boundary spacing runs after each node's text-run spacing and mutates the same nodes: `respaceCurrentTail` rewrites the current tail, `append-current` appends a space, `prepend-next` prepends to an already-processed node. A snapshot taken in the apply-text-spacing branch would be stale on any node that also receives a junction space, which is a common page shape, and the applier's staleness guard would then silently drop those fixes.

The ordinal is the pre-to-post bridge, valid because spacing writes only add or move spaces and never hyphens (the only character conversions are middle dots and the CJK colon). It stays internal to the finder and is never carried on the candidate. A candidate survives only if the settled data actually shows the inserted gap: the hyphen at `postIndex`, followed by a space, followed by a digit. That check is self-verifying provenance — hidden-boundary suppressions and author-spaced originals drop out naturally — so un-inserting later can only ever remove a byte pangu wrote.

The batch tail fires `onHyphenSpans(candidates)` once per `schedule()` batch. A batch is one task closure, so it never splits across idle slices. The callback fires on both the `requestIdleCallback` path and the synchronous fallback, and on every pipeline entry: the initial sweep, mutation batches, manual spacing from the popup, and `<title>`, where it is deterministic because separator answers change nothing.

### Applier (`src/browser`, on `BrowserPangu`)

`applyHyphenSignFixes(candidates)` takes back the candidate objects whose spans classified `signed-number`. Per candidate it runs a staleness guard — `node.isConnected` and `node.data === candidate.postSnapshot` — and drops the fix silently otherwise. The comparison target is the candidate's own snapshot rather than `lastWrittenData`, which a later batch may have advanced; snapshot equality also pins every position, so no re-scan is needed. It then verifies that a space and a digit follow the hyphen at `postIndex` and deletes that one space. The space before the hyphen stays: `是 - 5` becomes `是 -5`.

The write goes through `schedule()` and records its result in `lastWrittenData`, so the MutationObserver reads it as pangu's own write. Routing it through the same seam as every other spacing write is deliberate — the late fix is text spacing, one system, one seam — and it carries two costs. On a hidden tab `requestIdleCallback` stops firing, timeout included, so the fix waits for focus, in the same beat dynamic-content spacing already waits; the staleness window runs until focus, so more fixes drop and their model calls are spent. And a verdict can be logged with the page still visibly unchanged, which is a waiting tab rather than a bug. Correctness is seam-independent: both guards run at write time, and the rules are a fixed point on fixed text.

`range-or-separator`, `unsure`, and errored spans leave the rules output untouched.

### Content script (`browser-extensions/chrome`)

Reads `is_enable_ai_spacing` through `getSettings()` at injection. When on, it assigns `window.pangu.onHyphenSpans` before calling `autoSpacingPage()`, so the initial sweep is captured. Per batch it holds the candidate array, sends one `CLASSIFY_SPANS` carrying `[{sentence, at}]`, races it against the 30-second deadline, zips the response by index, and calls `applyHyphenSignFixes` with the `signed-number` matches. On the first `{ok: false}` response — model absent, availability not `available`, any create failure — it unassigns the callback, which both expresses "the first no is final for this page" and stops the finder from scanning later batches for candidates that would only be thrown away.

### Classifier and service worker (`browser-extensions/chrome`)

An extension-local constant file carries the shipping prompt bytes, tagged with the variant name that earned them: the system prompt, the markless question template (an untouched sentence, with the question pointing at the symbol by quoting the character before it), the display tokens, and the canonical menu order. The service worker keeps one base session with that system prompt in `initialPrompts` at `temperature 0` and `topK 1`, clones it per span through a sequential loop, and recreates it when the MV3 worker wakes.

Any `create()` failure yields `{ok: false}` with no retry arm, which is a correctness decision rather than tidiness: the sampling knobs are extension-context Chrome 151+ while the manifest floor is 99, so a retry that dropped them would silently run model-default sampling on older Chrome — the exact drift that flipped control cases in the plain-page measurements. A context that cannot pin sampling yields no session at all.

There is no worker-side setting check. The content script is the gate, and behavior-until-refresh is the accepted `refresh_required` semantics every setting already has.

### Setting and options page (`browser-extensions/chrome`)

`is_enable_ai_spacing` defaults to `false` and lives in `DEFAULT_SETTINGS`, which `reconcileSettings` and the `chrome.storage.sync` schema pick up automatically. The toggle follows the `refresh_required` registration pattern, so there is no live-toggle plumbing. The options page gains a section with the toggle, a status line from `availability()`, and an explicit download button driving `LanguageModel.create({monitor})` — the download is browser-wide, and the page-context session is destroyed afterwards. There is no progress UI: the monitor callback logs the `downloadprogress` percentage and the status line's `downloading` state covers the visible feedback. A machine whose model is absent degrades silently to rules-only, with the badge and popup untouched.

## Known limitations

- A from-to shape written with a hyphen, `從-5到5`, reads as a separator every time and stays wrong. It is a documented gap, not a bug to chase.
- Whether a content script can create and prompt a session is unmeasured. It is moot for this design, which routes every prompt through the service worker because that is where the sampling knobs live.
- There is no page-language gate, so a ja or ko page runs the same zh-measured prompt.

## Revisitable

Shipped without, and worth revisiting only on real evidence: a page-language gate, a `chrome.storage.session` result cache, majority voting across repeats, and an in-memory per-page dedupe of answered `(sentence, at)` pairs.
