# Digit-plus label meaning, 2026-09-11

Keep `v1-zh` as the historical baseline. Every measured prompt failed development, so none qualified for holdout evaluation or promotion.

The goal was to classify `+` as a conjunction, a numeric lower bound, or another meaning. All 5 requested examples passed with v1, v2, and v3:

| Input                           | Expected label |
| ------------------------------- | -------------- |
| `Switch 2+瑪利歐賽車世界同捆組` | `conjunction`  |
| `有100+的選擇`                  | `lower-bound`  |
| `這裡有18+的內容`               | `lower-bound`  |
| `評分3.5+的餐廳`                | `lower-bound`  |
| `Python 3+的版本`               | `lower-bound`  |

These are historical classification experiments with user examples and synthetic sentences. Even the product-name phase used authored sentences around real names. They do not satisfy the current verified-source or production-spacing gates.

## Prompt evolution

[The frozen module](prompts.mjs) contains the exact systems, question builders, response schemas, label mappings, and diagnostic questions. The parent relationships below describe the prompt changes. Hypotheses reconstructed from those changes are identified as interpretations, since the original reports did not record a complete tuning diary.

### `v1-zh`. Parent: no earlier baseline retained.

- Finding: the requested examples mix bundles, quantities, ages, ratings, and versions.
- Hypothesis: sentence meaning and an explicit target pointer can distinguish conjunctions from numeric thresholds. This is inferred from the prompt.
- Exact change: introduce the original Chinese system, occurrence number, left/right context, and `conjunction`, `lower-bound`, `unsure` menu in `PROMPTS['v1-zh']`.
- Result: 12/16 targets, including 5/5 required examples. Two confirmation runs each returned 12/16 across 6 answers per target.
- Decision: retain as the comparison baseline. The 4 stable failures kept the development gate closed.

### `v2-zh`. Parent: `v1-zh`.

- Finding: a number can identify an item or express a threshold; one sentence can contain both uses of `+`.
- Hypothesis: explicitly defining the plus sign's scope will prevent classification from the adjacent number alone. This is inferred from the instruction change.
- Exact change: replace `這個「+」在原句中是什麼意思？` with `判斷「+」的作用範圍：若連接左側整個項目與右側另一項目，選 conjunction；若只修飾左側數值，表示下限，選 lower-bound。左側以數字結尾不能單獨決定答案；同一句中的其他「+」也可能有不同意思。` Keep the system, context fields, menu, and schema.
- Result: 11/16, including 5/5 required examples. The same 4 failures remained; `software-bundle-1` also changed labels between orders.
- Decision: reject. The longer instruction added a regression without fixing the original failures.

Separate diagnostics reproduced all 3 probed failures for both prompts. For the mixed Switch sentence, both identified the requested plus but explained the later `100+`. For the repeated Python sentence, both mixed the occurrences. For the named `X2+`, both invented an upgraded-version meaning. These replies suggest target-context confusion and an overly broad reading of numeric suffixes; they do not establish the model's internal reasoning.

### `v3-zh-single`. Parent: `v1-zh`.

- Finding: diagnostics suggested confusion between multiple occurrences. The user requested dropping the 2 multiple-plus sentences and their 4 targets.
- Hypothesis: one plus per input may make the occurrence number and left/right context unnecessary.
- Exact change: keep the v1 system and menu; replace the question with the full sentence, `判斷原句中的加號是什麼意思。`, the menu, and the answer instruction. Remove the occurrence number and both context fields.
- Result: on the same 12-target selection, v1 scored 10/12 and v3 scored 9/12. V3 introduced a stable `lower-bound` error on the software bundle.
- Decision: reject v3. Retain v1's prompt and the single-plus input contract. Neither passed development, so no confirmation or holdout evaluation followed.

The input restriction was experimental. Production context extraction did not guarantee one plus per sentence; routing would need to enforce that contract before using these results.

### Explicit quantity. Parent: `v1-zh`, unchanged prompt.

- Finding: `商品2+` lacked enough context and was labeled `unsure`.
- Hypothesis: the user's replacement, `商品數量2+`, explicitly makes the number a quantity.
- Exact change: replace case `bare-1` with `quantity-minimum-1`, changing the expected label to `lower-bound` and expected spacing to `商品數量 2+`. No prompt change.
- Result: v1 scored 11/12 over 6 answers per target. The replacement passed all 6 attempts; only `named-1` still failed.
- Decision: keep the corpus revision. This improvement came from a different case, not a better prompt. The development gate stayed closed.

### `v4-zh-merged`. Parent: `v1-zh`.

- Finding: v1 treated the fictional `X2+` name as a numeric threshold. On 3 synthetic sentences with real product names, v1 got 0/3 semantic labels correct.
- Hypothesis: explicitly defining product names and grouping meanings with the same attachment behavior may fix name suffixes. This is inferred from the new definitions and comparison design.
- Exact change: use `productSystem` from the frozen module; retain the v1 target pointer and question. Replace `lower-bound` and `unsure` with `lower-bound-or-product-name`, combining the original lower-bound definition with `加號是產品或服務正式名稱的一部分，表示某個型號或方案，不表示數值下限`. Use a 2-label schema and map both canonical meanings to the merged label.
- Result: 13/14, including 3/3 product names but only 4/5 required examples. The original Switch bundle became `lower-bound-or-product-name` in both orders.
- Decision: reject. Correct merged labels do not establish that the model distinguishes thresholds from product names.

### `v5-zh-separate`. Parent: `v4-zh-merged` comparison design.

- Finding: v4's grouping hides whether the model understands which attached meaning applies.
- Hypothesis: separate labels can reveal that distinction while preserving the same definitions.
- Exact change: keep v4's system, target pointer, and question. Split its merged option into `lower-bound` and `product-name`, preserving their definition text. Use the 3-label schema with no `unsure` option.
- Result: 13/14, including 3/3 product names and 4/5 required examples. The Switch bundle became `product-name` in both orders.
- Decision: reject. Diagnostics for v4 and v5 both reproduced the bundle failure and described the plus as part of a product name. No confirmation or holdout inference followed.

V4 and v5 were measured together. Their ordering above explains the controlled menu/schema difference; it does not claim v5 was tuned after observing v4's score.

### `v18-en-real-examples`. Parent and measurements unavailable in retained evidence.

The later registry contained this English prompt with examples from Taiwanese websites. Its exact system and question builder are preserved in `PROMPTS['v18-en-real-examples']`. The retained run files contain no v18 measurements or v6–v17 iterations. Do not infer their results or reconstruct their tuning history from the version number.

Its 3 embedded example sentences are prompt-exposed material. Any future source-based evaluation must identify and exclude their source pages before scoring. This historical round has no such verified page exclusion record.

## Saved results

A target passes only when every answer is correct. Screens used 1 answer in each of 2 orders. Confirmation and explicit-quantity runs used 3 answers per order.

| Phase              | Prompt | Labels | Required | Unstable targets | Answers |
| ------------------ | ------ | ------ | -------- | ---------------- | ------- |
| Original screen    | v1     | 12/16  | 5/5      | 0                | 32      |
| Original screen    | v2     | 11/16  | 5/5      | 1                | 32      |
| Confirmation 1     | v1     | 12/16  | 5/5      | 0                | 96      |
| Confirmation 2     | v1     | 12/16  | 5/5      | 0                | 96      |
| Single-plus screen | v1     | 10/12  | 5/5      | 0                | 24      |
| Single-plus screen | v3     | 9/12   | 5/5      | 0                | 24      |
| Explicit quantity  | v1     | 11/12  | 5/5      | 0                | 72      |
| Product names      | v1     | 11/14  | 5/5      | 0                | 28      |
| Product names      | v4     | 13/14  | 4/5      | 0                | 28      |
| Product names      | v5     | 13/14  | 4/5      | 0                | 28      |

The 10 accuracy runs contain 460 answers. Four diagnostic runs contain 8 initial answers and 16 follow-up replies. All completed without inference errors. The only order instability was v2's `software-bundle-1`.

The original 4 stable failures were:

| Target                                                              | Expected    | V1 and v2 answer |
| ------------------------------------------------------------------- | ----------- | ---------------- |
| First plus in `Switch 2+遊戲同捆組，另有100+的配件可選`             | conjunction | lower-bound      |
| Second plus in `支援Python 3+的版本，套組包含Python 3+教材兩項商品` | conjunction | lower-bound      |
| `商品2+`                                                            | unsure      | conjunction      |
| `這款產品正式命名為「X2+」`                                         | unsure      | lower-bound      |

V2 returned `lower-bound`, then `conjunction`, for `套組包含繪圖軟體3.5+教學課程兩項商品`. V3 returned `lower-bound` in both orders; v1 returned `conjunction`.

For product names, v1 returned `lower-bound` for Galaxy S24+ and `conjunction` for Synology DS224+ and Roborock S7+. V4 and v5 classified all 3 as their product-name label in both orders.

The product-name comparison also counted implied attachment choices: v1 12/14, v4 13/14, v5 13/14. These were not executed formatter checks. Individual spacing, combined spacing, and modern paired source gates were not measured.

## Runtime and evidence limits

- Runs occurred on 2026-09-11 in Asia/Taipei; saved UTC timestamps span `2026-09-10T18:19:39.029Z` through `2026-09-10T19:14:32.812Z`.
- Chrome Beta `154.0.8037.17`, Gemini Nano through the Prompt API in the extension service worker. Saved flags confirm profile and worker verification and model availability. Exact model component, weights, Node version, and runtime code revision were not recorded.
- Each order used a fresh base session and each attempt a fresh clone. Sampling was temperature 0, topK 1, with no initial turns and `omitResponseConstraintInput: false`.
- Response constraints were string enums. Answer tokens mapped label names to themselves; no answer key was used. The frozen module retains all 3 schemas and the exact product-name expectation mappings.
- Orders were corpus order and the seeded shuffle with seeds 0 and 1. Diagnostics used one order, one answer, and the follow-ups exported in `DIAGNOSTIC_QUESTIONS`.
- Commit `4739c7cd5b03c218f752d212c618cd8eb94d79bc` first stored the original screen, diagnostics, and confirmation. Commit `8eed40f6` first stored the remaining phases. These are artifact snapshots, not verified runtime revisions.
- Historical `--require-perfect` checks failed. Reserved holdouts were not evaluated and must remain outside prompt tuning. Source identity, independence, and production spacing gates cannot be reconstructed from these synthetic sentences.

During compaction, all 150 rendered questions, 14 system prompts, response schemas, expected-label mappings, 468 initial answers, and 16 follow-up questions were checked against the original files. Saved label totals and stability flags matched recomputation. Original files were moved directly to ignored temporary storage without compression; rerunning the setup does not require them.

A future experiment can reuse these findings and seek verified source cases for the same failures. Target-clause isolation and the distinction between bundles and product names remain ideas to test against a fresh baseline. The synthetic records below are for historical reproduction only.

## Corpus and rerun

The shared [historical corpus](../../corpus/historical.json) contains 20 distinct targets, retaining exact input, offsets, canonical meanings, and expected output. The 4 phase selections below preserve each original order. `bare-1` and its replacement `quantity-minimum-1` remain distinct cases. Product names use the canonical `product-name` meaning; each frozen prompt maps that meaning into its own label set.

The separate [development corpus](../../corpus/development.json) keeps 7 later real-source cases, 3 training examples, and 4 unresolved review records. Only its `cases` array is scored. Training records identify the v18 example pages; none overlaps the current development pages. Review records remain unscored. Their source notes predate the current replay requirements, and no retained result measures this real corpus or v18. The 6 reserved holdouts moved to ignored storage without evaluation; their earlier tracked text means they cannot be assumed unseen.

```json
{
  "corpora": {
    "historical": {
      "path": "scripts/prompt-experiments/digit-plus/corpus/historical.json",
      "blob": "9a928b5dfa24bf6e9e1cf7c001c1a94120cd4011"
    },
    "development": {
      "path": "scripts/prompt-experiments/digit-plus/corpus/development.json",
      "blob": "64928dddda9fedfa6d558c152049befe0336ffe1"
    }
  },
  "selections": {
    "original": [
      "switch-bundle-1",
      "quantity-1",
      "age-1",
      "rating-1",
      "version-1",
      "switch-version-1",
      "python-bundle-1",
      "camera-bundle-1",
      "game-bundle-1",
      "software-bundle-1",
      "mixed-1",
      "mixed-2",
      "repeated-1",
      "repeated-2",
      "bare-1",
      "named-1"
    ],
    "single": ["switch-bundle-1", "quantity-1", "age-1", "rating-1", "version-1", "switch-version-1", "python-bundle-1", "camera-bundle-1", "game-bundle-1", "software-bundle-1", "bare-1", "named-1"],
    "quantity": [
      "switch-bundle-1",
      "quantity-1",
      "age-1",
      "rating-1",
      "version-1",
      "switch-version-1",
      "python-bundle-1",
      "camera-bundle-1",
      "game-bundle-1",
      "software-bundle-1",
      "quantity-minimum-1",
      "named-1"
    ],
    "products": [
      "switch-bundle-1",
      "quantity-1",
      "age-1",
      "rating-1",
      "version-1",
      "switch-version-1",
      "python-bundle-1",
      "camera-bundle-1",
      "game-bundle-1",
      "software-bundle-1",
      "quantity-minimum-1",
      "galaxy-s24-1",
      "synology-ds224-1",
      "roborock-s7-1"
    ],
    "diagnostics": ["mixed-1", "repeated-2", "named-1"],
    "productDiagnostics": ["switch-bundle-1"]
  },
  "realDevelopment": ["tw-conj-diablo-1", "tw-lb-02-1", "tw-lb-04-1", "tw-lb-06-1", "tw-lb-07-1", "tw-lb-08-1", "tw-lb-10-1"]
}
```

The new corpus blobs become retrievable from Git after this migration is committed. Until then, the preparation command uses the current file only when its hash matches the recorded blob. No example pages were used by the measured v1–v5 prompts. V18's source examples belong only to the later real corpus and must stay outside scoring.

Prepare all historical selections and the later real development snapshot in a new ignored directory:

````bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outputDirectory } from './scripts/prompt-experiments/artifacts.mjs';
import { DIAGNOSTIC_QUESTIONS } from './scripts/prompt-experiments/digit-plus/results/20260911-label-meaning/prompts.mjs';
const report = readFileSync('scripts/prompt-experiments/digit-plus/results/20260911-label-meaning/REPORT.md', 'utf8');
const record = JSON.parse(report.match(/```json\n([\s\S]*?)\n```/)[1]);
const corpora = Object.fromEntries(Object.entries(record.corpora).map(([name, { path, blob }]) => {
  const current = execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
  return [name, JSON.parse(current === blob ? readFileSync(path, 'utf8') : execFileSync('git', ['cat-file', 'blob', blob], { encoding: 'utf8' }))];
}));
const out = outputDirectory(process.cwd(), 'tmp/prompt-experiments/digit-plus-rerun/inputs');
for (const [name, ids] of Object.entries({ ...record.selections, realDevelopment: record.realDevelopment })) {
  const corpus = corpora[name === 'realDevelopment' ? 'development' : 'historical'];
  const byId = new Map(corpus.cases.map(kase => [kase.id, kase]));
  const cases = ids.map(id => {
    assert(byId.has(id), `Recorded corpus is missing case: ${id}`);
    return byId.get(id);
  });
  const diagnosticQuestions = DIAGNOSTIC_QUESTIONS[name === 'products' || name === 'productDiagnostics' ? 'products' : 'initial'];
  writeFileSync(`${out}/${name}.json`, JSON.stringify({ ...corpus, cases, diagnosticQuestions }, null, 2) + '\n', { flag: 'wx' });
}
JS
````

Check exact selections and render their measured prompts without a browser:

```bash
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --cases tmp/prompt-experiments/digit-plus-rerun/inputs/original.json --prompts scripts/prompt-experiments/digit-plus/results/20260911-label-meaning/prompts.mjs --check v1-zh v2-zh
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --cases tmp/prompt-experiments/digit-plus-rerun/inputs/single.json --prompts scripts/prompt-experiments/digit-plus/results/20260911-label-meaning/prompts.mjs --check v1-zh v3-zh-single
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --cases tmp/prompt-experiments/digit-plus-rerun/inputs/quantity.json --prompts scripts/prompt-experiments/digit-plus/results/20260911-label-meaning/prompts.mjs --check v1-zh
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --cases tmp/prompt-experiments/digit-plus-rerun/inputs/products.json --prompts scripts/prompt-experiments/digit-plus/results/20260911-label-meaning/prompts.mjs --check v1-zh v4-zh-merged v5-zh-separate
```

To repeat a historical screen in the verified Chrome Beta session, replace `--check` with `--out tmp/prompt-experiments/digit-plus-rerun/<new-run> --orders 2 --repeats 1`. Load local connection settings with `node --env-file-if-exists=scripts/prompt-experiments/.env.local`. This reproduces the historical setup only; synthetic inputs do not qualify as a new source-based experiment.

The original repeat check used 2 fresh runs of v1 alone on `original.json`, each with `--orders 2 --repeats 3`. Explicit quantity used v1 on `quantity.json` with the same order/repeat counts, once. These were historical repeat checks, not the current matched-prompt confirmation protocol.

Diagnostics used `diagnostics.json` with v1 and v2, or `productDiagnostics.json` with v4 and v5. Use `--orders 1 --repeats 1 --diagnostics` followed by that selection's comma-separated IDs. The preparation command restores the appropriate exact follow-up questions. Diagnostic answers stay outside accuracy scoring.

Use the [shared runner](../../../README.md) and a fresh output directory for every invocation. `v18-en-real-examples` remains the default for the real development corpus, preserving the previous runner choice; that default is not an evidence-backed shipping recommendation. `shipping` loads the current production digit-plus prompt; use it as the control for new experiments. The frozen v18 snapshot currently matches production, but retained artifacts do not establish its historical promotion evidence. Future experiments need fresh measurements, verified real inputs, and production-spacing checks.

## Retention

This round keeps only `REPORT.md` and `prompts.mjs`. Source records and historical cases live in the shared corpus files pinned above. All 26 original files, including the 3 former reports and the old registry/corpus, moved unchanged to `tmp/prompt-experiments/digit-plus-20260911/original/`. No archive was created. The old embedded holdouts are also retained privately under that round's `reserved-holdout/` directory.

Migration verification checked original-file hashes, exact prompts and case selections, saved label scores, and runner behavior. No browser or new model inference ran. Original answers are needed to recompute the original scores; reruns may differ with runtime or model changes.
