# All development cases experiment

## Current state

Complete. `question-first-cashflow` passes the original 30 development cases and all three fresh holdouts on labels, individual spacing, and combined spacing. Screening, both confirmation runs, and both holdout runs passed their paired gates. The candidate has 456/456 correct recorded attempts: 420 on the original development set and 36 on holdout. The evaluated holdouts are now exposed regression cases in the 33-case development corpus. No prompt changes followed holdout inspection.

## Goal and controls

Find a prompt that passes every development target on labels, individual spacing, and combined excerpt spacing. Production source and prompt tests stay unchanged. Code revision: `dfabc9e0d67c162ae6642bd938b42c74488d80f9`. Screening uses corpus order and seed-1 shuffle, one attempt per target per order, temperature 0, topK 1, no language declarations, and the production three-label string schema with `omitResponseConstraintInput: false`. Each order has a fresh base session; every target attempt uses a fresh clone.

Confirmation requires two fresh paired runs, each with two orders and three attempts per target per order, reversing prompt order in run 2. The candidate must pass all 30 targets in both. After confirmation, an independent context assesses the three prior private reservations or collects three fresh page-disjoint holdouts covering a negative value, a numbered identifier, and a duration/tenor. Their text and labels remain outside tuning. No `unsure` coverage is promised without verified insufficient context.

Runner/gate tests: 14 passed. Browser connection was initially refused while Chrome Beta was closed; opening the existing browser restored attachment. The configured extension loads this checkout. Chrome Beta 154.0.8037.17, Node v24.18.1, Nano component 2025.8.8.1141, model manifest 1.20260810.11. Profile verified; availability available; fresh session reports temperature 0 and topK 1. Production replay passed all 30 inputs, routing, individual/combined spacing, and authored-space exclusion. Exact weights are unavailable. Playwright CLI 0.1.18.

## Reused findings

The `20260912-tenors` round understood tenors and debit in follow-ups but failed to preserve both during constrained classification. Its sourced examples excluded two pages, so those candidates do not satisfy this round. The `20260911-semantic-rule` round improved numbers with a below-zero rule but left course-stage and tenor failures. This round preserves shipping labels and remeasures current behavior.

## Frozen selection

```json
{
  "corpusPath": "scripts/prompt-experiments/hyphen-digit/corpus/development.json",
  "corpusBlob": "810a75ae6f4c747d4ae30bda9dde3c18d66fd127",
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
    "real-holdout-08"
  ],
  "exampleSources": []
}
```

## Iterations

1. `number-role`, parent `v27-zh`. Change only the system task: classify what the number represents, distinguishing measured values/debits from ages, durations, dates, and names. Prediction: fix course stages and financial tenors without changing negative quantities. The production question and options are unchanged. Result: 21/30 labels, individual spacing, and combined spacing; no inference errors or unstable cases. Paired gate failed: article IDs and the book title regressed. Rejected.

2. `meaning-question`, parent `v27-zh`. Change only question framing: identify the target number by hyphen ordinal and ask for its meaning rather than classify a cropped CJK-minus-number fragment. Prediction: reduce surface sign bias on tenors and course stages while preserving numeric negatives. System, schema, and sampling unchanged.

`meaning-question` result: 26/30 labels, individual spacing, and combined spacing. Course stages and the treasury tenor improved. All three negative-temperature targets regressed; CDS stayed wrong. No errors or unstable cases. Paired gate failed; rejected.

Fresh shipping diagnostics translated both tenors as positive durations but still called their numbers negative when asked to explain. The course marker was also called negative. This supports investigating framing and response bias; explanations are not accuracy evidence.

3. `repeat-question`, parent `v27-zh`. Change only the builder to repeat the complete unchanged shipping question twice. Prediction: improve context use without new rules or labels. This tests [Google Research's prompt-repetition finding](https://arxiv.org/html/2512.14982v1); the paper did not evaluate Nano or this Chinese classification task.

4. `repeat-meaning`, parent `meaning-question`. Apply the same single repetition dimension to the meaning-based question. Prediction: retain stage/treasury improvements and recover temperature/CDS interpretation. Frozen before either repetition candidate runs.

Coverage: 30 targets, 28 distinct source/sentence contexts, 27 original excerpts, 15 canonical pages, and 13 publishers. All are exposed development cases. No source page is excluded.

`repeat-question`: 26/30 labels and individual spacing, 23/30 combined spacing. Treasury improved; one return label and bank debit regressed, with bank unstable across the two attempts. The return error caused both targets in its excerpt to fail combined spacing. Course and CDS stayed wrong. Paired gate failed; rejected.

`repeat-meaning`: 26/30 on all three metrics. Both tenors passed, but all course markers failed and the Electrolux temperature regressed. The other two temperature cases recovered. No errors or unstable cases. Paired gate failed; rejected. The repetition hypothesis changes behavior but does not provide a uniform gain here. Diagnose the remaining temperature/course distinction before another content change.

5. `question-first`, parent `v27-zh`. Change only input order: target question and unchanged menu, then the full source sentence, then the unchanged answer instruction. Prediction: seeing the decision before the source may improve contextual interpretation. The [prompt-repetition paper](https://arxiv.org/html/2512.14982v1) identifies context/question ordering as a performance factor.

6. `separator-menu-first`, parent `v27-zh`. Reverse only the two substantive menu entries in the user question. Their descriptions and the schema enum order remain unchanged. Prediction: test response-position bias separately from semantics. Any negative-value regression rejects it. Both candidates are frozen before inference.

`question-first`: 29/30 labels, individual spacing, and combined spacing. All five baseline full-spacing failures improved, but `macromicro-labor-15-64` regressed. No errors or unstable cases. Paired gate failed; retain as the next parent, not a qualifying result.

`separator-menu-first`: 26/30 labels and individual spacing, 23/30 combined spacing. One return label and one temperature label regressed; the return error caused both targets in its excerpt to fail combined spacing. Course and CDS stayed wrong. No errors or unstable cases. Paired gate failed; rejected.

The `repeat-meaning` follow-up run classified its temperature case correctly, unlike screening, while still calling the course stage negative. That diagnostic difference does not replace the failed scored attempt. It is a stability concern for confirmation.

The `question-first` age diagnostic translated the sentence as ages 15 to 64, quoted the target as `率-15`, and still answered negative. This does not prove a cause, but suggests testing whether the cropped target hides the age unit.

7. `question-first-unit`, parent `question-first`. Change only the target fragment: retain the first authored character after the number. This reuses the earlier `target-unit` builder idea with the new question-first parent, without examples. Prediction: exposing the age unit fixes the only remaining regression.

`question-first-unit`: 29/30 on all three metrics. Every separator passed, including the age range. Bank debit regressed, with no errors or unstable cases. Paired gate failed. The earlier tenor round already diagnosed this debit as an outflow despite its wrong initial classification; reuse that finding.

8. `question-first-cashflow`, parent `question-first-unit`. Change only the signed-number menu definition: add negative cashflow meanings (debit, expense, transfer out) alongside values below zero. Prediction: recover the bank case without changing the target, source order, or financial-duration handling.

`question-first-cashflow`: 30/30 labels, individual spacing, and combined spacing; all 60 scheduled attempts correct, no errors or unstable cases. Paired screening gate passed, preserving every baseline-passing case and improving the five baseline full-spacing failures. Freeze this candidate for confirmation. No prompt examples or page exclusions were used.

## Confirmation protocol

Run both shipping and the frozen candidate afresh twice. Each run uses corpus order and seed-1 shuffle, with 3 attempts per target per order (180 answers per prompt per run). Run 1 orders shipping then candidate; run 2 reverses them. The candidate must pass all 360 confirmation attempts plus paired gates. Screening answers will not substitute for either control. Corpus, production code, model, connection, schema, language declarations, and sampling remain unchanged; prior preflight checks are reusable.

## Screening scores

Every case must pass both orders. Combined spacing includes all eligible targets in its source excerpt. No skipped, missing, or errored scored answers occurred.

| Prompt                  | Labels | Individual spacing | Combined spacing | Paired gate |
| ----------------------- | -----: | -----------------: | ---------------: | ----------- |
| Shipping v27-zh         |  27/30 |              27/30 |            25/30 | Control     |
| number-role             |  21/30 |              21/30 |            21/30 | Fail        |
| meaning-question        |  26/30 |              26/30 |            26/30 | Fail        |
| repeat-question         |  26/30 |              26/30 |            23/30 | Fail        |
| repeat-meaning          |  26/30 |              26/30 |            26/30 | Fail        |
| question-first          |  29/30 |              29/30 |            29/30 | Fail        |
| separator-menu-first    |  26/30 |              26/30 |            23/30 | Fail        |
| question-first-unit     |  29/30 |              29/30 |            29/30 | Fail        |
| question-first-cashflow |  30/30 |              30/30 |            30/30 | Pass        |

Both confirmation runs completed and passed the shared paired gate. Each run scored shipping at 27/30 labels and individual spacing, 25/30 combined spacing; the candidate passed 30/30 on all three metrics. All 360 candidate attempts passed. Five original targets were stable full-spacing improvements in both runs: the three course-stage targets and both financial tenors. No inference errors, missing/skipped answers, instability, regressions, or declines on baseline-failing cases occurred. The second run reversed candidate/shipping order.

## Rerun

Use the verified Chrome Beta setup from the [command reference](../../../README.md). Restore the frozen 30-target selection before rerunning; later corpus additions do not change this round.

````bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
const report = readFileSync('scripts/prompt-experiments/hyphen-digit/results/20260912-all-development/REPORT.md', 'utf8');
const selection = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)[1]);
const corpus = JSON.parse(execFileSync('git', ['cat-file', 'blob', selection.corpusBlob], { encoding: 'utf8' }));
const byId = new Map(corpus.cases.map(kase => [kase.id, kase]));
const cases = selection.ids.map(id => byId.get(id));
assert.equal(cases.length, 30);
assert(cases.every(Boolean));
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/all-development-rerun/inputs');
writeFileSync(`${out}/development.json`, JSON.stringify({ ...corpus, cases }, null, 2) + '\n', { flag: 'wx' });
JS
````

The commands below use new output directories. Repeating an invocation requires another new directory. Runner tests and fixture replay can be reused only under the skill's documented conditions.

```bash
npx vitest run --exclude '**/tmp/**' scripts/prompt-experiments/sweep.test.ts scripts/prompt-experiments/hyphen-digit/paired-gates.test.ts
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases tmp/prompt-experiments/all-development-rerun/inputs/development.json
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/all-development-rerun/inputs/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260912-all-development/prompts.mjs --out tmp/prompt-experiments/all-development-rerun/screen shipping question-first-cashflow
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/all-development-rerun/inputs/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260912-all-development/prompts.mjs --orders 2 --repeats 3 --out tmp/prompt-experiments/all-development-rerun/confirm-1 shipping question-first-cashflow
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/all-development-rerun/inputs/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260912-all-development/prompts.mjs --orders 2 --repeats 3 --out tmp/prompt-experiments/all-development-rerun/confirm-2 question-first-cashflow shipping
```

For other screening candidates, substitute their frozen ID. The original diagnostic selections used one order and one attempt: shipping on `real-development-10,macromicro-us-cds-5y,macromicro-us-treasury-10y`; `repeat-meaning` on `real-development-08,real-development-10`; `question-first` on `macromicro-labor-15-64`. Pass these through `--diagnostics` with the frozen follow-up questions in `prompts.mjs` and the corpus. Their answers are interpretation evidence only.

Verify saved answers with `evaluatePaired` from [paired-gates.mjs](../../paired-gates.mjs), supplying the frozen cases, `exampleSources: []`, current production `hyphenDigit.edits({ index: kase.settled_index }, label)`, and `applyTextEdits`. Bundle the production TypeScript imports with the installed `rolldown`, as the fixture replay helper does. Screening takes one baseline/candidate comparison; confirmation takes both fresh comparisons. Check the saved system, rendered questions, schema, sampling, profile verification, and attempt orders against the frozen module before evaluating. A CLI label score alone does not verify combined spacing or a paired gate.

## Verification

An independent audit recomputed all eight screening gates from raw answers with the shared evaluator and production edits. Every result exactly matched its saved gate. It also verified all 30 selected IDs, source counts, diagnostic questions, rendered prompt bytes, and unchanged schema. Formatting preserved every tested prompt and question. Production source, prompt tests, dependencies, runner, and gate helpers are unchanged.

Checks used runner blob `2ffa9cfd0f2b1dff778653c06d8234c9a0c675a7`, gate blob `fefc16ac32f0056bf4d378d65b45c006c1c97052`, replay blob `7aa6482c2b3fd472925cf549d1b86bcfb962766e`, and lockfile blob `727c6b556a4e05b5b33996eddf38f5c61a462b20`.

## Accepted prompt

The accepted candidate keeps the shipping system prompt, labels, schema, and sampling. Its builder places the target question and menu before the full source sentence, retains the next authored character in the quoted target, and adds debit/expense/transfer-out meanings to the signed-number menu. [Frozen definitions](prompts.mjs) preserve every iteration and the exact builder. It uses no prompt examples, corpus IDs, expected labels, or case-specific routing.

The measured scope is the frozen set of 30 exposed development targets from 15 pages and 13 publishers. Repeated attempts check stability on these inputs; they do not establish universal accuracy. No verified real `unsure` case is covered. Applying this prompt to production and testing its extension integration remain separate work.

## Development phase results

| Phase                                 | Attempts per target per prompt | Shipping labels / individual spacing | Shipping combined spacing | Candidate labels / individual / combined spacing | Paired gate |
| ------------------------------------- | -----------------------------: | -----------------------------------: | ------------------------: | -----------------------------------------------: | ----------- |
| Screening                             |                              2 |                                27/30 |                     25/30 |                                            30/30 | Pass        |
| Confirmation 1                        |                              6 |                                27/30 |                     25/30 |                                            30/30 | Pass        |
| Confirmation 2, reversed prompt order |                              6 |                                27/30 |                     25/30 |                                            30/30 | Pass        |

The five stable full-spacing improvements are `real-development-10`, `real-development-10-stage-1`, `real-development-10-stage-2`, `macromicro-us-cds-5y`, and `macromicro-us-treasury-10y`. The first course target fixes its whole original excerpt, which is why two already-correct stage labels also gain full-spacing passes.

## Initial holdout attempt

The first holdout source preflight was incomplete; inference was not run in that attempt. A separate context looked for the three previously reserved records, but their files were absent from the current checkout and narrow temporary-path search. It then attempted fresh source collection for the declared negative-value, identifier, and duration coverage. Public-page capture encountered a connection reset and DOMContentLoaded timeouts. A subsequent navigation diagnostic stalled; it did not establish a general network outage. No new verified holdout corpus was produced and no holdout answers guided tuning. This is an infrastructure limitation, not a measured holdout failure. The 30-case development selection and its completed comparisons remain unchanged.

## Development completion

The requested 30-case development goal is complete. Runner/gate tests passed 14/14, production fixture replay passed 30/30, all eight screening gates were independently recomputed, and both fresh confirmation gates passed. The documented Git-blob restore command reproduced the exact original corpus; all frozen prompts passed offline rendering checks. Prettier and whitespace checks passed. At the end of development confirmation, only this round’s `REPORT.md` and `prompts.mjs` had been added; the original corpus and production files were unchanged. The successful holdout retry below later adds three evaluated regression cases.

Raw scored answers, diagnostics, gate outputs, verification records, and holdout collection failures remain in ignored local storage. Pangu was restored and verified enabled, with the intended profile, worker, model availability, and actual sampling confirmed. Temporary inspection pages were closed and `pangu-eval` detached. The extension worker restarted during source collection cleanup; any future comparison needs a fresh baseline.

## Holdout retry

The user requested the pending holdout evaluation and approved Chrome Beta’s remote-debugging dialog. The runner reconnected to Chrome Beta 154.0.8037.17. Opening the extensions page woke the suspended worker; the installation was present. The candidate remains frozen. The separate collection context now bounds DOMContentLoaded waits, stops unfinished loads before inspecting the resulting DOM, and retains stdout as well as stderr when recording CLI errors. Source verification, replay, and both fresh paired comparisons remain required before a holdout result can be claimed.

Suggested follow-up for the [setup instructions](../../../../../.agents/skills/prompt-experiments/references/setup.md): wrappers around Playwright CLI should retain stdout, stderr, and exit status. Two diagnostic wrappers captured only stderr, which contained an update banner while the actual error was on stdout. This suggestion does not change the experiment runner or prompt protocol.

The retry loaded three alternate public pages successfully. A private source guard rejected the extensions page after its URL gained a query string; inspection confirmed Pangu was still disabled. The guard was corrected before continuing. All three source contexts were verified, including a visible identifier reached by opening a public accordion. Annotations and production replay precede inference.

The retry freshly verified Chrome Beta 154.0.8037.17, model component 2025.8.8.1141, manifest 1.20260810.11, the intended profile, and actual temperature 0/topK 1. Production replay passed all 33 targets across the original development corpus and the three frozen holdouts, including complete annotations, page separation, individual/combined spacing, and authored-space exclusion. Pangu and the model worker were restored before inference. Both fresh paired runs are executed with private stdout; all four raw artifacts must be saved before inspecting answers.

## Holdout results

The retry completed both fresh paired comparisons before inspecting any answers. Each comparison used two orders and three attempts per target per order. Run 1 used shipping then candidate; run 2 reversed them. Both prompts passed all three targets in both runs: 36/36 labels, 36/36 individual-spacing checks, and 36/36 combined-spacing checks per prompt. No inference errors, missing/skipped answers, instability, regressions, or attempt declines occurred. Both holdout gates passed. A new improvement is not required for holdout; shipping also passed this selection.

| Holdout case                        | Verified meaning             | Source                                                                    | Candidate attempts |
| ----------------------------------- | ---------------------------- | ------------------------------------------------------------------------- | -----------------: |
| `jinbao-frozen-egg-white-minus-18`  | Negative freezer temperature | [金寶蛋品](https://www.jinbaoegg.com.tw/product.html)                     |              12/12 |
| `ncku-advanced-course-file-1`       | Numbered course attachment   | [國立成功大學](https://atp.ee.ncku.edu.tw/classview_76.html)              |              12/12 |
| `ptt-delivery-duration-3-to-5-days` | Positive duration range      | [批踢踢實業坊](https://www.ptt.cc/bbs/e-shopping/M.1624553591.A.2F0.html) |              12/12 |

Holdout coverage is three targets, three source/sentence contexts, three original excerpts, three canonical pages, and three publishers. All pages are disjoint from the original development pages. PTT is a shared publisher on a different page. Combined coverage is 33 targets, 31 source/sentence contexts, 30 original excerpts, 18 canonical pages, and 15 publisher hostnames. The duration case covers a day range, not another financial tenor. No real `unsure` case is covered.

The parent independently recomputed the holdout gate with the shared evaluator and current production edits; it exactly matched the separate agent’s saved gate. Merge verification preserved all 30 original records and original top-level metadata. The three new records preserve the evaluated source text, fixtures, inputs, target offsets, gold labels, and expected spacing. Their routing notes now record the successful replay, and exposure notes mark them as evaluated development cases. They are no longer unseen holdouts.

The frozen prompt, production source, prompt tests, runner, gate helper, and dependencies remain unchanged. All raw answers, source captures, replay results, paired gates, and verification records remain in ignored local storage.

## Retained holdout selection

These evaluated cases now live in the shared development corpus. Its updated blob is uncommitted and becomes retrievable from Git after commit; the current file can reproduce this selection now.

```json
{
  "role": "holdout",
  "corpusPath": "scripts/prompt-experiments/hyphen-digit/corpus/development.json",
  "corpusBlob": "b0b2532415f8bfa1f346d6a0f3352b060f84186a",
  "ids": ["jinbao-frozen-egg-white-minus-18", "ncku-advanced-course-file-1", "ptt-delivery-duration-3-to-5-days"]
}
```

To reproduce the evaluated selection, use the current file when its hash matches or restore its recorded Git blob after commit. This is a historical rerun, not new unseen coverage.

````bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
const report = readFileSync('scripts/prompt-experiments/hyphen-digit/results/20260912-all-development/REPORT.md', 'utf8');
const selection = [...report.matchAll(/```json\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1])).find(value => value.role === 'holdout');
const hash = execFileSync('git', ['hash-object', selection.corpusPath], { encoding: 'utf8' }).trim();
const corpus = JSON.parse(hash === selection.corpusBlob ? readFileSync(selection.corpusPath, 'utf8') : execFileSync('git', ['cat-file', 'blob', selection.corpusBlob], { encoding: 'utf8' }));
const cases = selection.ids.map(id => corpus.cases.find(kase => kase.id === id));
assert.equal(cases.length, 3);
assert(cases.every(Boolean));
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/all-development-holdout-rerun/inputs');
writeFileSync(`${out}/holdout.json`, JSON.stringify({ ...corpus, role: 'holdout', cases }, null, 2) + '\n', { flag: 'wx' });
JS
````

Use the same sweep command and frozen prompt module shown above, with `--cases tmp/prompt-experiments/all-development-holdout-rerun/inputs/holdout.json --orders 2 --repeats 3`. Run shipping/candidate, then candidate/shipping, using separate new output directories. Save all four result files before inspecting answers. Evaluate both comparisons with `phase: 'holdout'` in the shared paired gate helper. Each prompt has 12 scheduled attempts per target across the two runs.

## Final completion

All requested evaluation phases are complete. The expanded development corpus has 33 verified regression targets; every target passed every scheduled candidate attempt in its phase. Production code and the frozen candidate were not changed during holdout evaluation. The original 30 records and top-level corpus metadata are preserved; the corpus diff adds only the three evaluated records and their exposure history. Pangu was restored and verified enabled with its worker and model available. Temporary inspection pages are closed and the runner is disconnected.
