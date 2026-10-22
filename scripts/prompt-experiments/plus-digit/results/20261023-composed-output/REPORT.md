# Plus-digit: composed output regression

## Current state

Complete. Both fresh composed-output comparisons and the separate plus-digit confirmation gate pass. The frozen winner remains `v1-en`; no prompt changed. Complete-excerpt spacing improves from 14/21 to 19/21, and all three mixed plus/minus excerpts pass on both sides in every attempt. The two existing conjunction misses remain. Production source and extension integration remain outside scope.

The first round's combined-excerpt metric applied only plus-digit edits to core output. This follow-up adds a shared evaluator and independently annotated companion targets to measure complete output with the shipping shapes. It is a regression audit of exposed data, not a new screening or holdout round.

## Frozen controls

Starting revision: `099431c4d072bde011ed70617a8f297b61b42edd`. Corpus: `../../corpus/development.json` at this follow-up's commit. Ordered selection: `user-seed-1`, `user-seed-2`, `chu-id-format`, `colatour-parent-child`, `eztravel-transport-attractions`, `udn-score-title`, `udn-score-21`, `udn-score-20`, `boca-phone-886`, `boca-phone-853`, `nidec-temperature-85`, `jingxu-capacitance-56`, `jingxu-temperature-125`, `udn-points-threes`, `holdout-plus-digit-01`, `holdout-plus-digit-02`, `holdout-plus-digit-03`, `holdout-plus-digit-04`, `holdout-plus-digit-05`, `holdout-plus-digit-06`, `holdout-plus-digit-07`, `holdout-plus-digit-08`.

All 22 cases are development data. Eight were holdouts in the completed first round, but their subsequent review exposed them. This follow-up claims no new holdout evidence and does not tune prompts. It retains 21 source excerpts from 15 page identities, including the user seed, with the first round's provenance and collection limits.

Baseline: core plus all currently registered shipping shapes, with plus-digit scored offline as `rules-only`. Candidate: the same shipping shapes plus frozen `v1-en`. Freeze hyphen-digit `v29-zh`, digit-plus `v18-en-real-examples`, their question builders, and ordered schemas in `prompts.mjs`. The plus-digit entries refer to the immutable first-round module. Shipping detectors and edits are imported from production; plus-digit detection/editing uses the frozen Phase 1 contract. Discover every target against the same original text and core-settled snapshot, classify from original context, then combine edits once with production `applyTextEdits()`.

Schedule: two fresh comparisons, each with two orders (corpus order and the runner's seed-1 shuffle) and three attempts per target per order. Run baseline before candidate in comparison 1 and reverse those sides in comparison 2. Every routed shipping classifier gets fresh answers on both sides; no reused answers from the first round. Sampling stays temperature 0/topK 1, without language declarations, using string-enum response constraints and `omitResponseConstraintInput: false`. Errors, skips, and missing attempts fail verification; semantic failures are retained without retries.

Gate: retain the plus-digit zero-false-conjunction rule on every sign attempt; require no complete-excerpt regression or attempt decline against the shipping-shapes baseline in either comparison, with at least one same stable improvement. Also run the separate plus-digit confirmation gate on these artifacts: an improvement from different companion answers alone cannot establish a plus-digit gain. Report labels, target edits, plus-only combined spacing, and complete-excerpt spacing separately. Attribute failed targets to their shape. A component pass does not imply a complete-excerpt pass; unchanged background failures must remain visible in absolute accuracy.

## Mixed-shape gold

The corpus retains the first round's `expected_output` and `expected_excerpt_output` as plus-only contract expectations. `companion_targets` records independently reviewed targets from other shapes; `expected_composed_output` and `expected_composed_excerpt_output` record full gold for the input slice and source excerpt. The three companion minus signs denote negative lower bounds, so each has gold `signed-number`.

| Case                     | Mixed values             | Required companion correction |
| ------------------------ | ------------------------ | ----------------------------- |
| `jingxu-capacitance-56`  | `-22%` through `+56%`    | Join `- 22%` to `-22%`        |
| `jingxu-temperature-125` | `-55°C` through `+125°C` | Join `- 55°C` to `-55°C`      |
| `holdout-plus-digit-07`  | `-50℃` through `+200℃`   | Join `- 50℃` to `-50℃`        |

There are 22 plus-digit targets and 3 hyphen-digit targets across 21 excerpts. No digit-plus target routes in this selection. Other pluses in a saved excerpt remain subject to the existing one-plus-per-context exclusion; their presence is not permission to expand the scored selection. No original text or prompt input is rewritten to remove a competing shape.

## Runtime and verification

Chrome Beta 157.0.8103.6, Node.js v24.22.0. Optimization Guide model component: 2025.8.8.1141; manifest component: 1.20261018.2. Exact model weight revision is unavailable. The loaded extension's source and core source match the starting revision. Runtime checks confirmed the expected extension/profile, model availability, and actual temperature 0/topK 1. `LanguageModel.params()` serialized as an empty object, so it supplied no additional limits.

All 33 focused runner tests passed before inference, including eight composition tests. These cover complete annotation discovery, exclusions, mixed-shape edits, shared offsets, missing/error answers, frozen controls, and the generated component corpora. After correcting inherited symbol metadata in generated companion records, all eight composition tests passed again. All 25 real inputs (22 plus and 3 minus targets) reproduced their exact context and UTF-16 offsets in Chrome. The first fixture replay hit a TrustedHTML restriction on an internal page; a fresh replay on `about:blank` passed. No model inference occurred during either setup repair.

The reconnected profile initially had Pangu disabled. An initial readiness check stopped before inference. Automatic approval review rejected an enable-only operation because restoration was not guaranteed within it. The approved retry enclosed temporary enablement, runtime verification, and all eight sweeps in one operation with `finally` restoration. It completed all runs and restored Pangu to disabled. No inference errors, missing answers, or semantic retries occurred. Raw answers and verification artifacts remain ignored under `local/prompt-experiments/20261023-composed-output/`.

## Results

Both comparisons produced the same counts. A case or excerpt passes only when all six attempts in that comparison pass. The attempt columns below combine the two comparisons; repetitions do not add independent source cases. The plus-digit baseline label is the offline `signed-number` surrogate for no edit.

| Metric                                        | Baseline cases/excerpts | Candidate cases/excerpts | Baseline attempts | Candidate attempts |
| --------------------------------------------- | ----------------------- | ------------------------ | ----------------- | ------------------ |
| Plus-digit labels                             | 14/22 (63.6%)           | 20/22 (90.9%)            | 168/264           | 240/264            |
| Plus-digit target spacing                     | 14/22 (63.6%)           | 20/22 (90.9%)            | 168/264           | 240/264            |
| Plus-only combined spacing, scored per target | 14/22 (63.6%)           | 20/22 (90.9%)            | 168/264           | 240/264            |
| Hyphen-digit labels                           | 3/3                     | 3/3                      | 36/36             | 36/36              |
| Hyphen-digit target spacing                   | 3/3                     | 3/3                      | 36/36             | 36/36              |
| Complete-excerpt spacing                      | 14/21 (66.7%)           | 19/21 (90.5%)            | 168/252           | 228/252            |
| Mixed plus/minus excerpt spacing              | 3/3                     | 3/3                      | 36/36             | 36/36              |

The component gate passes independently in both comparisons: six stable target improvements (`user-seed-1`, `user-seed-2`, `colatour-parent-child`, `eztravel-transport-attractions`, `holdout-plus-digit-06`, `holdout-plus-digit-08`), no regression or attempt decline, and zero false conjunctions across all 168 candidate sign attempts. The composed gate also passes independently in both comparisons, with five stable excerpt improvements: `user-seed`, `colatour-parent-child`, `eztravel-transport-attractions`, `holdout-excerpt-6`, and `holdout-excerpt-8`. The two seed targets share one excerpt. Both gates report no protocol issues.

The only failed excerpts are `chu-id-format` and `udn-points-threes`; every failed target belongs to plus-digit. Each returns `signed-number` instead of `conjunction` in all 12 attempts, leaving `+9` or `+2` tight. Companion hyphen-digit answers are correct in all 72 model attempts across both sides, so no gain is attributable to a changed companion answer. Digit-plus has zero routed targets and no accuracy result.

The reviewed temperature case now has complete gold and measured output:

```text
耐高溫測量系統適合在-50℃至+200℃範圍内使用
耐高溫測量系統適合在 -50℃ 至 +200℃ 範圍内使用
```

The shipping hyphen-digit classifier joins the core-inserted minus gap; plus-digit retains the positive sign. Both baseline and candidate produce this output in every attempt. The previous plus-only expectation, containing `- 50℃`, remains separately recorded to reproduce the first round.

Phase outcomes: deterministic preparation and fixture replay passed; two fresh confirmation comparisons passed both gates; screening and new holdout evaluation were not run because this audit reused the frozen winner and exposed corpus. The original round's screening, confirmation, and holdout results remain in its [report](../20261023-first-shape/REPORT.md).

No additional source collection occurred. The original two public collection passes observed 11 conjunctions versus 20 signs, plus one unresolved arithmetic use; including the two user-provided targets gives 13 versus 20 plus one unresolved use. The scored corpus contains 8 conjunctions versus 14 signs. These are targeted collection yields, not prevalence estimates.

## Reproduction

Use this follow-up's committed harness, corpus, and frozen prompt module. [Composed-output commands](../../../README.md#composed-output) describe preparation, the runs manifest, and offline verification. Prepare with the exact ordered selection above, then execute the following schedule using `sweep.mjs --orders 2 --repeats 3 --prompts scripts/prompt-experiments/plus-digit/results/20261023-composed-output/prompts.mjs`, the corresponding generated corpus, and a new output directory for each invocation:

| Order | Comparison/side | Experiment   | Frozen prompt   |
| ----- | --------------- | ------------ | --------------- |
| 1     | 1 baseline      | hyphen-digit | `hyphen-v29-zh` |
| 2     | 1 baseline      | plus-digit   | `rules-only`    |
| 3     | 1 candidate     | hyphen-digit | `hyphen-v29-zh` |
| 4     | 1 candidate     | plus-digit   | `v1-en`         |
| 5     | 2 candidate     | hyphen-digit | `hyphen-v29-zh` |
| 6     | 2 candidate     | plus-digit   | `v1-en`         |
| 7     | 2 baseline      | hyphen-digit | `hyphen-v29-zh` |
| 8     | 2 baseline      | plus-digit   | `rules-only`    |

Run `composition.mjs check` on the prepared manifest and these eight artifacts. Also run `hyphen-digit/check-paired.mjs --experiment plus-digit --phase confirmation --cases <prepared-plus-digit.json> --prompts <this-round-prompts.mjs> --baseline rules-only --out <new-directory>` followed by the four plus-digit artifact paths in baseline-1, candidate-1, baseline-2, candidate-2 argument order. Both gates must pass. Current-runtime reruns are new evidence; the report retains the original environment and results independently of disposable raw output.

The prompt-experiments skill now distinguishes component and composed metrics, requires companion annotations and both gates when shapes coexist, and makes complete gold the default for case-review documents. This addresses the review ambiguity that triggered the follow-up.

## Coverage limits

This is an audit of known cases, not an unseen generalization test. The mixed slice contains only three sign/sign excerpts; it has no real hyphen-plus conjunction interaction, digit-plus interaction, or overlapping edit target. Deterministic fixtures can check edit composition, but cannot establish model accuracy on absent real examples. Plus-digit production routing, worker registration, actual concurrent dispatch, stale-DOM handling, and disabled/unavailable-model integration remain Phase 2 checks.
