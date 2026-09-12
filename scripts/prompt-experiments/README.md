# Prompt experiments

Run commands from the repository root. Each `--out` must be a new, ignored, untracked directory under `tmp/prompt-experiments/<round>/`.

Keep only `REPORT.md` and `prompts.mjs` in each completed result directory. The report records each iteration’s reasoning, results, execution settings, rerun commands, and exact ordered case IDs. Freeze prompt builders in the module. Keep reusable cases, source fixtures, and exposure history in the shared experiment corpus; record its Git revision or blob ID in the report. Raw answers, diagnostics, snapshots, and gate outputs stay in `tmp/prompt-experiments/` and can be deleted after the report is complete.

Supply connection settings through Node's `--env-file` support, exported environment variables, or the sweep's explicit profile/extension flags.

## Experiments

### hyphen-digit

Hyphen-digit requires `--cases <corpus.json>`. Add verified development cases to [corpus/development.json](hyphen-digit/corpus/development.json), reusing existing case IDs. Each round records its selected IDs and prompt-example exclusions, so later corpus additions do not change historical reruns.

Keep active holdouts under ignored `tmp/prompt-experiments/`, outside the prompt-editing agent’s context. Freeze the prompt before holdout evaluation. After evaluation, move the used cases into the shared development corpus and record their exposure; future experiments can use them for regression checks.

```bash
# Validate the retained source records and render shipping without a browser.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --check shipping

# Replay captured source context without model inference, in the verified browser session.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs

# Measure shipping.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --out tmp/prompt-experiments/new-round/baseline shipping
```

`shipping` imports `hyphenDigitPrompt` from the current production source and cannot be overridden.

Use `--prompts <module>` to load a module exporting `PROMPTS`. You can reuse historical prompts and corpora; record what you reused and measure a fresh shipping baseline.

Create `scripts/prompt-experiments/hyphen-digit/results/new-round/prompts.mjs`. Each entry has `system`, `build(kase)`, and optional `omitResponseConstraintInput`. This baseline copy tests the execution path; freeze its production-derived text and builder in the module before retaining the completed round:

```javascript
import { hyphenDigitPrompt } from '../../../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts';

export const PROMPTS = {
  'control-copy': {
    system: hyphenDigitPrompt.systemPrompt,
    build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
  },
};
```

```bash
# Compare the selected candidate with current shipping.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/new-round/prompts.mjs --out tmp/prompt-experiments/new-round/comparison shipping control-copy
```

### digit-plus

Use `--experiment digit-plus`. The default prompt is `v18-en-real-examples`; pass prompt IDs as positional arguments to select others. Cases come from [digit-plus/cases.json](digit-plus/cases.json). `--split` accepts `development` (default) or `holdout`.

```bash
# Validate both splits without Chrome.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --check
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --split holdout --check

# Run the selected prompt.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --out tmp/prompt-experiments/digit-plus-next/screen

# Run diagnostics for a case.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --orders 1 --diagnostics tw-lb-07-1 --out tmp/prompt-experiments/digit-plus-next/diagnostics
```

## Runner options

`--orders` defaults to 2; `--repeats` defaults to 1.

Use `--diagnostics <id1,id2>` with a development corpus, `--orders 1 --repeats 1`, and no `--require-perfect` for separate diagnostic output.

`--require-perfect` fails if any scored case fails.

## Runner tests

```bash
npx vitest run --exclude '**/tmp/**' scripts/prompt-experiments/sweep.test.ts scripts/prompt-experiments/hyphen-digit/paired-gates.test.ts
```

These tests require no browser and run separately from `npm test`.

## Collect and replay a new source

```bash
# Verify a reviewed new corpus against the live source.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/hyphen-digit/collect-sources.mjs --cases tmp/prompt-experiments/new-round/inputs/new-development.json --out tmp/prompt-experiments/new-round/sources

# Replay its production inputs, target edits, and combined spacing without inference.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases tmp/prompt-experiments/new-round/inputs/new-development.json
```

Prepare new source records in an ignored, untracked input directory first. After verification, merge development cases into `hyphen-digit/corpus/development.json`. Keep active holdouts private until evaluation. Use a new output directory for each invocation.

## Paired gate helper

Import `evaluatePaired({ phase, cases, comparisons, exampleSources, editsForLabel, applyTextEdits })` from `hyphen-digit/paired-gates.mjs`. Each comparison is `{ baseline, candidate }` from the two result JSON files. Supply current production `hyphenDigit.edits({ index: kase.settled_index }, label)` and `applyTextEdits`; bundle their TypeScript imports with the installed `rolldown` as the existing replay helper does.
