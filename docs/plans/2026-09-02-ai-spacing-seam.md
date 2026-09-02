# Plan: generalize the AI spacing seam before the second ambiguous shape

Status: reviewed with Vinta on 2026-09-02, names settled, and amended on 2026-09-03 after the glossary review (candidate vocabulary on the wire, `AmbiguousShape`). Ready to implement. Not started. Branch: `feature/chrome-prompt-api`, this checkout, one commit, because every intermediate state either fails tests or has docs describing code that does not exist. Purely structural: DOM output is identical before and after, and the existing suites are the proof.

## Why now

`docs/ai-spacing.md` decision 8 chose hyphen-specific names for the seam and deferred the generic rename until a second ambiguous shape earned a model. That shape is now planned: the `+` brand-suffix reading (`CJK+CJK` where the plus is a suffix, the open bundle-plan FIXME in `tests/shared/symbol-plus-sign.test.ts`, ADR 0013). Adding it on the current seam means either a second core pair (`onPlusSpans` plus `applyPlusSuffixFixes`, duplicating the pending, flush, and applier machinery per ambiguous shape) or generalizing anyway. Generalize first as its own structural change, then add plus as a behavioral change on the generic seam.

## Principle

Core owns mechanism, host owns policy. Prior art from the 2026-09-02 research: Readability vs Firefox Reader View, uBlock core vs its `vAPI` platform layer, Bitwarden `libs/` vs `apps/browser`. Today `BrowserPangu` owns both: it knows the tight `CJK-digit` shape, the sentence slice, the ordinal bridge, and "delete one space after the hyphen". After this plan, `BrowserPangu` exposes two primitives that name no symbol, and the extension owns every per-class fact. The ambiguous-shape registry lives in the extension, where there will be more than one entry, so the plugin-system-with-one-plugin trap does not apply.

The seam stays a nullable callback property, not an event target or a hook registry. One first-party subscriber in the same process, and W3C TAG design principles advise against inventing listener infrastructure for that. Subclassing stays rejected: the extension consumes the UMD singleton `window.pangu`, and a subclass instance would carry its own observer and scheduler state.

## Core changes, `src/browser/pangu.ts`

Two primitives replace `onHyphenSpans`, `pendingHyphenSpans`, `flushHyphenSpans`, and `applyHyphenSignFixes`. `src/browser/hyphen-sign.ts` leaves the package.

```ts
// One text run as a batch left it: the bytes text spacing read, and the bytes settled after every boundary write in the batch landed
export interface SettledTextRun {
  readonly node: Text;
  readonly before: string;
  readonly after: string;
}

// A compare-and-set write: applied only while the node still holds `expected`, so a fix computed from a snapshot can never land on bytes it did not see
export interface LateFix {
  readonly node: Text;
  readonly expected: string;
  readonly data: string;
}

export class BrowserPangu extends Pangu {
  // Unassigned means nothing is captured, which is what keeps the npm build inert
  public onBatchSettled: ((runs: SettledTextRun[]) => void) | null = null;

  public applyLateFixes(fixes: readonly LateFix[]) { ... }
}
```

- `before` is the bytes text spacing read: captured in the `apply-text-spacing` branch of `applyTextRunSpacing`, right before `spacingText` runs, exactly where the finder reads today. Not at the method's entry: `decideTextRunSpacing` can return `trim-leading-space` ahead of `apply-text-spacing` in the same verdict list, and an entry-point capture would hand the classifier a sentence with one more leading space and `at` off by one, which is a model-input change hiding inside a structural one. Text runs that got only a trim or a `prepend-space` (standalone quotes) are not in the list, because text spacing never ran on them; the `SettledTextRun` doc comment says so. Captured only when `onBatchSettled` is assigned.
- The batch tail (today `flushHyphenSpans`) reads `after = node.data` for each captured text run and fires `onBatchSettled` once per batch when the list is non-empty. Same synchronous-batch reliance as today; the existing comment about instance-scoped batch state moves with it.
- `applyLateFixes` keeps today's write path: `schedule()`, then per fix `node.isConnected && node.data === fix.expected`, then `node.data = fix.data` and `lastWrittenData.set(node, fix.data)`. One fix per text run per call. Composition across edits, and across ambiguous shapes, is the extension's job (below): a text run holding both a signed hyphen and a plus suffix must reach core as one `LateFix`, because a second fix on the same text run would fail its own `expected` check and silently drop, which is exactly the two-shape case this plan exists to enable.
- Both interfaces are exported from `pangu.ts`, so the public `pangu/browser` types entry names them. The extension needs no import at all: the callback parameter type flows through `typeof panguUmd` on `window.pangu`.

Do not filter `before === after` text runs in core. Whether an unchanged text run matters is a policy question, and the future insert-direction fix (below) is exactly the case where it might.

Both primitives ship to every npm consumer, as the hyphen pair does today. The byte cost is about the same; what changes is that the surface is a reusable mechanism rather than one symbol's feature.

## Extension changes, `browser-extensions/chrome/src`

- `src/browser/hyphen-sign.ts` moves to `browser-extensions/chrome/src/utils/hyphen-sign.ts` as the first ambiguous shape. It keeps importing `CJK` from `src/shared/index.ts` by relative path. The shared module is all constant declarations, so rolldown's side-effect analysis should reduce the content-script bundle to the range strings it uses. Verify the bundle at implementation time and, if the shared engine leaks in, expose the class range on the UMD global instead.
- An ambiguous shape is two halves in two runtime contexts, joined by nothing but `kind` and a label type, which is the split `hyphen-sign.ts` and `hyphen-prompt.ts` already have today. Keeping them apart matters because the content script and the service worker are separate bundles and object-literal properties do not tree-shake: one merged interface would ship prompt bytes to the page and finder regexes to the worker.

```ts
// Page side, content script. utils/ai-spacing.ts
export interface TextEdit {
  readonly index: number;
  readonly remove: number;
  readonly insert: string;
}

export interface AmbiguousShape {
  readonly kind: string; // joins this half to its PromptSpec, and discriminates CLASSIFY_CANDIDATES
  find(before: string): CandidateMatch[]; // tight-shape scan on pre-spacing bytes, with sentence slice and ordinal
  settle(after: string, match: CandidateMatch): number | null; // the symbol's settled index when the inserted gap is present, else null
  isFix(label: string): boolean; // which label triggers the fix
  edits(after: string, index: number): TextEdit[]; // what to change at one settled index, never a composed string
}

// Worker side, service worker. One per kind, registered in prompt-classifier.ts
export interface PromptSpec<Label extends string> {
  readonly kind: string;
  readonly systemPrompt: string;
  buildQuestion(sentence: string, at: number): string;
  readonly displayTokenEnum: readonly string[];
  labelForDisplayToken(token: unknown): Label | null;
}
```

- `CandidateMatch` is today's `HyphenSpanMatch` (`sentence`, `at`, `ordinal`) generalized to any symbol; an ambiguous shape that needs more fields owns its own match record. The page-side `Candidate` record that replaces `HyphenSignCandidate` is extension-local, `{ kind, node, sentence, at, index, after }`, and core never exports it.
- `content-script.ts` runs one generic loop, `classifyBatch(runs)`, assigned to `onBatchSettled` when `is_enable_ai_spacing` is on: for each registered ambiguous shape, `find` over `before` and `settle` over `after` to build candidates, one `CLASSIFY_CANDIDATES` per ambiguous shape per batch carrying `kind`, zip by index, collect `edits` for every fix label, then compose per text run across all ambiguous shapes: sort edits by index descending, apply them to `after`, emit one `LateFix { node, expected: after, data }`. `applyLateFixes` once per batch. The first `{ok: false}` for any kind still unassigns `onBatchSettled` for the page.
- `types.ts`: the wire types drop the span word, which the glossary avoids. `ClassifySpanRequest` becomes `ClassifyRequest`, `ClassifySpansMessage` becomes `ClassifyCandidatesMessage` with type `CLASSIFY_CANDIDATES` and a `kind` field, `ClassifiedSpan { answer }` becomes `ClassifiedCandidate { label }` with `label` the union of the registered label types, `ClassifySpansSucceeded`, `ClassifySpansFailed`, and `ClassifySpansResponse` become `ClassifyCandidates*`, and `classifySpans` becomes `classifyCandidates` in both the content script and the worker.
- `prompt-classifier.ts`: holds the `PromptSpec` registry and turns `baseSession` into a `Map<kind, Promise<LanguageModel>>`, since each ambiguous shape carries its own system prompt in `initialPrompts`. Everything else in the worker is already agnostic to the ambiguous shape.
- `hyphen-prompt.ts` becomes the hyphen `PromptSpec`, bytes unchanged.

## Tests

Every existing case keeps a home. The policy half becomes pure functions over `{before, after}` strings, so its DOM tests turn into vitest unit tests; only the two core primitives still need a browser.

| Today                                                                                                                                              | After                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/browser/hyphen-sign.test.ts` (17 vitest cases on the pure half)                                                                             | `tests/extension/hyphen-sign.test.ts`, imports from the extension path, picked up by `test:extension`                                                                                                                                 |
| Playwright: finder unassigned by default, npm output unchanged                                                                                     | `tests/browser/batch-settled.playwright.ts`: `onBatchSettled` is null, nothing captured, output unchanged                                                                                                                             |
| Playwright: flag with pre-spacing sentence and settled index; count unflagged hyphens; junction space moved the index; author-spaced never flagged | Core: `batch-settled.playwright.ts` asserts `{before, after}` for a plain text run and for the junction-space text run. Policy: `tests/extension/hyphen-sign.test.ts` feeds those same `{before, after}` pairs to `find` and `settle` |
| Playwright: delete only the inserted space; fix every hyphen in one text run; fix after a junction space                                           | Policy: `edits` plus per-node composition in vitest on the same strings, with one added case for two ambiguous shapes editing one text run. Core: `tests/browser/late-fixes.playwright.ts` applies one `LateFix` and reads the DOM    |
| Playwright: drop when node changed; drop when node left the document; not re-spaced by the MutationObserver                                        | `late-fixes.playwright.ts`, same three cases against `applyLateFixes`                                                                                                                                                                 |

The Playwright fixtures can keep the hyphen strings; the assertions change from candidate shapes to `{before, after}` pairs and to DOM text after a `LateFix`.

## Docs

- `docs/ai-spacing.md`: rewrite decisions 5 and 8 to record the generic seam and the extension-side ambiguous-shape registry, and rewrite the "Finder" and "Applier" component sections to describe `onBatchSettled` and `applyLateFixes` in core and the hyphen-sign ambiguous shape in the extension.
- `CONTEXT.md`: already names everything the seam touches (text run, late fix, ambiguous shape, candidate, label) after the 2026-09-03 review. No new entry: the record types are implementation details.
- No new ADR. ADR 0016 point 3 (extension-only, opt-in, late fix) holds either way, and no spacing contract changes.
- `src/browser/pangu.ts` call-flow comment: step 6 gains the batch-tail hook line.

## Verification

`npm test` (build, vitest, Playwright across chromium, firefox, webkit), `npm run typecheck`, `npm run lint`. Capture exit codes explicitly. A manual check on the loaded extension with `is_enable_ai_spacing` on: the same page shows the same hyphen fixes as before, with the debug lines in both consoles intact.

## Out of scope

- The plus ambiguous shape itself. It gets its own plan after the prompt campaign in the experiments worktree, and lands as a behavioral change.
- Insert-direction fixes. The bundle-plan FIXME wants `AN+ CJK` to become `AN + CJK`, which inserts a space the rules withheld rather than removing one they wrote. `applyLateFixes` can express it, and the glossary's late fix entry allows it since 2026-09-02 (inserts or removes spaces, never rewrites author characters), but `docs/ai-spacing.md` still states the contract as removal-only. Widen that contract line and the glossary example together when plus lands.
- A page-language gate, result caching, and span dedupe, all still parked per the design doc.

## Defaults chosen here, veto any of them

- `onBatchSettled` carries every text run text spacing read, unfiltered, and none it skipped.
- `applyLateFixes` takes one fix per text run per call and composes nothing; the content script composes edits across ambiguous shapes.
- An ambiguous shape is a page-side `AmbiguousShape` and a worker-side `PromptSpec` joined by `kind`, not one object.
- The extension imports `CJK` from `src/shared` by relative path rather than the UMD global exposing it.
- One `CLASSIFY_CANDIDATES` message type with a `kind` field, rather than one message type per ambiguous shape.
- Plan file lives under `docs/plans/`, which this file creates.

## Names settled on 2026-09-02, do not re-litigate

- `SettledTextRun`, not `SettledTextNode`: the code's `TextRun*` identifiers and the glossary's "Text run" entry make text run the canonical term (CLAUDE.md glossary rule 3).
- `LateFix` and `applyLateFixes`, not `TextFix` or `applyTextRunWrites`: the glossary's late fix means any correction to the rules output decided by something other than the rules, and landing late fixes is the only thing the core write primitive does. "Text fix" was an undefined term.
- `onBatchSettled` carries text runs, not candidates: core names no symbol.
- `AmbiguousShape`, not `SymbolClass` or `Ambiguity`: class already means a character class here (CJK, the ANS sub-classes), so a symbol class reads as the S sub-class, and Vinta chose the compound over the bare noun on 2026-09-03. Same word as the glossary entry.
- Candidate vocabulary on the wire (`CandidateMatch`, `CLASSIFY_CANDIDATES`, `ClassifyRequest`, `ClassifiedCandidate.label`), not span: span is under Avoid in the glossary, and label is the glossary's word for the classifier's answer. Settled 2026-09-03.
