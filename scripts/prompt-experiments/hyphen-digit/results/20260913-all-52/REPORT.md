# All 52 development targets

## Current state

Round complete for the user's final scope: the current 52-case corpus. `letter-unit` passes screening and both fresh confirmation comparisons on labels, individual spacing, and combined spacing, including all 624 confirmation attempts. Both confirmation comparisons preserve every shipping pass and fix the same 11 baseline-failing cases without errors or attempt declines. The earlier timeout-interrupted comparison remains incomplete and excluded. The repaired runner and all 14 runner/gate tests pass. The user explicitly waived further holdout collection and evaluation because the current corpus was enough. The candidate remains experimental; production application and extension integration are separate work.

## Goal and controls

Pass every scheduled development and holdout attempt on labels, individual spacing, and combined spacing, while preserving every baseline-passing case. Production and prompt tests stay unchanged. Revision: `445554ddcac16eb7409d5e9e8fbd7ce71c4cf464`.

Screening: all 52 verified targets, corpus order and seed-1 shuffle, 1 attempt per target per order. Confirmation: 2 fresh paired comparisons, each with 2 orders and 3 attempts per target; reverse prompt order in comparison 2. Each order creates a fresh base session and every attempt uses a fresh clone. Temperature 0, topK 1, no language declarations, the ordered production string schema, and `omitResponseConstraintInput: false`. No examples or source exclusions. Baseline is fresh shipping v28-zh.

Only after confirmation passes, a separate context will collect 3 new canonical pages outside all development: an age-threshold separator, a negative value, and a financial-tenor separator. Preserve every eligible target in each source excerpt; counts may exceed 3. Keep text and labels outside tuning until both fresh paired holdout comparisons finish. Use the same 2-run confirmation schedule for holdout.

## Reused evidence

The previous round's age-conditions changes only 年齡 to 年齡區間、年齡門檻 and passes all 34 original development targets. Both holdout comparisons improved shipping from 8/18 to 12/18 passing cases without regressions, but left 1 negative-temperature and 5 tenor failures. Two candidate tenor cases were unstable across orders (3/6 correct each run). These 18 targets are development now; they will not serve as unseen holdouts again.

Reuse the existing 14 passing runner/gate tests and matching hashes recorded in the prior report. Full production replay just passed all 52 inputs, complete target annotations, individual/combined spacing, page separation, and authored-space exclusion. Only exposure metadata and roles changed after replay. Browser connection remains continuous: Chrome Beta 154.0.8037.17, Node v24.18.1, Playwright CLI 0.1.18, Nano 2025.8.8.1141, manifest 1.20260810.11. Profile, checkout, worker, availability and actual temperature 0 / topK 1 were verified; exact weights are unavailable. Source collection used the healthy CLI after a separate attach timeout.

## Frozen selection

The experiment ran against an uncommitted corpus; the final blob below is retained by the commit containing this report. Final formatting changes its blob from the measurement fingerprint `158fc4bd26adb080acd8766cb31c7c6e662f6e2b`; all parsed records are identical to the frozen scored selection.

```json
{
  "corpusPath": "scripts/prompt-experiments/hyphen-digit/corpus/development.json",
  "corpusBlob": "8e6ada52a4a2e34ad9c9fc5c264d18f9d5fe8905",
  "ids": [
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
    "macromicro-labor-15-plus",
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

Diagnostics on the exposed freezer case and 2 bond fields used `age-conditions`, 1 order and 1 attempt, with the 3 frozen follow-up questions. The model translated the freezer temperature as negative but initially chose the separator label. It translated the 10-year government bond as a positive term, then claimed the sign represented a negative maturity. The 5-year field passed its diagnostic classification, but its target identification quoted both government and corporate fields. These answers suggest inconsistent label interpretation and ambiguous cropped fragments; they do not count as accuracy evidence.

1. `semantic-menu`, parent `age-conditions`. Change only the menu descriptions to classify numeric meaning: values below zero or outgoing cashflow versus names, ages, and positive tenors. Explicitly connect negative temperature with `零下`. Prediction: recover the freezer and bond fields without changing target boundaries or the successful age-threshold system wording. Preserve question order, labels, schema, sampling, all 52 cases, and no source exclusions. Freeze before inference; run with a fresh shipping baseline for this expanded round.

Fresh shipping passes 41/52 labels, individual spacing, and combined spacing. The same 11 cases fail as in the prior combined development/holdout evidence; 2 tenor cases are unstable across orders. Runtime preflight passes with unchanged browser, profile, worker, model availability, schema, and sampling.

`semantic-menu`: 51/52 labels and both spacing checks. Every separator passes, including all bond tenors and both labor-age headings. The FDA freezer case still returns the separator label in both orders. No errors or instability. Its paired gate passes without regressions or attempt declines, but the all-pass requirement remains unmet. Reuse this round's fresh shipping baseline for the next candidate.

2. `negative-bounds`, parent `semantic-menu`. Change only the signed-number menu by stating that a negative value remains signed when it is a range's upper or lower bound. Prediction: the model understands the freezer value is negative but may let the threshold wording override the sign classification. Preserve all other prompt bytes and controls. Frozen before inference.

`negative-bounds`: 51/52 labels and both spacing checks. All 15 signed values now pass, including the freezer. The 10-year government-bond field (`blind-age-threshold-20260913-06`) returns to the wrong signed label. No errors or instability. The paired gate passes against shipping, but the all-pass requirement is still unmet. This fixes the temperature interpretation while losing 1 separator relative to `semantic-menu`.

3. `complete-unit`, parent `negative-bounds`. Change only the target quote from 1 to 2 authored characters after the number. Prediction: the remaining quote ends in `年`, hiding the complete `年期` unit. The diagnostic translated this positive tenor correctly but still called its sign negative. Keep the negative-bound menu and age system wording that now classify every other case correctly. Freeze before inference and reuse the same shipping baseline.

`complete-unit`: 51/52 labels and both spacing checks. All separators pass, including the 10-year government bond, but the negative EasyCard balance (`real-holdout-07`) regresses. Its quote changed from `就-100吧` to `就-100吧 `, adding whitespace rather than unit information. The wider quote also includes another hyphen in 2 course cases (`成-1,-` and `修-2,-`). Reject this candidate: its paired gate fails, and the unconditional boundary expansion weakens target identification.

4. `letter-unit`, parent `negative-bounds`. Change only the quoted target boundary: retain 2 following characters when both are Unicode letters; otherwise retain the production 1-character boundary. Prediction: keep `年期` visible while preserving the balance and course quotes exactly. This is a bounded context quote, not a unit parser; the full original sentence remains unchanged. Freeze before inference, reuse the same fresh shipping baseline, and diagnose the balance regression separately.

The balance diagnostic reproduced the separator error, quoted the target including its added trailing space, translated the amount as negative, and explained it as negative. This supports testing the target boundary; it does not replace scored evidence. Before `letter-unit` inference, offline checks verified identical prompt text after the first line, exactly 1 hyphen in all 52 quotes, and unchanged balance/course questions. Unicode matches use their UTF-16 length when slicing.

`letter-unit`: 52/52 labels and both spacing checks, 104/104 correct attempts, no errors, skips, missing answers, instability, regressions, or attempt declines. The paired gate passes. Freeze this candidate for confirmation.

## Confirmation

Both comparisons use 52 targets × 2 orders × 3 repeats = 312 fresh attempts per prompt. Comparison 1 runs shipping then candidate; comparison 2 reverses that order. The candidate must pass all 624 confirmation attempts, and both paired gates must independently preserve baseline passes with a shared stable improvement. Screening answers are not reused.

The first attempt at comparison 1 ended with SIGTERM during shipping because the CLI subprocess had a fixed 120,000 ms timeout. Its incomplete artifact was retained; it provides no accuracy evidence. No candidate or second comparison ran in that interrupted batch. The runner now budgets 120 seconds for setup plus the existing 30-second limit for each scheduled classification and diagnostic call. Prompt API options, per-call limits, orders, and repeats are unchanged. This uses the documented [Node.js subprocess timeout](https://github.com/nodejs/node/blob/main/doc/api/child_process.md) behavior. The connection remained healthy and returned the same browser version, extension worker, and page inventory without reconnecting.

The helper change invalidates the reusable runner test result and screening baseline. Both were scheduled afresh before confirmation; production fixture replay remains valid because its inputs, replay tooling, and browser are unchanged. All 14 runner/gate tests pass, including a subprocess probe checking the actual timeout for both experiment shapes. Repair versions: `sweep.mjs` blob `aa0710ab12a1af624b266de9b1af7c53149c27cb`; `sweep.test.ts` blob `1e1fb2d2cec2687318c236a80dac57de9fff8abf`. Both versions are retained in the experiment's commit history.

Refreshed screening reproduces shipping 41/52 and candidate 52/52, with the same 11 stable improvements. All 104 candidate attempts pass separately on labels, individual spacing, and combined spacing. Both runs are complete and error-free; the frozen-protocol paired gate passes. The candidate has no skips, instability, regressions, or attempt declines. This new pair is the screening evidence for the repaired runner. ESLint passes for the runner; the test file is outside the repository's ESLint configuration and is covered by Vitest and Prettier.

Both repaired confirmation pairs complete with shipping 41/52 cases and 252/312 correct attempts per pair, versus candidate 52/52 and 312/312. These counts hold separately for labels, individual spacing, and combined spacing. Shipping retains its 2 unstable tenor cases; the candidate has no errors or instability. The shared confirmation gate passes both comparisons independently, records all 11 shared stable improvements, and reports no protocol issues, regressions, or attempt declines. Independent read-only inspection of the first pair confirms frozen systems, every rendered question, ordered schemas, sampling, runtime checks, 2 orders, and 6 valid answers per target. The gate checks both saved pairs against the same frozen protocol and production edits.

Both `macromicro-labor-15-plus` and `macromicro-labor-15-64` receive the correct separator label in all 12 confirmation attempts. The requested output is `勞動參與率 - 15 歲以上`; the earlier working case remains `勞動參與率 - 15 歲至 64 歲`.

## Holdout collection

After confirmation, a separate collector captured and replayed 27 prospective holdout targets across the declared 3 categories. Before inference, the root agent requested an agent-status inventory; that tool unexpectedly included discovery agents' full final answers and exposed source text to the prompt-editing context. The prompt remained frozen and no model results existed. This pool is quarantined as exposed and cannot establish blind validation. A replacement pool was being collected with the same category coverage and page exclusions when the user explicitly said no new holdout cases were needed and the current corpus was enough.

Final scope therefore stays at the 52 shared development cases. Collection stopped; the quarantined 27-target pool and partial replacements remain unscored, local artifacts and were not merged into the shared corpus. No further holdout gate ran, and no blind-validation claim is made for this round. The abandoned pools provided no model answers or tuning evidence. This is a user-approved scope reduction, not a passing holdout result.

## Final verification

Initial screening, refreshed screening after the runner repair, and both fresh confirmation comparisons pass all scheduled candidate attempts: 104 + 104 + 312 + 312 = 832/832, separately for labels and both spacing checks. Every comparison's paired gate passes. The final candidate has no remaining failures, errors, skips, missing attempts, instability, regressions, or attempt declines on the 52-case selection. All 11 shipping failures become stable improvements, including the requested age threshold.

The 14 runner/gate tests pass after the timeout change. Production replay passes all 52 source inputs, UTF-16 offsets, routing, complete target annotations, individual and combined spacing, and authored-space exclusion. Its matching result remains valid after formatting-only corpus changes. Independent audits checked frozen prompts and saved screening/confirmation controls, source provenance, privacy, and retained selections. Prettier and `git diff --check` cover the changed artifacts; ESLint covers the runner, while its existing configuration excludes the test file. Production source, production prompt tests, dependencies, and generated bundles are unchanged. Pangu was restored enabled with the expected worker and available model; temporary inspection tabs were closed and the evaluation client detached, leaving Chrome running.

## Coverage

Development contains 52 targets, 50 distinct source/input contexts, 49 distinct source/text-node excerpts, 21 canonical pages, and 18 publisher hostnames. There are 15 signed-number targets and 37 separators, with no gold unsure cases. Sixteen financial-tenor fields share one data.gov.tw page and are correlated coverage. One retained government gallery caption was initially hidden; its recorded fixture styles and production replay pass, but it does not establish ordinary visible-page traversal coverage. Repeated answers measure stability on these saved inputs, not universal correctness.

## Rerun

Restore the recorded production revision and use the repaired helper versions above. Reconstruct the exact 52 IDs from the recorded corpus version after it has been committed. Future additions are outside this development selection. Use the verified browser setup from the [command reference](../../../README.md). Each invocation needs a new ignored output directory. New inference creates new evidence and may change with the runtime.

````bash
# Create the exact ordered selection in a new ignored directory.
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
const report = readFileSync('scripts/prompt-experiments/hyphen-digit/results/20260913-all-52/REPORT.md', 'utf8');
const selection = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)[1]);
const restored = JSON.parse(execFileSync('git', ['show', selection.corpusBlob], { encoding: 'utf8' }));
const byId = new Map(restored.cases.map((kase) => [kase.id, kase]));
const cases = selection.ids.map((id) => {
  assert(byId.has(id), 'Missing frozen case: ' + id);
  return { ...byId.get(id), role: 'development' };
});
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/all-52-rerun/inputs');
writeFileSync(out + '/development.json', JSON.stringify({ ...restored, role: 'development', cases }, null, 2) + '\n', { flag: 'wx' });
NODE

corpus=tmp/prompt-experiments/all-52-rerun/inputs/development.json
prompts=scripts/prompt-experiments/hyphen-digit/results/20260913-all-52/prompts.mjs

# Replay when the documented reuse conditions require it.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases "$corpus"

# Screen the final candidate against fresh shipping.
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$corpus" --prompts "$prompts" --out tmp/prompt-experiments/all-52-rerun/screen shipping letter-unit

node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --phase screening --cases "$corpus" --prompts "$prompts" --baseline v28-zh --out tmp/prompt-experiments/all-52-rerun/gate-screen tmp/prompt-experiments/all-52-rerun/screen/1-shipping.json tmp/prompt-experiments/all-52-rerun/screen/2-letter-unit.json

# Confirm with fresh pairs and reversed prompt order.
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$corpus" --prompts "$prompts" --orders 2 --repeats 3 --out tmp/prompt-experiments/all-52-rerun/confirm-1 shipping letter-unit
node --env-file=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases "$corpus" --prompts "$prompts" --orders 2 --repeats 3 --out tmp/prompt-experiments/all-52-rerun/confirm-2 letter-unit shipping

# Check confirmation labels, production spacing, and the frozen protocol.
node scripts/prompt-experiments/hyphen-digit/check-paired.mjs --phase confirmation --cases "$corpus" --prompts "$prompts" --baseline v28-zh --out tmp/prompt-experiments/all-52-rerun/gate-confirmation tmp/prompt-experiments/all-52-rerun/confirm-1/1-shipping.json tmp/prompt-experiments/all-52-rerun/confirm-1/2-letter-unit.json tmp/prompt-experiments/all-52-rerun/confirm-2/2-shipping.json tmp/prompt-experiments/all-52-rerun/confirm-2/1-letter-unit.json
````

For another screening candidate, substitute its frozen ID and use `--phase screening` with its saved baseline/candidate pair. Diagnostic runs use a development corpus with `diagnosticQuestions` copied from `DIAGNOSTIC_QUESTIONS` in the module, `--orders 1 --repeats 1`, and the recorded case IDs. Diagnostics do not count toward accuracy.
