# Hyphen-digit semantic rule experiment

This round adopted `real-r1-semantic` as `v27-zh`. Screening, both confirmation runs, holdout, and shipping integration passed every declared gate. The production change adds one semantic instruction to the system prompt. Detector behavior, context extraction, questions, ordered labels, schema, and sampling remain unchanged.

## Results

A passing target requires every scheduled attempt to have the right label, individual-target spacing, and combined excerpt spacing. Correct labels alone do not qualify a target.

| Phase                          | Attempts per target per prompt | Shipping labels | Candidate labels | Shipping full gate | Candidate full gate | Decision                  |
| ------------------------------ | -----------------------------: | --------------: | ---------------: | -----------------: | ------------------: | ------------------------- |
| New baseline                   |                              2 |           15/21 |                — |              15/21 |                   — | Six stable label failures |
| Matched screening              |                              2 |           15/21 |            19/21 |              15/21 |               17/21 | Pass                      |
| Confirmation run 1             |                              6 |           15/21 |            19/21 |              15/21 |               17/21 | Pass                      |
| Confirmation run 2             |                              6 |           15/21 |            19/21 |              15/21 |               17/21 | Pass                      |
| Holdout run 1                  |                              6 |             8/8 |              8/8 |                8/8 |                 8/8 | Pass                      |
| Holdout run 2                  |                              6 |             8/8 |              8/8 |                8/8 |                 8/8 | Pass                      |
| Final integration, development |                        1 fresh |           15/21 |            19/21 |              15/21 |               17/21 | Pass                      |
| Final integration, holdout     |                        1 fresh |             8/8 |              8/8 |                8/8 |                 8/8 | Pass                      |

The same two targets improved in both confirmation runs: `real-development-blocktempo-19` and `macromicro-labor-15-64`. Each passed all 12 candidate attempts and failed all 12 shipping attempts. No baseline-passing target regressed. No scored answer was unstable, missing, skipped, or errored.

Two course-stage labels also improved, but their shared original excerpt still contains a wrong first target. The full-spacing gate therefore counts neither stage as a passing case. This is why label correctness reaches 19/21 while the full gate reaches 17/21.

## Per-target confirmation and holdout checks

Counts below combine both fresh runs: 12 scheduled attempts per target per prompt. “Target” is individual-target spacing; “full” is combined excerpt spacing. A full case pass also requires the label and target checks.

### Development

| Target ID                        | Shipping labels | Candidate labels | Shipping target | Candidate target | Shipping full | Candidate full | Full case pass: shipping → candidate |
| -------------------------------- | --------------: | ---------------: | --------------: | ---------------: | ------------: | -------------: | ------------------------------------ |
| `real-development-01`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-02`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-03`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-04`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-05`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-06`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-07`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-08`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-09`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-10`            |            0/12 |             0/12 |            0/12 |             0/12 |          0/12 |           0/12 | fail → fail                          |
| `real-development-10-stage-1`    |            0/12 |            12/12 |            0/12 |            12/12 |          0/12 |           0/12 | fail → fail                          |
| `real-development-10-stage-2`    |            0/12 |            12/12 |            0/12 |            12/12 |          0/12 |           0/12 | fail → fail                          |
| `real-development-11`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-12`            |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-blocktempo-19` |            0/12 |            12/12 |            0/12 |            12/12 |          0/12 |          12/12 | fail → pass                          |
| `real-development-blocktempo-18` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-development-blocktempo-17` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `books-4-percent-ebook`          |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `macromicro-labor-15-64`         |            0/12 |            12/12 |            0/12 |            12/12 |          0/12 |          12/12 | fail → pass                          |
| `macromicro-global-labor-25-54`  |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `macromicro-us-cds-5y`           |            0/12 |             0/12 |            0/12 |             0/12 |          0/12 |           0/12 | fail → fail                          |

### Holdout

| Target ID         | Shipping labels | Candidate labels | Shipping target | Candidate target | Shipping full | Candidate full | Full case pass: shipping → candidate |
| ----------------- | --------------: | ---------------: | --------------: | ---------------: | ------------: | -------------: | ------------------------------------ |
| `real-holdout-01` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-02` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-03` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-04` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-05` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-06` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-07` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |
| `real-holdout-08` |           12/12 |            12/12 |           12/12 |            12/12 |         12/12 |          12/12 | pass → pass                          |

## Source verification and separation

| Role        | Targets | Distinct sentence contexts | Original excerpts | Canonical pages | Publishers |
| ----------- | ------: | -------------------------: | ----------------: | --------------: | ---------: |
| Development |      21 |                         19 |                18 |               9 |          8 |
| Holdout     |       8 |                          8 |                 8 |               6 |          6 |
| Combined    |      29 |                         27 |                26 |              15 |         13 |

Every source page was opened in the configured Chrome Beta profile with Pangu confirmed off before navigation. Fresh HTTP responses verified 22 of the original 27 targets. Books.com.tw and MacroMicro returned 403 responses; Navigate failed certificate verification. All three passed the required Chrome Beta fallback, including DOM text, source HTML, computed styles, and production input checks. Certificate verification was not bypassed.

The spacing audit found two unannotated eligible targets in the retained course paragraph. Both were added from its unchanged source text, with their exact UTF-16 offsets. Replay then verified all 29 inputs, rule outputs, target offsets, individual edits, combined edits, final DOM text, and the real authored-space exclusion before inference.

Canonical pages are disjoint across roles. XQ declares a canonical URL different from the requested URL; that mapping is retained. Duplicate DOM renderings remain in source evidence and count once. PTT occurs in both roles on separate pages. XQ supplies several return cases, Blocktempo supplies the article identifiers, and MacroMicro supplies age/tenor labels. These are finite-source checks, not universal accuracy estimates.

No candidate used prompt examples. Prior exposure was preserved. The two new course-stage records conservatively inherit their paragraph's exposure flags, rather than claiming separate historical measurements. All eight holdouts were evaluated in this round and are no longer never-inferred inputs for future work.

The shared [development corpus](../../corpus/development.json) retains source text, replay fixtures, inline verification summaries, and exposure history. Source captures are now temporary artifacts.

## Prompt evolution

[Frozen prompts](prompts.mjs) preserve the `v26-zh` baseline, the only tested candidate, the unchanged question builder, response schema, and diagnostic follow-ups. No prior experiment prompts, answers, scores, or conclusions were retrieved for tuning in this round.

**`real-r1-semantic`. Parent: `v26-zh`.** The baseline had 6 stable label failures across course-stage markers, an article identifier, an age-group label, and a five-year tenor. Diagnostics often recognized the positive age, tenor, or identifier while still classifying the hyphen as a negative sign. These explanations suggested a hypothesis; they did not establish an internal cause.

Hypothesis: requiring a below-zero meaning would fix the age-group and tenor cases, potentially course/article identifiers, while preserving 9 negative quantities and 6 passing separators. Appended exactly this text to the system prompt, with no intervening newline:

> 先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。

The questions, ordered labels, schema, and sampling stayed fixed. No prompt examples were used, so no example pages were excluded.

Result: labels improved from 15/21 to 19/21; complete spacing passes improved from 15/21 to 17/21. The article identifier and age-group case passed every candidate attempt in screening and both confirmation runs. The CDS tenor remained wrong. The 2 later course-stage labels improved, but their shared excerpt still failed because its first marker remained wrong.

Decision: freeze this candidate after screening, confirm it twice, then evaluate holdout without further edits. All paired gates passed, with no regression. After the separate integration comparison passed, the same prompt shipped as `v27-zh`. No wording changes followed holdout feedback.

## Runtime and execution

Chrome Beta was `154.0.8037.17`; Node was `v24.18.1`. The installed Nano component was `nano_v3_gpu_component` version `2025.8.8.1141`, with model manifest `1.20260810.11`. Exact model weights were unavailable. Availability was `available`; a fresh session reported `temperature: 0` and `topK: 1`. The recorded baseline code revision was `9e552c29e8593cd4c70ec40a1c7a16f506dd2bcb`.

Each evaluation used corpus order and the recorded seed-1 shuffle, a fresh base session per prompt/order, and a fresh clone per target/attempt. Calls ran serially. The second confirmation and holdout runs reversed prompt order. All four holdout artifacts were saved before inspection. Classification used no language declarations and the three-label string schema in `prompts.mjs`, with `omitResponseConstraintInput: false`.

There were 822 scored evaluation answers, five isolated diagnostic classifications, and 15 diagnostic follow-ups. Repeated answers are stability checks, not additional source cases. Raw answers and execution metadata were moved to ignored temporary storage.

## Shipping integration and recovery

The original installed extension pointed to another checkout. This round built and loaded the intended current checkout, verified all installed JavaScript modules against its generated files, and exercised `chrome.runtime.sendMessage` through the actual service-worker listener.

The first baseline integration completed. Candidate integration then timed out while Chrome awaited debugging consent, before sending any model request. Automatic approval review rejected the consent action; shipping was restored and the candidate extension disabled. After explicit user approval, the entire baseline/candidate integration comparison was repeated with fresh workers. The successful retry superseded the interim incomplete decision. Both the failed attempt and retry artifacts remain unchanged in temporary storage.

The successful retry made 29 fresh requests per variant and preserved all 23 baseline-passing cases plus both stable improvements. Every returned label matched the frozen evaluation behavior. Individual edits, combined edits, and final DOM text used production code. Authored whitespace remained unchanged. Each variant's separate repeated real request hit the cache and was excluded from scores.

At the end of this round, the installed current-checkout extension used `v27-zh` and the original extension was disabled. Machine-specific connection settings stay in ignored local configuration.

## Remaining failures and coverage gaps

- `real-development-10`: the first course-stage marker is still labeled `signed-number`.
- `macromicro-us-cds-5y`: the five-year tenor is still labeled `signed-number`.
- The two later course-stage targets have correct labels but fail combined excerpt spacing because the first course-stage target remains wrong.
- No confidently annotatable real `unsure` passage was found. Filenames were covered only by holdouts. Targeted searches did not produce another verified eligible development filename. No text was fabricated to fill these gaps.

## Verification and retained artifacts

Validation at `2026-09-11T10:26:28.065Z` passed the extension build, all three tsconfigs, ESLint for the changed production prompt and prompt test, whitespace checks, and an independent artifact audit. All 44 tests passed, with zero failures, across:

- `scripts/prompt-experiments/sweep.test.ts`
- `scripts/prompt-experiments/hyphen-digit/paired-gates.test.ts`
- `tests/extension/ai-spacing/shapes/hyphen-digit.test.ts`
- `tests/extension/ai-spacing/shapes/hyphen-digit-prompt.test.ts`

Final verification corrected the mock example-page test to pass `canonical_source` after fresh metadata added that mapping. The production gate code and scored artifacts were unchanged. The historical prompt-lock check passed for the frozen evidence and qualified prompt.

Local paths were removed from summary console exports; model response JSON was unchanged. Tracked report artifacts contained no profile names or extension IDs.

Source, fixture, sender, and temporary worker-inspection pages were closed. The current extension was enabled, the original extension was disabled, and automation was detached.

Current API checks used the official [Chrome extension Prompt API documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api) and [Playwright CDP documentation](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp). Local production code determined the actual sampling, language, schema, and cache behavior.

## Rerun

Run from the repository root with the setup in the [command reference](../../../README.md). The shared corpus contains all 29 original cases. This selection pins their exact order and corpus version; the later 10-year Treasury case is excluded.

```json
{
  "corpusPath": "scripts/prompt-experiments/hyphen-digit/corpus/development.json",
  "corpusBlob": "7791e6f87e12aaacb10ddb155ce6401165517a02",
  "development": [
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
    "macromicro-us-cds-5y"
  ],
  "evaluatedHoldout": ["real-holdout-01", "real-holdout-02", "real-holdout-03", "real-holdout-04", "real-holdout-05", "real-holdout-06", "real-holdout-07", "real-holdout-08"],
  "diagnostics": ["real-development-10", "real-development-10-stage-2", "real-development-blocktempo-19", "macromicro-labor-15-64", "macromicro-us-cds-5y"],
  "promptExamples": []
}
```

All 8 former holdouts are now exposed development cases. Their historical selection reproduces this round, but cannot serve as an unseen holdout for a new experiment. No example-page exclusions applied. The 5 diagnostic targets used one order, one classification each, and the 3 follow-ups frozen in `prompts.mjs`.

Prepare the selections from the recorded shared corpus blob. This preserves scientific inputs and annotations; exposure and verification metadata reflect the later shared-corpus merge.

````bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
import { DIAGNOSTIC_QUESTIONS } from './scripts/prompt-experiments/hyphen-digit/results/20260911-semantic-rule/prompts.mjs';
const report = readFileSync('scripts/prompt-experiments/hyphen-digit/results/20260911-semantic-rule/REPORT.md', 'utf8');
const selection = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)[1]);
const corpus = JSON.parse(execFileSync('git', ['cat-file', 'blob', selection.corpusBlob], { encoding: 'utf8' }));
const byId = new Map(corpus.cases.map(kase => [kase.id, kase]));
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/round1-rerun/inputs');
for (const name of ['development', 'evaluatedHoldout', 'diagnostics']) {
  const cases = selection[name].map(id => {
    assert(byId.has(id), `Recorded corpus is missing case: ${id}`);
    return byId.get(id);
  });
  writeFileSync(`${out}/${name}.json`, JSON.stringify({ ...corpus, role: 'development', diagnosticQuestions: DIAGNOSTIC_QUESTIONS, cases }, null, 2) + '\n', { flag: 'wx' });
}
JS
````

Check both corpus selections and render the frozen prompts without browser or model inference:

```bash
node scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/round1-rerun/inputs/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260911-semantic-rule/prompts.mjs --check v26-zh real-r1-semantic
node scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/round1-rerun/inputs/evaluatedHoldout.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260911-semantic-rule/prompts.mjs --check v26-zh real-r1-semantic
```

Repeat the historical screening comparison in the verified Chrome Beta session:

```bash
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/round1-rerun/inputs/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260911-semantic-rule/prompts.mjs --out tmp/prompt-experiments/round1-rerun/screening --orders 2 --repeats 1 v26-zh real-r1-semantic
```

For confirmation, run 2 fresh comparisons with `--orders 2 --repeats 3`, reversing prompt order in the second. Repeat that protocol on `evaluatedHoldout.json` for the historical holdout comparison. Use a new output directory for every invocation. For diagnostics, use `diagnostics.json`, `--orders 1 --repeats 1`, and `--diagnostics` with the comma-separated diagnostic IDs above, evaluating `v26-zh` only.

`v26-zh` means this round's frozen baseline; `shipping` means current production. New experiments need a fresh shipping baseline. Use the recorded code revision and lockfile to reconstruct the historical runtime; current shared tooling enforces ignored output directories. See [fixture replay](../../../README.md#collect-and-replay-a-new-source) and the [paired gate helper](../../../README.md#paired-gate-helper) for production input and spacing checks.

## Retention

This round keeps only `REPORT.md` and `prompts.mjs`; its cases stay in the shared corpus at the pinned version above. Original source captures, raw runs, diagnostics, gates, protocol snapshots, and one-off helpers were moved directly to `tmp/prompt-experiments/20260911-round1/`, without compression. The original report is there too. Moved helpers are historical snapshots; use shared tooling for new runs.

During this reorganization, all 29 historical cases matched the shared corpus's scientific fields. All 822 evaluation answers and 179 rendered evaluation questions were checked. Recomputed screening, confirmation, and holdout gates exactly matched the saved gates; integration retries also reproduced their recorded spacing outcomes. File hashes verified that all 52 original files arrived unchanged. No browser or model inference ran.

These records preserve the setup, prompt evolution, and conclusions without depending on temporary files. Recomputing original scores requires the raw answers; model or runtime updates can change rerun results.
