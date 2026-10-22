# Plus-digit: first shape round

## Current state

Phase 1 complete. Frozen winner: `v1-en`. Harness/preflight, screening, both confirmation comparisons, and both holdout comparisons passed. One candidate was tested; no prompt edits followed screening. Stop this round with two persistent development misses and the coverage limits below. Phase 2 was not run: `src/`, `browser-extensions/`, ADRs, and CHANGELOG are unchanged.

This round's individual and combined spacing metrics apply core plus plus-digit edits only. The [composed-output follow-up](../20261023-composed-output/REPORT.md) evaluates the same frozen candidate alongside the existing shipping shapes, including the three companion minus targets. Its complete-output expectations are recorded separately in the shared corpus.

| Phase                               | Gate | Rules-only labels          | Candidate labels            | Rules-only spacing         | Candidate spacing           |
| ----------------------------------- | ---- | -------------------------- | --------------------------- | -------------------------- | --------------------------- |
| Screening                           | Pass | 8/14 cases; 16/28 attempts | 12/14 cases; 24/28 attempts | 8/14 cases; 16/28 attempts | 12/14 cases; 24/28 attempts |
| Confirmation, each of 2 comparisons | Pass | 8/14 cases; 48/84 attempts | 12/14 cases; 72/84 attempts | 8/14 cases; 48/84 attempts | 12/14 cases; 72/84 attempts |
| Holdout, each of 2 comparisons      | Pass | 6/8 cases; 36/48 attempts  | 8/8 cases; 48/48 attempts   | 6/8 cases; 36/48 attempts  | 8/8 cases; 48/48 attempts   |

Spacing counts are identical for individual targets and combined excerpts; both were checked independently. A passing case requires every scheduled attempt to pass. Candidate sign controls stayed correct in all 184/184 accuracy attempts, with zero false `conjunction`. Development label and spacing accuracy are each 85.7%; holdout label and spacing accuracy are each 100%. Repeated attempts are not additional independent cases.

## Frozen protocol

Goal: distinguish a conjunction from a sign in tight `CJK+N`. Only `conjunction` inserts a space after the plus in core `spaceText()` output. Invalid answers, errors, `signed-number`, and `unsure` leave core output unchanged; errors still fail the experiment gate.

Baseline: `rules-only`, evaluated offline with constant `signed-number`, without model inference. Start with `v1-en`, a concise English instruction with three fixed labels and no examples. Parent: none. Hypothesis: sentence meaning is enough to fix the supplied ID-format case while preserving signs. The production digit-plus English prompt and hyphen-digit Chinese prompt are prior art only; no historical accuracy is reused.

Code starts at `417af36dd085fc1dfada7568b4f985688e2025cc`. Harness and corpus revisions become retrievable from this round's commit. Model sampling: temperature 0, topK 1, no language declarations, string schema ordered `signed-number`, `conjunction`, `unsure`, `omitResponseConstraintInput: false`. Each order gets a fresh base session; each inference attempt gets a fresh clone.

Screening: corpus order and seed-1 shuffle, 1 attempt per target per order. The safety gate requires every sign case to retain correct individual and combined spacing on every attempt, with zero false `conjunction`; at least one conjunction case must improve over rules-only. Label accuracy is reported separately, so safe abstention is a label miss. No inference errors, missing answers, or skipped attempts are allowed.

Confirmation: freeze one qualifying candidate, then 2 fresh paired comparisons, each with 2 orders and 3 attempts per target. Reverse baseline/candidate execution order in comparison 2. Both comparisons must pass, with at least one same stable conjunction improvement. Each rules-only comparison is freshly generated offline.

## Holdout declaration, before screening

Collect holdouts only after confirmation passes, in a separate agent context that receives the frozen contract, coverage rules, and excluded pages but no candidate prompt. Keep holdout text and labels private until both paired runs are saved. Use the confirmation schedule and reverse execution order for the second pair. No holdout diagnostics or tuning in this round.

Aim for at least 8 targets from at least 4 new canonical pages and 3 publishers: at least 2 conjunctions (one ID-format description and one other item join), at least 4 signs covering phone prefixes, positive temperatures, score deltas, and financial/percentage changes. Any unavailable category remains an explicit coverage gap; do not substitute synthetic text. Require at least one verified sign and one conjunction before interpreting a holdout gate as evidence for this shape.

Examples: none. Development, examples, and holdout must have disjoint canonical pages. Treat redirects and AMP equivalents as one page; exclude copied or syndicated passages already seen in development. The user-provided seed is its own page and cannot be a holdout. Record shared publishers and domains rather than claiming independent publishers from repeated targets. Once holdout evidence is inspected, end tuning; evaluated holdouts may move to development with exposure recorded.

## Collection controls

Use public Taiwanese text verified in Chrome Beta with Pangu disabled. Preserve source text, minimal fixtures, exact UTF-16 offsets, context, gold labels, per-target spacing, combined spacing, and exposure. The seed source is `provided by users`, with evidence `user-provided; maintainer-confirmed real case`; do not search for its URL.

Count distinct inspected target contexts by meaning, with repeated page/title text deduplicated. Report excluded multi-plus contexts and failed captures separately. Searches deliberately seek both readings and specific domains, so collection frequency is a sample yield, not a population prevalence estimate.

The Phase 1 evaluator checks the frozen core-plus-edit contract. Production plus-digit detection does not exist: routing remains unverified until Phase 2. Replay through that detector, remove cases that fail routing, and recompute gates before shipping.

## Development corpus and collection yield

Frozen selection: `user-seed-1`, `user-seed-2`, `chu-id-format`, `colatour-parent-child`, `eztravel-transport-attractions`, `udn-score-title`, `udn-score-21`, `udn-score-20`, `boca-phone-886`, `boca-phone-853`, `nidec-temperature-85`, `jingxu-capacitance-56`, `jingxu-temperature-125`, `udn-points-threes`, in that order. Corpus: `../../corpus/development.json` at the round commit. There are 14 targets, 14 model contexts, 13 source excerpts, 9 pages (8 public plus the user seed), and 7 named public publishers plus an unknown seed publisher. UDN supplies two pages and four targets; repeated targets are not independent sources.

Ten distinct public URLs were attempted in Chrome; nine loaded and eight supplied targets. The NTU student-association page failed with an HTTP/2 error. ToAlpha loaded but had no eligible target inside a text node. Deduplicating the repeated UDN headline leaves 16 inspected tight targets: 4 conjunctions and 12 signs. Four signs had multiple pluses in their extracted context and were excluded. The scored public yield is therefore 4 conjunctions versus 8 signs. Adding the two confirmed user targets gives 6 versus 8. Conjunctions occurred in ID formatting, ticket bundles, and sports prose; this targeted sample does not establish that the shape is rare or common in general.

A separate sign-focused search inspected 17 URLs and found more phone, temperature, score, and financial candidates. Search snippets and web-only observations did not qualify for the corpus. The stable financial prose found was a PDF with multiple pluses; the live stock widget had no eligible node. Price/stock deltas were absent from development; holdout later added three percentage-change rows. Broad searches also returned fullwidth pluses, authored spaces, and non-Taiwan sources; those were not treated as eligible targets.

The sign-focused scout used 46 queries and counted 23 sign occurrences plus two copies of one conjunction headline in Taiwanese candidate sources, before DOM/routing checks. These counts overlap the Chrome collection and must not be added to it. Query families included `撥打+886`, `請撥+886`, `溫度+5`, `氣溫+3`, `至+85`, `正負值+20`, `報酬率+5`, and `漲幅為+`. Conjunction searches included ID-format, parent-child ticket, meal, and transport-bundle phrases. The verified Chrome counts above are the reproducible scored yield.

Eight sign controls cover phone prefixes (2), basketball plus/minus (3), temperatures (2), and a positive percentage bound (1). Six conjunctions cover ID formatting (3), ticket bundles (2), and sports items (1). No verified `unsure` gold was collected. The school regex sentence and short ticket snippets are intentionally retained as difficult contexts.

Extra exposed pages excluded from holdout: `ntumcsa.com/index.php?action=page&pid=freshman/mobile&qy=1`, `udn.com/news/story/7002/9189236` and its AMP form, `civil.yunlin.gov.tw/News_Content.aspx?n=9462&s=384453`, `toalpha.tw/market`, and the Taiwan Futures Exchange 2025-05-13 new-products training PDF. Exclude syndicated copies of all inspected excerpts and the Jingxu/Wikipedia capacitor passages.

## Runtime and preflight

Chrome Beta `157.0.8103.6`, Node `v24.22.0`, Gemini Nano component `2025.8.8.1141`, model manifest `1.20261018.2`. Exact weights are unavailable. Manual verification found model availability `available`, actual session temperature 0 and topK 1. `LanguageModel.params()` serialized as an empty object; actual session sampling was independently read. Sweep verifies the intended profile and extension service worker on each model run.

The existing evaluation profile loads the main checkout at `fc710c3cd3394ae683e8d9242fb95c699da6d462`, rather than this worktree. Git comparison confirms `src/` and `browser-extensions/` are identical to the worktree base. The runner supplies its own frozen prompt sessions. This source-identical runtime was reused to honor the Phase 1 restriction against changing extension files; no extension reload/build was needed.

Locked dependencies were installed with `npm ci --no-audit --no-fund`. `npm run build:lib` passed. All 23 runner/gate tests passed before inference. Offline corpus validation passed, and all 14 minimal fixtures reproduced the live `readSentence()` contexts and offsets. The seed fixture checks its supplied text rather than an unavailable original DOM. Production plus-digit routing remains unverified.

An initial private capture bundle failed because the extension-local `pangu/browser` package was absent. The capture tool now resolves the worktree core directly and treats bundler warnings as errors. Fresh captures succeeded. A failed navigation initially interrupted later navigations; capture now uses a fresh inspection tab per source. Those failed captures are not source evidence.

## Iteration 1: `v1-en`

Frozen before inference. No examples, no parent prompt, and no language comparison claimed. The English instruction starts from the existing digit-plus register, with explicit definitions for positive values/changes, international phone prefixes, item/component joins, and abstention.

Screening passes the shared paired gate with no protocol issues, errors, regressions, unstable cases, or attempt declines. Rules-only passes 8/14 cases and 16/28 attempts. Candidate passes 12/14 cases and 24/28 attempts, separately for labels, individual spacing, and combined spacing. All 8 sign cases pass every attempt. Stable improvements: `user-seed-1`, `user-seed-2`, `colatour-parent-child`, and `eztravel-transport-attractions`. Remaining misses: `chu-id-format` and `udn-points-threes`.

Decision: freeze `v1-en` for confirmation. The required safety-and-improvement gate passed, so do not add wording merely to chase perfect development accuracy. Diagnose the two misses for the record without changing the candidate.

The one-attempt diagnostics reproduced both `signed-number` misses. For the school case, Nano identified the letter and digit components correctly, then described their sequence as a positive quantity. For the headline, it translated the two scoring items but misidentified the neighboring target text and treated conjunction as joining complete clauses. These follow-ups suggest label interpretation and target grounding limits; they may be rationalizations and are not accuracy evidence. No prompt change followed.

## Confirmation

Both fresh comparisons pass the shared gate independently, with matching orders, frozen prompt bytes, questions, schemas, sampling, and no errors. In each comparison, rules-only passes 8/14 cases and 48/84 attempts; `v1-en` passes 12/14 cases and 72/84 attempts. These counts hold separately for labels, individual spacing, and combined spacing. The same four conjunction targets improve in both runs. No sign regression, unstable case, attempt decline, or protocol issue was observed.

Across screening and confirmation, the candidate passes 168/196 attempts for each metric. Every sign attempt passes: 112/112. The two development misses persist in every attempt. Repetition measures stability on this selection; it does not add independent source coverage.

An independent read-only harness review found no blocker. It verified rejection of false conjunctions, missing/errored answers, and sampling mismatches, plus frozen prompt/schema checks and combined seed scoring. Existing hyphen-digit defaults remain unchanged. Holdout collection starts only after the saved confirmation gate passes.

A later harness review found that standalone plus-digit scoring assumed two orders even when `--orders 1` or `3` was requested. The scorer now uses the artifact's actual order count; paired gates still require exactly two. All 25 runner/gate tests pass. Reverification of the saved two-order screening and confirmation artifacts produced the same scores and passing gates. No prompt, model input, edit contract, or inference result changed.

## Holdout

A separate collector received the contract, declared coverage, and source exclusions after confirmation passed, without candidate wording or answers. Its frozen selection contains `holdout-plus-digit-01` through `holdout-plus-digit-08`, in numeric order: 8 targets, 8 contexts, 8 excerpts, 6 new pages, and 6 new publishers. It covers two conjunctions (medical Z-code format and a parent-child ticket) and six signs (phone prefix, three financial percentage rows, basketball plus/minus, and temperature). The declared minimums and category checklist were met. No example pages exist; development and holdout pages are disjoint. The TMTI page's incorrect homepage canonical tag was replaced by its final detail URL as page identity.

The first invocation stopped at preflight because the private collector file lacked top-level `role: "holdout"`; it performed no inference. A new private copy added that metadata without changing cases. Both complete paired comparisons were then saved before reading their scores or answers. Each used two orders and three attempts per target; comparison 2 ran the candidate before the offline baseline. No holdout diagnostics or prompt changes followed.

Both gates pass independently without errors, regressions, instability, attempt declines, or protocol mismatches. Candidate labels: 8/8 cases and 96/96 attempts across both comparisons. Candidate individual spacing: 8/8 cases and 96/96 attempts. Candidate combined spacing: 8/8 cases and 96/96 attempts. Rules-only passes 6/8 cases and 72/96 attempts for each metric. Both conjunctions improve in both comparisons; all 72 sign attempts retain correct spacing and labels.

Holdout collection made 14 capture attempts against 13 distinct URLs; 12 URLs loaded and 9 supplied tight targets. It observed 7 conjunctions, 8 signs, and one unresolved arithmetic use (`標距長度+2`). Eight targets were selected. Exclusions: five overlapping ID-format conjunctions, one syndicated phone headline, one sign with a multi-plus context, and the arithmetic cell. A closed storefront and two other loaded pages supplied no eligible text; Changyu failed twice. The three selected financial cases share one template and page, so they count as one source page.

Across the two disjoint public collection passes, the observed yield is **11 conjunctions versus 20 signs**, plus one unresolved arithmetic use (32 tight occurrences). Adding the two confirmed user targets would give 13 versus 20, plus one unresolved use. The scored selection is **8 conjunctions versus 14 signs**, including the two user targets. These are deliberately targeted collection frequencies, not estimates of how commonly Taiwanese prose uses either reading.

## Remaining failures and coverage limits

`chu-id-format` and `udn-points-threes` remain consistently wrong: the candidate returns `signed-number` for conjunctions and leaves the missing space unfixed. This is the current classification bottleneck. The seed's two targets, both development ticket cases, and both holdout conjunctions improve over rules-only.

There are no verified gold `unsure` cases. Only two unseen conjunctions were evaluated; the held-out identifier is a medical Z code, not a national ID. Financial coverage is three correlated rows from one page, and positive temperatures are technical ranges. No held-out meal bundles, general mathematical addition, broader sentence structures, or inline-node boundary cases were evaluated. The ZwickRoell case is localized Taiwan-facing text, not independently authored Taiwanese prose. The user seed's original DOM and publisher are unavailable. These limits prevent a broad generalization claim.

Production routing remains unverified for every case. A Phase 2 detector could exclude or change a context, which would change the scored selection and require recomputed gates. Applying the winner, extension integration tests, ADRs, and release notes require separate work.

## Retention and verification

The shared corpus now retains all 22 evaluated targets as development: 22 model contexts, 21 source excerpts, 15 page identities (14 public plus the seed), and 13 named public publishers plus the unknown seed publisher. Per-record exposure identifies the original eight holdouts; they are no longer unseen. Prompt examples remain empty. Only `REPORT.md` and `prompts.mjs` are retained in this result directory.

Retained records were built from the public-field allowlist, with nested exposure and verification fields selected explicitly. The TMTI fixture was reduced to its exact target text node and adjacent line break, preserving its captured context and offset. Final Chrome replay reproduced all 22 retained model inputs and offsets. Offline loader checks validated all individual and combined gold edits. Public corpus and report fields were reviewed for local paths, connection values, and unrelated captured content. Raw answers, diagnostics, runtime records, source captures, and gates remain ignored under `local/prompt-experiments/20261023-plus-digit/`.

Final checks: 25 runner/gate tests passed after the order-count fix; library build passed; focused formatting and `git diff --check` passed. Saved screening and confirmation gates were reverified with the corrected scorer, and both holdout comparisons passed the same shared evaluator. Reconstructing both selections from the final retained corpus also reproduced all three passing gates against saved answers. Temporary inspection pages were closed, Pangu was restored enabled with its worker verified, and the evaluation connection was detached. No full build, extension build, production test suite, lint, or typecheck was run: the changed harness is outside ESLint's configured scope, and production integration is outside Phase 1.

## Reproduce the frozen selections

Use the corpus and prompts at this round's commit. The commands below reconstruct the original ordered selections from the retained corpus; later exposure metadata does not change model inputs or gold. Set a new `rerun` directory for each rerun. A fresh browser/model run is new evidence and can differ from the results above. Follow the skill's connection and runtime checks before inference.

```bash
export PLUS_DIGIT_RERUN=local/prompt-experiments/plus-digit-rerun
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
const out = outputDirectory(process.cwd(), process.env.PLUS_DIGIT_RERUN);
const corpus = JSON.parse(readFileSync('scripts/prompt-experiments/plus-digit/corpus/development.json', 'utf8'));
for (const role of ['development', 'holdout']) {
  const cases = corpus.cases.filter(k => k.id.startsWith('holdout-plus-digit-') === (role === 'holdout')).map(k => ({ ...k, role }));
  writeFileSync(join(out, `${role}.json`), JSON.stringify({ ...corpus, role, cases }), { flag: 'wx' });
}
NODE
```

Use `--orders 2 --repeats 1` for screening. Use `--orders 2 --repeats 3` for each confirmation and holdout comparison. The runner's second order is its fixed seed-1 shuffle. In every phase, generate a fresh offline baseline with the candidate. Reverse positional variants for comparison 2; artifact filenames follow invocation order.

```bash
prompts=scripts/prompt-experiments/plus-digit/results/20261023-first-shape/prompts.mjs
sweep=scripts/prompt-experiments/sweep.mjs
gate=scripts/prompt-experiments/hyphen-digit/check-paired.mjs

node --env-file-if-exists=scripts/prompt-experiments/.env.local "$sweep" --experiment plus-digit --prompts "$prompts" --cases "$PLUS_DIGIT_RERUN/development.json" --orders 2 --repeats 1 --out "$PLUS_DIGIT_RERUN/screen" rules-only v1-en
node "$gate" --experiment plus-digit --phase screening --cases "$PLUS_DIGIT_RERUN/development.json" --prompts "$prompts" --baseline rules-only --out "$PLUS_DIGIT_RERUN/gate-screen" "$PLUS_DIGIT_RERUN/screen/1-rules-only.json" "$PLUS_DIGIT_RERUN/screen/2-v1-en.json"

# Proceed to confirmation only if screening passes; proceed to holdout only if confirmation passes.
for phase in confirmation holdout; do
  cases="$PLUS_DIGIT_RERUN/development.json"
  if [ "$phase" = holdout ]; then cases="$PLUS_DIGIT_RERUN/holdout.json"; fi
  node --env-file-if-exists=scripts/prompt-experiments/.env.local "$sweep" --experiment plus-digit --prompts "$prompts" --cases "$cases" --orders 2 --repeats 3 --out "$PLUS_DIGIT_RERUN/$phase-1" rules-only v1-en || break
  node --env-file-if-exists=scripts/prompt-experiments/.env.local "$sweep" --experiment plus-digit --prompts "$prompts" --cases "$cases" --orders 2 --repeats 3 --out "$PLUS_DIGIT_RERUN/$phase-2" v1-en rules-only || break
  node "$gate" --experiment plus-digit --phase "$phase" --cases "$cases" --prompts "$prompts" --baseline rules-only --out "$PLUS_DIGIT_RERUN/gate-$phase" "$PLUS_DIGIT_RERUN/$phase-1/1-rules-only.json" "$PLUS_DIGIT_RERUN/$phase-1/2-v1-en.json" "$PLUS_DIGIT_RERUN/$phase-2/2-rules-only.json" "$PLUS_DIGIT_RERUN/$phase-2/1-v1-en.json" || break
done
```

Original local evidence uses `screen-v1`, `confirmation-1`, `confirmation-2`, `holdout-ready-1`, and `holdout-ready-2`; reverse-order comparisons store `1-v1-en.json` and `2-rules-only.json`. Verified gates are `verified-screen-v1/gate.json`, `verified-confirmation/gate.json`, and `gate-holdout/gate.json`. Final retained-corpus checks are in `retained-gate-screen`, `retained-gate-confirmation`, and `retained-gate-holdout`. These paths locate local audit evidence; the committed corpus, prompts, controls, and commands above are sufficient to rerun without those temporary files.
