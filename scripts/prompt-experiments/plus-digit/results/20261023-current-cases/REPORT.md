# Plus-digit: all current cases

## Current state

Complete. Winner: `v6-en-range-sign`. Screening passes; both fresh confirmation comparisons pass the component and complete-output requirements: all 22 current targets and all 21 complete excerpts are correct in every scheduled candidate attempt. Shipping remains 20/22 targets and 19/21 complete excerpts. Both original conjunction misses improve, without sign regressions. Five candidate variants were tested. The experiment made no new cases, source exclusions, gold changes, or production changes. Holdout is not run, as requested. There is no remaining experiment step. The later production adoption is recorded below.

## Goal and controls

Make every existing case correct without collecting new cases. The experiment kept production source and tests unchanged. This is a new development round; the immutable historical `v1-en` remains the shipping control. Previously exposed holdouts remain development cases. No new holdouts are collected or evaluated, per the user's scope; this round cannot establish unseen generalization.

Code/harness revision: `8dd554e77462385aa5bb004eb52403f4054bd65f`. Corpus: `scripts/prompt-experiments/plus-digit/corpus/development.json`, Git blob `02428d56be25631ee1453577f3484a248717363c`. No case text, input, labels, spacing expectations, source attribution, or roles change. Existing user review and source verification apply; unchanged cases require no repeat review.

Ordered selection: `user-seed-1`, `user-seed-2`, `chu-id-format`, `colatour-parent-child`, `eztravel-transport-attractions`, `udn-score-title`, `udn-score-21`, `udn-score-20`, `boca-phone-886`, `boca-phone-853`, `nidec-temperature-85`, `jingxu-capacitance-56`, `jingxu-temperature-125`, `udn-points-threes`, `holdout-plus-digit-01`, `holdout-plus-digit-02`, `holdout-plus-digit-03`, `holdout-plus-digit-04`, `holdout-plus-digit-05`, `holdout-plus-digit-06`, `holdout-plus-digit-07`, `holdout-plus-digit-08`.

Selection: 22 plus-digit targets/model contexts (8 conjunctions, 14 signs), 21 source excerpts, 15 page identities (14 public plus the seed), 13 named public publishers plus the unknown seed publisher. No examples or example-page exclusions. No gold `unsure` cases. Three existing signed-number hyphen targets also route; no digit-plus targets route. Retain component and complete-excerpt gold and measure fresh companion inference during confirmation.

Sampling: temperature 0/topK 1, no language declarations, ordered string enum `signed-number`, `conjunction`, `unsure`, `omitResponseConstraintInput: false`. Each order uses a fresh base session and each attempt a fresh clone. Screening: corpus order and seed-1 shuffle, one attempt per target per order. Confirmation: two fresh paired comparisons, each two orders and three attempts per target per order, reversing sides in comparison 2. Require every candidate label/target/complete excerpt correct in every scheduled attempt, plus the existing no-regression/stable-improvement gates. Errors, skips, and missing answers fail; no semantic retries.

## Reused evidence

The first-shape and composed-output reports measured persistent `chu-id-format` and `udn-points-threes` misses. Their diagnostics found that Nano recognized letter/digit components but called the sequence a positive quantity; for the sports headline it translated two scoring items but treated conjunction as joining complete clauses and misidentified neighboring text. These are interpretation clues, not accuracy evidence. Only `v1-en` was previously tested. The existing corpus records production fixture replay through the content script in Chromium, Firefox, and WebKit.

## Runtime and preflight

Chrome Beta `157.0.8103.15`, Node `v24.22.1`, Optimization Guide nano model component `2025.8.8.1141`, model manifest `1.20261018.2`. Exact weight revision remains unavailable. The configured profile and extension were verified; model availability is `available`, actual temperature 0/topK 1. `LanguageModel.params()` serializes as an empty object. The installed extension loads the clean main checkout at the same source revision as this worktree; source equality was verified. As in the first round, the runner supplies worktree-frozen prompts in fresh sessions, so the source-identical main checkout is only the execution context.

The browser version changed from the historical run, invalidating old fixture replay. A fresh replay adapted the existing production content-script test into a temporary script and passed all 21 excerpts, exact dispatched inputs/offsets for 22 plus and 3 companion minus targets, component output, and complete output without inference. The extension build passed without warnings. All 35 focused runner/gate tests passed. Deterministic composition preparation confirms complete annotations and both levels of gold.

Connection setup found the extension disabled in the dedicated evaluation browser. It was temporarily enabled for inference. Use Node dotenv loading for the local settings file. All prerequisite repairs completed before inference; no accuracy comparison was interrupted or retried. At completion, the extension was restored disabled, temporary inspection/replay pages were closed, the original extensions page was restored, and the evaluation connection was detached.

## Iteration 1: `v2-en-joins`

Parent: `v1-en`. Change one dimension: expand the conjunction definition to mean “and”, “together with”, or “followed by”, covering distinct items, separate counts, and code parts without requiring complete clauses. Preserve the system, signed-number/unsure definitions, labels/schema, sampling, and question layout. Hypothesis: explicit semantic scope fixes both existing misses without changing any sign. No examples are added, so every current case remains scored. Frozen in `prompts.mjs` before inference.

Result: shipping and candidate each pass 20/22 labels, target spacing, and plus-only combined spacing (40/44 attempts), with no instability or errors. Both persistently miss `chu-id-format` and `udn-points-threes`; all 14 signs remain correct. Screening gate fails because no case improves. Decision: retain the failed candidate; tighten the positive-sign definition next.

## Iteration 2: `v3-en-sign-scope`

Parent: `v2-en-joins`. Change one dimension: narrow signed-number from any positive value to the sign of one value/change, explicitly distinguishing a positive count from a plus joining two items. Hypothesis: the model is conflating the positivity of a count with the role of the plus. Reuse the fresh screening shipping answers because the browser connection, runtime, cases, prompt controls, and schedule remain continuous and unchanged. Frozen before inference.

Result: 21/22 labels, target spacing, and plus-only combined spacing (42/44 attempts), no errors/instability or sign regression. Screening gate passes with stable improvement on `udn-points-threes`; only `chu-id-format` remains wrong. The all-current-cases requirement is not met, so confirmation is deferred.

## Diagnostic and research pivot

One-order/one-attempt diagnostics of `v3-en-sign-scope` on unchanged `chu-id-format` reproduce `signed-number`. The translation and target identification accurately describe a letter followed by nine digits and a combination of two elements. The label explanation contradicts that interpretation: it rejects all three options, calls the symbol a delimiter in a format/pattern, then chooses signed-number as the closest option. This suggests task/label framing remains a bottleneck, not missing surrounding text. Diagnostic answers are excluded from accuracy counts.

After two definition changes leave this case wrong, consult Google's [prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies#prompt-iteration-strategies), which recommends testing analogous tasks and content order. This is general Gemini guidance, not measured Nano evidence. The hypothesis is to ask which spoken paraphrase preserves meaning, rather than asking for the abstract meaning of a symbol. Few-shot examples are deliberately omitted: using the current pages as examples would remove them from scoring, and new case collection is out of scope.

## Iteration 3: `v4-en-paraphrase`

Parent: `v3-en-sign-scope`. Change one dimension: reframe the question as choosing a meaning-preserving reading (positive versus and/together with/followed by), explicitly mapping format/pattern delimiters to conjunction. Preserve both option definitions, system, exact source input, labels, and sampling. Prediction: bridge the diagnostic's correct paraphrase to the existing label. Reuse the same eligible fresh shipping baseline. Frozen before inference.

Result: 21/22 labels and both spacing metrics (42/44 attempts). Both original misses improve, but `jingxu-temperature-125` regresses to conjunction on both attempts. The gate fails with one regression/unsafe sign; no errors or instability. Reject this candidate. Fresh diagnostics reproduce the failure and identify ±15% as the target instead of the actual ASCII + before 125°C, despite a correct translation. This is a target-grounding clue, not accuracy evidence.

## Iteration 4: `v5-en-target`

Parent: `v4-en-paraphrase`. Change one dimension: identify the ASCII plus by quoting its exact authored suffix and exclude other symbols including ± from the requested target. The original sentence and semantic definitions remain unchanged; no source text is replaced or removed. Use the full suffix rather than another cropped fragment. Prediction: recover the temperature sign by preventing the observed ± confusion while retaining both conjunction fixes. Google's [structured prompting guidance](https://ai.google.dev/gemini-api/docs/prompting-strategies#core-prompting-principles) motivates explicit input references; transfer to Nano is a hypothesis. Reuse the same screening baseline. Frozen before inference.

Result: unchanged from v4, 21/22 labels and both spacing metrics (42/44 attempts), with the same unsafe `jingxu-temperature-125` conjunction and no errors/instability. Screening gate fails. The added target wording produces no measured benefit; omit it from the next candidate.

## Iteration 5: `v6-en-range-sign`

Parent: `v4-en-paraphrase`, dropping v5's ineffective target expansion. Change one dimension: explain in the signed-number option that a positive temperature/percentage range endpoint keeps its sign even with a negative opposite endpoint; the range connector, not +, joins bounds. This follows the v4 diagnostic's claim that a value inside a range is not an isolated signed number. The earlier hyphen-digit all-52 round independently found a useful negative-bound distinction; that result is prior art, not accuracy evidence for plus-digit. Prediction: preserve v4's conjunction fixes and recover the sole sign regression. Reuse the same screening baseline. Frozen before inference.

Result: all 22/22 labels, target spacing, and plus-only combined spacing pass (44/44 attempts), including all 14 sign controls. No errors, instability, regressions, unsafe signs, or protocol mismatches. Screening gate passes with stable fixes for both `chu-id-format` and `udn-points-threes`. Freeze v6 and proceed to fresh confirmation plus complete-output evaluation.

## Confirmation and final results

The frozen candidate ran through two fresh paired comparisons, each with two case orders and three attempts per target per order. Comparison 1 ran all baseline shapes before all candidate shapes; comparison 2 reversed the sides. Each side ran fresh `hyphen-v29-zh` answers for the three companion targets and fresh `v1-en` or `v6-en-range-sign` answers for all 22 plus targets. There were no reused screening answers, interrupted comparisons, retries, prompt edits, errors, skips, missing attempts, or unstable cases.

| Metric                                                                         | Shipping                         | Candidate                        |
| ------------------------------------------------------------------------------ | -------------------------------- | -------------------------------- |
| Screening labels and individual target spacing                                 | 20/22 cases; 40/44 attempts      | 22/22 cases; 44/44 attempts      |
| Confirmation labels, each comparison                                           | 20/22 cases; 120/132 attempts    | 22/22 cases; 132/132 attempts    |
| Confirmation individual and plus-only combined target spacing, each comparison | 20/22 cases; 120/132 attempts    | 22/22 cases; 132/132 attempts    |
| Confirmation complete excerpts, each comparison                                | 19/21 excerpts; 114/126 attempts | 21/21 excerpts; 126/126 attempts |
| Companion minus labels/edits, each comparison                                  | 3/3 targets; 18/18 attempts      | 3/3 targets; 18/18 attempts      |

Across both confirmation comparisons, the candidate passes 264/264 plus labels and target edits, 36/36 companion labels/edits, and 252/252 complete-excerpt attempts. Including screening, the winner passes 308/308 plus attempts. Repeated attempts measure stability on the same 22 cases, not additional source coverage.

The shared plus-digit confirmation gate and composition gate both pass, independently in both comparisons, with stable improvements on `chu-id-format` and `udn-points-threes`. There are no case/excerpt regressions, attempt declines, unsafe signs, or protocol mismatches. All 14 plus sign controls retain correct labels and spacing. The prepared manifest was regenerated after final prompt formatting and selection; its frozen corpus, prompt-file hash, imported prompt definitions, and production-source snapshot all match at verification.

Phase status: preflight **pass**, screening **pass**, confirmation **pass**, composed-output confirmation **pass**, holdout **not run**. Production application and integration **not run**. An independent read-only review confirmed that frozen v1 exactly matches shipping on all 22 rendered questions; v6 reads only the original input, with no gold-label, ID, source, or case-exclusion dependence.

## Limits and retention

No current case fails. All current cases were already exposed development data, so perfect results do not establish unseen accuracy. There are no gold `unsure` cases. The three mixed excerpts only cover sign/sign interactions; real plus-digit conjunction interactions with hyphen-digit or digit-plus, broader sources, arithmetic ambiguity, and additional inline-node contexts remain outside this round. The user seed has no original DOM/publisher, and repeated financial rows share one source page.

Only `REPORT.md` and `prompts.mjs` are retained in this result directory. The unchanged shared corpus, pinned revision, frozen historical prompt imports, and reproduction protocol below are sufficient to rerun without temporary artifacts. Successful/rejected runs, diagnostics, fixture replay, runtime evidence, and gates remain ignored locally. The extension build and 35 focused runner/gate tests passed; final prompt/report formatting and whitespace checks passed. No full production test suite, lint, or typecheck was run because production code and integration were unchanged.

## Reproduction

Use this round's prompts and the corpus/harness revision recorded above, before production adoption. Restore that code revision and the pinned corpus for historical reruns. Follow the prompt-experiments runtime/replay checks; a new browser/model run is new evidence. Run from the repository root with an unused ignored output root. The baseline frozen key `v1-en` exactly matches shipping at the recorded pre-adoption revision; composition requires that frozen key rather than the `shipping` alias.

```bash
corpus=scripts/prompt-experiments/plus-digit/corpus/development.json
prompts=scripts/prompt-experiments/plus-digit/results/20261023-current-cases/prompts.mjs
rerun=local/prompt-experiments/plus-digit-current-cases-rerun

node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment plus-digit --cases "$corpus" --prompts "$prompts" --orders 2 --repeats 1 --out "$rerun/screen" shipping v6-en-range-sign
node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --experiment plus-digit --phase screening --cases "$corpus" --prompts "$prompts" --baseline v1-en --out "$rerun/gate-screen" "$rerun/screen/1-shipping.json" "$rerun/screen/2-v6-en-range-sign.json"
node scripts/prompt-experiments/composition.mjs prepare --cases "$corpus" --prompts "$prompts" --out "$rerun/prepared"

for side in baseline-1 candidate-1 candidate-2 baseline-2; do
  case "$side" in
    baseline-*) variant=v1-en ;;
    candidate-*) variant=v6-en-range-sign ;;
  esac
  node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases "$rerun/prepared/hyphen-digit.json" --prompts "$prompts" --orders 2 --repeats 3 --out "$rerun/confirm-$side-hyphen" hyphen-v29-zh || break
  node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment plus-digit --cases "$rerun/prepared/plus-digit.json" --prompts "$prompts" --orders 2 --repeats 3 --out "$rerun/confirm-$side-plus" "$variant" || break
done

node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --experiment plus-digit --phase confirmation --cases "$rerun/prepared/plus-digit.json" --prompts "$prompts" --baseline v1-en --out "$rerun/gate-confirmation" "$rerun/confirm-baseline-1-plus/1-v1-en.json" "$rerun/confirm-candidate-1-plus/1-v6-en-range-sign.json" "$rerun/confirm-baseline-2-plus/1-v1-en.json" "$rerun/confirm-candidate-2-plus/1-v6-en-range-sign.json"
```

For complete-output verification, create the two-comparison JSON described in the [shared command reference](../../../README.md#composed-output), using each `confirm-<side>-<n>-hyphen/1-hyphen-v29-zh.json` and `confirm-<side>-<n>-plus/1-<variant>.json` path above. Verify that its destination is ignored and untracked before writing. Then run `node scripts/prompt-experiments/composition.mjs check --prepared "$rerun/prepared/prepared.json" --runs "$rerun/comparisons.json" --out "$rerun/gate-composition"`. Both gates are required.

To reproduce rejected screens, substitute `v2-en-joins`, `v3-en-sign-scope`, `v4-en-paraphrase`, or `v5-en-target` for the candidate in separate output directories and check each against the matching fresh shipping baseline. Diagnostics use the unchanged corpus's three frozen follow-up questions: run v3 with `--orders 1 --repeats 1 --diagnostics chu-id-format`, or v4 with `--orders 1 --repeats 1 --diagnostics jingxu-temperature-125`. Diagnostics are not accuracy evidence.

## Production adoption

Applied `v6-en-range-sign` to the production plus-digit prompt after the completed experiment, at the user's request. The production version and question wording changed; the system prompt, labels, schema, sampling, routing, and edits did not. The existing corpus parity test now compares every production question byte against this frozen winner. Updated the runner/composition tests' shipping references and the ADR alongside it. Historical prompt definitions remain unchanged.

Validation: `npm run build` passed; all 216 AI-spacing and experiment-runner tests across 12 files passed, including all 22 production question comparisons. `npm run typecheck`, ESLint on the changed production/test files, formatting, and whitespace checks passed. No fresh model inference or browser suite was run for this prompt-only adoption: exact parity preserves the experiment inputs, and routing/DOM behavior did not change. The earlier confirmation and fixture-replay evidence remains recorded above.
