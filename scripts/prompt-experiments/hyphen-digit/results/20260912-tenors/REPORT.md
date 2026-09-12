# Tenor classification experiment

No candidate made both requested cases pass without a control regression. Nine variants were screened against shipping `v27-zh`; none advanced to confirmation or changed production.

| Requested input       | Shipping, each 2/2 | `cds-maturity`, each 2/2 | Expected spacing           |
| --------------------- | ------------------ | ------------------------ | -------------------------- |
| 美國-5年信用違約交換  | `signed-number`    | `range-or-separator`     | `美國 - 5 年信用違約交換`  |
| 美國-10年期公債殖利率 | `signed-number`    | `range-or-separator`     | `美國 - 10 年期公債殖利率` |

`cds-maturity` fixed both, but changed `銀行-600元  悠游付 +100元  NFC-SIM +500元` from the correct `signed-number` to `range-or-separator` in both attempts. Its 19/20 score does not justify promotion.

## Prompt evolution

[Frozen prompt builders](prompts.mjs) preserve shipping and all nine candidates. The module includes each exact system prompt, question builder, and response schema. The entries below explain why each version changed. Follow-up answers informed the hypotheses below; they are interpretation evidence, not accuracy results or proof of an internal cause.

1. **`tenor-meaning`. Parent: shipping.** Initial diagnostics translated both tenors correctly while classifying their hyphens as negative. Hypothesis: explicitly distinguish duration from yield. Appended: `判斷的是緊接「-」的數字，不是句尾的指標值；年期表示合約或債券的存續期間，不是殖利率或報酬率，期間前的「-」選 range-or-separator。` Neither requested case passed every attempt; rejected.
2. **`target-ordinal`. Parent: shipping.** The initial diagnostics also motivated testing whether the cropped target fragment encouraged sign classification. Replaced only the fragment-based question with `句子中從左到右第 N 個「-」是哪一種符號？`. Both tenors still failed, and a numbered article title regressed; rejected.
3. **`english-instructions`. Parent: shipping.** Correct English translations suggested trying English instructions, question, and answer menu while retaining Chinese source text. Both tenors passed, but all nine negative-value controls failed; rejected. This suggested a label bias; it did not establish reliable semantic improvement.
4. **`sourced-examples`. Parent: shipping.** Instruction changes had not preserved both meanings. Hypothesis: one verified negative-temperature example and one numbered-product example would demonstrate the distinction. Appended their full questions and answers to the Chinese system prompt. Both entire example pages left scoring. The 10-year tenor and course-stage cases improved; the CDS case remained wrong. Paired gate passed, task requirement failed.
5. **`target-unit`. Parent: `sourced-examples`.** A CDS follow-up recognized `5年` as a positive duration. Hypothesis: retain the first authored character after the number in the quoted target, changing `國-5` to `國-5年`. Results remained 19/20 with CDS wrong; no observed benefit.
6. **`english-sourced-examples`. Parent: `english-instructions`.** English instructions fixed the tenors but lost negative controls. Appended the same two examples using English questions to test whether examples corrected that bias. Both tenors passed, but financial negative-value controls still regressed; rejected.
7. **`cds-maturity`. Parent: `sourced-examples`.** The Chinese example variant preserved controls while its CDS follow-up recognized maturity. Appended: `信用違約交換的年數是合約期限，國家名稱與年數之間的「-」選 range-or-separator。` Both tenors passed, but the bank-debit control regressed; rejected.
8. **`cds-before-examples`. Parent: `cds-maturity`.** The bank follow-up correctly identified a debit despite its initial wrong answer. Hypothesis: the terminal CDS instruction biased classification. Moved that unchanged instruction before the examples. CDS failed again and financial controls regressed; rejected.
9. **`maturity-and-cashflow`. Parent: `cds-maturity`.** Hypothesis: explicitly distinguish an outflow from financial-name separators. Appended: `銀行金額若與其他帳戶的正向入帳並列，「-」表示轉出或扣款，選 signed-number。` The bank case recovered, but both requested tenors failed. Paired gate passed, task requirement failed; screening stopped.

## Results and confidence

Scores count cases correct on every scheduled attempt. Individual spacing totals equal label totals here; combined spacing applies all eligible targets in the original excerpt. A paired-gate pass must also accompany both requested cases passing.

| Prompt                           | Labels / individual spacing | Combined spacing | Both tenors | Paired gate |
| -------------------------------- | --------------------------- | ---------------- | ----------- | ----------- |
| Shipping, initial corpus         | 19/22                       | 17/22            | Fail        | Baseline    |
| `tenor-meaning`                  | 18/22                       | 17/22            | Fail        | Fail        |
| `target-ordinal`                 | 19/22                       | 19/22            | Fail        | Fail        |
| `english-instructions`           | 13/22                       | 13/22            | Pass        | Fail        |
| Shipping, example pages excluded | 17/20                       | 15/20            | Fail        | Baseline    |
| `sourced-examples`               | 19/20                       | 19/20            | Fail        | Pass        |
| `target-unit`                    | 19/20                       | 19/20            | Fail        | Pass        |
| `english-sourced-examples`       | 18/20                       | 17/20            | Pass        | Fail        |
| `cds-maturity`                   | 19/20                       | 19/20            | Pass        | Fail        |
| `cds-before-examples`            | 17/20                       | 16/20            | Fail        | Fail        |
| `maturity-and-cashflow`          | 18/20                       | 18/20            | Fail        | Pass        |

These are screening results, not confirmation. Preflight passed the extension build, 13 runner/gate tests, 22 development fixture replays, and three fresh-holdout fixture replays. Two startup attempts failed before inference because Pangu remained disabled and its service worker was unavailable. Completed comparisons had no inference errors. Confirmation and holdout inference were not run.

## Reuse and applicability

The shared [development corpus](../../corpus/development.json) retains this round’s 22 historical regression targets with exact text, annotations, expected labels and spacing, provenance, and exposure records. Original coverage was 20 sentences, 19 excerpts, nine pages, and eight publishers. Scoring after excluding the Electrolux and ChienChing example pages used 20 targets, 18 sentences, 17 excerpts, seven pages, and six publishers. Use all 22 for historical regression when those pages are not prompt examples; exclude the complete example pages when testing candidates that use them. Measure a fresh shipping baseline alongside new candidates.

Both requested terms were verified on the same MacroMicro database page. No real `unsure` case is covered. All public cases are exposed development material. Three verified active holdout targets from three pages and publishers remain private and are excluded from this corpus. Repeated answers do not add independent source coverage. An initial memory search exposed older summaries; this round did not import old candidate modules or raw answers for tuning.

The recorded code revision is `d99b75fac9f7a8576b5c6bee368ab0e5dae4d9cc`. Runtime: Chrome Beta `154.0.8037.17`, Node `v24.18.1`, Gemini Nano component `nano_v3_gpu_component` version `2025.8.8.1141`, manifest `1.20260810.11`; exact weights were unavailable. Screening used fresh sessions, temperature `0`, topK `1`, two orders (seeds 0 and 1), one attempt per order, and the production three-label string schema (`omitResponseConstraintInput: false`, no language declarations). Diagnostics used one order and were excluded from accuracy claims.

The unresolved problem is preserving the maturity/debit distinction during initial constrained classification. Follow-up explanations do not establish that reliability. Another wording or ordering tweak needs a distinct hypothesis and fresh evidence; broader source coverage and an `unsure` case remain missing.

## Rerun

Run from the repository root with the dependency and Chrome Beta setup in the [command reference](../../../README.md). This selection preserves the original order. Initial baseline and the first 3 candidates used all 22 IDs; later comparisons excluded both entire prompt-example pages, leaving 20.

```json
{
  "corpusPath": "scripts/prompt-experiments/hyphen-digit/corpus/development.json",
  "corpusBlob": "7791e6f87e12aaacb10ddb155ce6401165517a02",
  "original": [
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
    "macromicro-us-treasury-10y"
  ],
  "promptExamples": ["real-development-08", "real-development-11"]
}
```

The blob ID identifies the merged shared corpus, independently of the original code revision above. The merge is currently uncommitted. Until committed, use the current corpus only when its hash matches; after committing, Git can restore that exact blob even if the corpus changes.

Prepare both selections below. The command reads only the recorded corpus version, preserves case order, and excludes whole example pages. It writes disposable inputs to a fresh ignored directory.

````bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/public-artifacts.mjs';
const report = readFileSync('scripts/prompt-experiments/hyphen-digit/results/20260912-tenors/REPORT.md', 'utf8');
const selection = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)[1]);
const currentBlob = execFileSync('git', ['hash-object', selection.corpusPath], { encoding: 'utf8' }).trim();
const corpus = JSON.parse(currentBlob === selection.corpusBlob
  ? readFileSync(selection.corpusPath, 'utf8')
  : execFileSync('git', ['cat-file', 'blob', selection.corpusBlob], { encoding: 'utf8' }));
const byId = new Map(corpus.cases.map(kase => [kase.id, kase]));
const original = selection.original.map(id => {
  assert(byId.has(id), `Recorded corpus is missing case: ${id}`);
  return byId.get(id);
});
const examplePages = new Set(selection.promptExamples.map(id => (byId.get(id).canonical_source ?? byId.get(id).source)));
const examplesExcluded = original.filter(kase => !examplePages.has(kase.canonical_source ?? kase.source));
assert.equal(original.length, 22);
assert.equal(examplesExcluded.length, 20);
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/tenors-shared-rerun/inputs');
for (const [name, cases] of Object.entries({ original, examplesExcluded })) {
  writeFileSync(`${out}/${name}.json`, JSON.stringify({ ...corpus, cases }, null, 2) + '\n', { flag: 'wx' });
}
JS
````

Check corpus structure and render all frozen prompts without a browser or model inference:

```bash
node scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/tenors-shared-rerun/inputs/original.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260912-tenors/prompts.mjs --check shipping v27-zh tenor-meaning target-ordinal english-instructions sourced-examples target-unit english-sourced-examples cds-maturity cds-before-examples maturity-and-cashflow
```

`shipping` means current production; `v27-zh` is the frozen historical baseline. Use the recorded code revision and its lockfile when reproducing the original setup. Browser or model updates can change answers even with the same prompts and settings.

Then compare current shipping with the candidate that fixed both tenors. This command runs model inference in the verified Chrome Beta session:

```bash
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases tmp/prompt-experiments/tenors-shared-rerun/inputs/examplesExcluded.json --prompts scripts/prompt-experiments/hyphen-digit/results/20260912-tenors/prompts.mjs --out tmp/prompt-experiments/tenors-shared-rerun/screening --orders 2 --repeats 1 shipping cds-maturity
```

Choose a new output directory for another invocation. Substitute `v27-zh` for `shipping` to compare the frozen historical baseline, or another candidate ID to repeat its comparison. New prompt examples require excluding their entire source pages too. Use the shared [fixture replay](../../../README.md#collect-and-replay-a-new-source) and [paired gate helper](../../../README.md#paired-gate-helper) to check production inputs and spacing before drawing conclusions.

## Retention

This round keeps only this report and `prompts.mjs`. Source provenance and replay fixtures stay in the shared development corpus. The selection and corpus blob ID above preserve this round’s inputs without a duplicate corpus file. Raw answers, diagnostics, intermediate snapshots, and verification output are disposable local files under `tmp/prompt-experiments/`.

Before this retention change, all 993 initial answers were checked and all 9 paired gates were reproduced. Individual and combined spacing were recomputed for all 24 completed accuracy runs; the 3 diagnostics stayed outside accuracy scoring. Two startup error fields had been sanitized after writing, with no model answers changed. No new model inference ran during this reorganization.

These files preserve the experimental setup and conclusions. Recomputing the original scores requires the original answers; rerunning the setup may produce different results.
