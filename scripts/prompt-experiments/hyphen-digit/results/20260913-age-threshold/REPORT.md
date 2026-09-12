# Age threshold experiment

## Current state

Round closed. `age-conditions` passes screening, both confirmation comparisons, and both holdout gates without regressions. It fails the user's stricter all-cases-correct requirement: 46/52 cases and 632/692 scored attempts pass.

The 18 evaluated holdouts are now development records. No further tuning belongs in this round. The follow-up `20260913-all-52` passes all 52 records with `letter-unit`; the user then waived additional holdout collection and evaluation.

## Goal and controls

Make the requested age threshold pass while preserving every existing development case. The user also requires every evaluated case to pass. Production source and prompt tests stay unchanged. Revision: `445554ddcac16eb7409d5e9e8fbd7ce71c4cf464`. Shipping is `v28-zh`, the previous round's `question-first-cashflow` winner. Its system and rendered questions match that winner on all 33 existing cases.

Screening uses all verified development targets, corpus order and seed-1 shuffle, with 1 attempt per target per order. Temperature 0, topK 1, no language declarations, and the production string schema with ordered labels `signed-number`, `range-or-separator`, `unsure`. `omitResponseConstraintInput` stays false. Each order starts a fresh base session; every target attempt uses a fresh clone. No examples or source-page exclusions.

Confirmation requires 2 fresh paired runs, each with 2 orders and 3 attempts per target per order. Run 2 reverses prompt execution order. Every candidate attempt must pass labels, individual spacing, and combined spacing. The paired gates must preserve baseline passes and show the same stable improvement in both confirmation runs.

The declared plan required fresh holdout collection in a separate context after confirmation passed. Coverage: 3 canonical pages outside development, containing an age threshold separator, a negative value, and a financial tenor separator. Holdout text and gold stayed outside prompt editing until both paired comparisons finished. Holdouts used the same 2-run confirmation schedule. No verified `unsure` coverage was promised.

## Reused evidence and setup

The previous round passed 33 cases after exposing its 3 holdouts. All 33 remain development cases. No retained source snapshot contains the exact new age threshold. The previous age-range diagnostic translated ages correctly while assigning the negative label; retaining the first character after the number fixed that range. Follow-up explanations remain interpretation evidence, not accuracy evidence.

Reuse the recorded 14 passing runner/gate tests: runner blob `2ffa9cfd0f2b1dff778653c06d8234c9a0c675a7`, gate blob `fefc16ac32f0056bf4d378d65b45c006c1c97052`, replay blob `7aa6482c2b3fd472925cf549d1b86bcfb962766e`, lockfile blob `727c6b556a4e05b5b33996eddf38f5c61a462b20`. Their current hashes match. Production replay was refreshed for the new record and current production revision; all 34 targets pass routing, individual/combined spacing, and authored-space exclusion.

Chrome Beta 154.0.8037.17, Node v24.18.1, Playwright CLI 0.1.18, Nano component 2025.8.8.1141, model manifest 1.20260810.11. The intended profile and loaded checkout were verified. Model availability is available; an actual session reports temperature 0 and topK 1. Exact weights are unavailable.

The stored browser endpoint returned 403. Refreshing the ignored local settings from the running browser's endpoint file restored attachment. The extension worker was initially absent and became available after opening its extension page. Manual checkout verification used the extension details page because its path is displayed with a home-directory abbreviation. No scored inference was attempted during these setup failures.

## Frozen selection

The merged corpus preserves all 34 development records and all 18 evaluated holdouts with their original IDs. Scored text, inputs, offsets, gold, and replay fixtures are unchanged. The ordered phase selections below reproduce the round. Their former holdout role describes this historical evaluation; these records are now exposed development.

The final merged blob below is retained by the commit containing this report. The pre-holdout development measurement fingerprint was `8f21b24dce581dcf986d582b66d635c12ca9d8a1`; reconstruct that selection from the retained merged corpus and ordered IDs below.

```json
{
  "corpusPath": "scripts/prompt-experiments/hyphen-digit/corpus/development.json",
  "corpusBlob": "8e6ada52a4a2e34ad9c9fc5c264d18f9d5fe8905",
  "developmentIds": [
    "real-development-01",
    "real-development-02",
    "real-development-03",
    "real-development-04",
    "real-development-05",
    "real-development-06",
    "real-development-07",
    "real-development-08",
    "real-development-09",
    "real-development-10",
    "real-development-10-stage-1",
    "real-development-10-stage-2",
    "real-development-11",
    "real-development-12",
    "real-development-blocktempo-19",
    "real-development-blocktempo-18",
    "real-development-blocktempo-17",
    "books-4-percent-ebook",
    "macromicro-labor-15-64",
    "macromicro-global-labor-25-54",
    "macromicro-us-cds-5y",
    "macromicro-us-treasury-10y",
    "real-holdout-01",
    "real-holdout-02",
    "real-holdout-03",
    "real-holdout-04",
    "real-holdout-05",
    "real-holdout-06",
    "real-holdout-07",
    "real-holdout-08",
    "jinbao-frozen-egg-white-minus-18",
    "ncku-advanced-course-file-1",
    "ptt-delivery-duration-3-to-5-days",
    "macromicro-labor-15-plus"
  ],
  "holdoutIds": [
    "blind-age-threshold-20260913-01",
    "blind-age-threshold-20260913-02",
    "blind-age-threshold-20260913-03",
    "blind-age-threshold-20260913-04",
    "blind-age-threshold-20260913-05",
    "blind-age-threshold-20260913-06",
    "blind-age-threshold-20260913-07",
    "blind-age-threshold-20260913-08",
    "blind-age-threshold-20260913-09",
    "blind-age-threshold-20260913-10",
    "blind-age-threshold-20260913-11",
    "blind-age-threshold-20260913-12",
    "blind-age-threshold-20260913-13",
    "blind-age-threshold-20260913-14",
    "blind-age-threshold-20260913-15",
    "blind-age-threshold-20260913-16",
    "blind-age-threshold-20260913-17",
    "blind-age-threshold-20260913-18"
  ],
  "exampleSources": []
}
```

## Iterations

Fresh shipping: 33/34 labels, no errors, skips, missing attempts, or instability. Both attempts on `macromicro-labor-15-plus` returned `signed-number`; the 15-to-64 age range still passes. Its quoted target is `率-15歲`, while the full sentence retains `以上`. The automatic preflight verified the intended profile, worker, model availability, schema, and sampling. Coverage: 34 targets, 32 source/sentence contexts, 31 original excerpts, 18 canonical pages, and 15 publishers counted by source hostname.

Shipping diagnostics used both age cases, 1 order and 1 attempt, followed by the frozen translation, target-identification, and label-meaning questions. Both translations preserved the age meaning. Both target identifications quoted `率-15歲`, and both explanations answered `Negative.`. The 15-plus diagnostic classification passed despite its failed scored baseline. This indicates instability; the diagnostic answer does not replace either failed baseline attempt.

1. `target-suffix`, parent `v28-zh`. Change only the quoted target's right boundary: retain the complete remaining source text instead of stopping after 1 character beyond the number. Prediction: preserving the age qualifier fixes the threshold without new domain rules. The question order, system, menu, labels, and sampling stay unchanged. Reuse the fresh 34-case shipping baseline under the same browser connection. Frozen before inference.

`target-suffix`: 30/34 labels. The new age threshold passes, but `real-development-08`, `real-development-12`, `real-holdout-01`, and `real-holdout-02` regress to separators. No errors or unstable cases. The paired gate fails. The wider quote also includes multiple hyphens in 9 cases, weakening target identification. Reject this candidate.

2. `age-conditions`, parent `v28-zh`. Change only the system's category wording from `年齡` to `年齡區間、年齡門檻`. Prediction: the model already translates the threshold correctly, so explicitly mapping both age conditions to the separator label may fix classification. Restore the unchanged production target quote and menu. Reuse the same fresh shipping baseline. Frozen before inference.

`age-conditions`: 34/34 labels, individual spacing, and combined spacing. All 68 attempts pass. No errors, skips, missing attempts, instability, regressions, or attempt declines. The screening gate passes. Freeze this candidate for confirmation.

## Confirmation

Run shipping then candidate in comparison 1, candidate then shipping in comparison 2. Each prompt receives 204 fresh attempts per comparison (34 targets, 2 orders, 3 repeats). Both paired runs must independently pass; the candidate must pass all 408 confirmation attempts. No screening answer substitutes for fresh inference.

Both confirmation comparisons pass the shared paired gate. In each, shipping passes 33/34 labels and both spacing checks; the candidate passes 34/34 and all 204 attempts. The same age threshold improves in both runs. No errors, instability, regressions, or attempt declines. Candidate confirmation total: 408/408 correct attempts for labels, individual spacing, and combined spacing.

## Holdout

The separate collector verified all 3 declared source categories. The financial source requires 16 correlated target annotations in its inline field group, so the frozen corpus contains 18 targets: 1 age threshold, 1 negative value, and 16 financial tenors. It still covers exactly 3 canonical pages, all disjoint from development. No model inference occurred during collection.

Blind corpus SHA-256 before evaluation: `44852cbe07785effe937c908307a89fb3891b9094b18e5aac063e4ce531c5ec6`. The existing production replay passed all 52 development and holdout targets together, including complete annotations, individual/combined spacing, page separation, and authored-space exclusion. Pangu was disabled during source capture, then re-enabled with its worker verified.

The collector's separate CDP attachment timed out. Source verification continued through the healthy existing CLI connection, retaining authored DOM, computed styles, and production routing evidence. The browser and evaluation connection were not restarted or reconnected. This source-collection limitation preceded inference and did not interrupt a scored comparison.

Both holdout comparisons used fresh shipping and the frozen candidate with 2 orders and 3 attempts per target per order. Comparison 2 reversed prompt order. All 4 artifacts were saved before answer inspection.

Both paired gates pass. Each run has 8/18 passing shipping cases and 12/18 passing candidate cases. Shipping has 54/108 correct attempts; the candidate has 78/108. Labels, individual spacing, and combined spacing agree on every result. No errors, missing attempts, regressions, attempt declines, or protocol issues occurred.

The same 4 targets improve in both runs: `blind-age-threshold-20260913-04`, `blind-age-threshold-20260913-07`, `blind-age-threshold-20260913-08`, and `blind-age-threshold-20260913-18`. Shipping targets `07` and `08` have 3/6 correct attempts per run. Candidate targets `12` and `14` also have 3/6. These partial results remain case failures.

The candidate fails the same 6 cases in both runs. IDs in this table use the prefix `blind-age-threshold-20260913-`.

| ID suffix | Source target                                 | Expected label     | Correct attempts in each run |
| --------- | --------------------------------------------- | ------------------ | ---------------------------: |
| 02        | Celsius freezer temperature, minus 18 degrees | signed-number      |                          0/6 |
| 06        | Government bond, 10-year tenor                | range-or-separator |                          0/6 |
| 12        | Corporate bond, 5-year tenor                  | range-or-separator |                          3/6 |
| 13        | Corporate bond, 6-year tenor                  | range-or-separator |                          0/6 |
| 14        | Corporate bond, 7-year tenor                  | range-or-separator |                          3/6 |
| 15        | Corporate bond, 10-year tenor                 | range-or-separator |                          0/6 |

The age threshold passes all 12 candidate holdout attempts. The negative-value case fails, and 5 financial-tenor cases still fail. Gold remains unchanged; no annotation dispute was found.

| Selection   | Targets | Source/input contexts | Original excerpts | Canonical pages | Publisher hostnames |
| ----------- | ------: | --------------------: | ----------------: | --------------: | ------------------: |
| Development |      34 |                    32 |                31 |              18 |                  15 |
| Holdout     |      18 |                    18 |                18 |               3 |                   3 |
| Total       |      52 |                    50 |                49 |              21 |                  18 |

The new pages are a [Taichung government gallery](https://www.news.taichung.gov.tw/14786/14792/14801/2184177), a [Chiayi health notice hosted by the FDA](https://www.fda.gov.tw/TC/csmnewsContent.aspx?id=t623669&mid=267), and [central-bank dataset metadata](https://data.gov.tw/dataset/10840). Their authored contexts and styles are retained in the shared corpus. The gallery caption starts with `display:none`; production routing and replay passed under that exact style. The 16 tenor fields share one inline group, so they are correlated coverage from one page.

After both evaluation pairs and their gate were saved, all 18 records moved to development. Each received 12 answers per prompt across the 2 comparisons. Their exposure notes now record that history. The shared corpus retains public provenance and fixtures without depending on temporary captures.

## Scores

A case passes only when every scheduled answer passes. Each case score below applies separately to labels, individual spacing, and combined spacing. Attempt totals also match across all 3 checks.

| Phase                                 | Shipping cases | Candidate cases | Shipping correct attempts | Candidate correct attempts | Paired gate |
| ------------------------------------- | -------------: | --------------: | ------------------------: | -------------------------: | ----------- |
| Screening                             |          33/34 |           34/34 |                     66/68 |                      68/68 | Pass        |
| Confirmation 1                        |          33/34 |           34/34 |                   198/204 |                    204/204 | Pass        |
| Confirmation 2, reversed prompt order |          33/34 |           34/34 |                   198/204 |                    204/204 | Pass        |
| Holdout 1                             |           8/18 |           12/18 |                    54/108 |                     78/108 | Pass        |
| Holdout 2, reversed prompt order      |           8/18 |           12/18 |                    54/108 |                     78/108 | Pass        |

The accepted candidate passes 476/476 development attempts and 156/216 holdout attempts, totaling 632/692. It passes 46/52 cases across the two phase selections. These totals exclude diagnostics and the rejected `target-suffix` experiment. All phase gates pass, but the user's all-cases-correct requirement fails.

## Verification

An independent read-only audit matched the frozen baseline to production and checked every rendered question and schema. It also verified both screening artifacts against their gates. At screening start, the 33 prior records were unchanged; the sole addition was the verified age threshold.

The confirmation audit verified 4 distinct fresh artifacts, reversed execution order, all 408 candidate attempts, and the same stable improvement in both runs. The saved holdout gate verifies both complete pairs, frozen controls, reversed prompt order, and production spacing. Its protocol issue, regression, and attempt-decline lists are empty.

The existing replay helper passed all 52 development and holdout targets before holdout inference. The later merge changed only roles and exposure/provenance metadata, so that replay remains valid. Merge checks preserved the original 34 records and all 18 added records' scored fields. Offline structure validation passes all 52 cases, and `git diff --check` passes. No production, prompt-test, runner, gate, dependency, or sampling changes belong to this experiment.

## Frozen candidate

`age-conditions` changes only `年齡` to `年齡區間、年齡門檻` in the system prompt. It reuses the unchanged production question builder, menu, labels, and sampling. There are no prompt examples, source exclusions, gold-dependent branches, or case-specific rules. [prompts.mjs](prompts.mjs) retains the baseline, both candidates, schema, and diagnostic questions.

The requested heading becomes `勞動參與率 - 15 歲以上`. The existing `勞動參與率-15歲至64歲` case remains correct. Each has 14/14 correct candidate attempts across screening and confirmation. Repeated attempts measure consistency on these inputs, not independent source coverage. No verified real `unsure` case is covered. Applying this candidate to production and checking its extension integration remain separate work.

## Rerun

Restore the recorded code revision before rerunning. The shared corpus now treats all 52 records as development. Reconstruct the historical phase selections from the recorded merged blob after its changes have been committed. Setting the replay role to holdout does not make those records unseen again.

Use the verified browser setup from the [command reference](../../../README.md). Each output directory must be new and ignored. These commands create new evidence; they do not replace this round's saved results.

````bash
# Create the exact ordered historical selections in a new ignored directory.
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
const report = readFileSync('scripts/prompt-experiments/hyphen-digit/results/20260913-age-threshold/REPORT.md', 'utf8');
const selection = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)[1]);
const restored = JSON.parse(execFileSync('git', ['show', selection.corpusBlob], { encoding: 'utf8' }));
const byId = new Map(restored.cases.map((kase) => [kase.id, kase]));
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/age-threshold-rerun/inputs');
for (const [role, ids] of [['development', selection.developmentIds], ['holdout', selection.holdoutIds]]) {
  const cases = ids.map((id) => {
    assert(byId.has(id), 'Missing frozen case: ' + id);
    return { ...byId.get(id), role };
  });
  writeFileSync(out + '/' + role + '.json', JSON.stringify({ ...restored, role, cases }, null, 2) + '\n', { flag: 'wx' });
}
NODE

corpus=tmp/prompt-experiments/age-threshold-rerun/inputs/development.json
holdout=tmp/prompt-experiments/age-threshold-rerun/inputs/holdout.json
prompts=scripts/prompt-experiments/hyphen-digit/results/20260913-age-threshold/prompts.mjs

# Replay the production contract when the documented reuse conditions require it.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases "$corpus" --cases "$holdout"

# Fresh screening control and accepted candidate.
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$corpus" --prompts "$prompts" --out tmp/prompt-experiments/age-threshold-rerun/screen shipping age-conditions

# Fresh confirmation, reversing prompt order in run 2.
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$corpus" --prompts "$prompts" --orders 2 --repeats 3 --out tmp/prompt-experiments/age-threshold-rerun/confirm-1 shipping age-conditions
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$corpus" --prompts "$prompts" --orders 2 --repeats 3 --out tmp/prompt-experiments/age-threshold-rerun/confirm-2 age-conditions shipping

# Run both historical holdout comparisons with fresh inference.
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$holdout" --prompts "$prompts" --orders 2 --repeats 3 --out tmp/prompt-experiments/age-threshold-rerun/holdout-1 shipping age-conditions
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$holdout" --prompts "$prompts" --orders 2 --repeats 3 --out tmp/prompt-experiments/age-threshold-rerun/holdout-2 age-conditions shipping

# Check the screening pair with production edits and the frozen baseline.
node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --phase screening --cases "$corpus" --prompts "$prompts" --baseline v28-zh --out tmp/prompt-experiments/age-threshold-rerun/gate-screen tmp/prompt-experiments/age-threshold-rerun/screen/1-shipping.json tmp/prompt-experiments/age-threshold-rerun/screen/2-age-conditions.json

# Check both confirmation pairs in baseline/candidate order.
node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --phase confirmation --cases "$corpus" --prompts "$prompts" --baseline v28-zh --out tmp/prompt-experiments/age-threshold-rerun/gate-confirmation tmp/prompt-experiments/age-threshold-rerun/confirm-1/1-shipping.json tmp/prompt-experiments/age-threshold-rerun/confirm-1/2-age-conditions.json tmp/prompt-experiments/age-threshold-rerun/confirm-2/2-shipping.json tmp/prompt-experiments/age-threshold-rerun/confirm-2/1-age-conditions.json

# Check both holdout pairs only after all 4 artifacts are saved.
node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --phase holdout --cases "$holdout" --prompts "$prompts" --baseline v28-zh --out tmp/prompt-experiments/age-threshold-rerun/gate-holdout tmp/prompt-experiments/age-threshold-rerun/holdout-1/1-shipping.json tmp/prompt-experiments/age-threshold-rerun/holdout-1/2-age-conditions.json tmp/prompt-experiments/age-threshold-rerun/holdout-2/2-shipping.json tmp/prompt-experiments/age-threshold-rerun/holdout-2/1-age-conditions.json
````

A successful sweep alone does not establish spacing or paired-gate correctness. Keep the baseline/candidate argument order for saved pairs, even when candidate inference ran first.

For historical development diagnostics, copy the 34-case selection and set `diagnosticQuestions` to `DIAGNOSTIC_QUESTIONS` from the frozen module. Run shipping with `--orders 1 --repeats 1 --diagnostics macromicro-labor-15-plus,macromicro-labor-15-64`. Diagnostics do not count toward accuracy. New diagnostics or prompt edits informed by these holdouts belong to `20260913-all-52`.
