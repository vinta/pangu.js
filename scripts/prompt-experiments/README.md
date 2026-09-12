# Prompt experiments

Run commands from the repository root. Use a new directory for each `--out`.

Supply connection settings through Node's `--env-file` support, exported environment variables, or the sweep's explicit profile/extension flags.

## Experiments

### hyphen-digit

Hyphen-digit requires `--cases <corpus.json>`.

```bash
# Validate the retained source records and render shipping without a browser.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --check shipping

# Replay captured source context without model inference, in the verified browser session.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs

# Measure shipping.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --out scripts/prompt-experiments/hyphen-digit/results/new-baseline shipping
```

`shipping` imports `hyphenDigitPrompt` from the current production source and cannot be overridden.

Use `--prompts <module>` to load a new module exporting `PROMPTS` without loading historical candidates.

Create `scripts/prompt-experiments/hyphen-digit/new-round-prompts.mjs`. Each entry has `system`, `build(kase)`, and optional `omitResponseConstraintInput`. This baseline copy tests the execution path:

```javascript
import { hyphenDigitPrompt } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts';

export const PROMPTS = {
  'control-copy': {
    system: hyphenDigitPrompt.systemPrompt,
    build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
  },
};
```

```bash
# Matched invocation using only the new round's definitions and current shipping.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --prompts scripts/prompt-experiments/hyphen-digit/new-round-prompts.mjs --out scripts/prompt-experiments/hyphen-digit/results/new-comparison shipping control-copy
```

### digit-plus

Use `--experiment digit-plus`. The default prompt is `v18-en-real-examples`; pass prompt IDs as positional arguments to select others. Cases come from [digit-plus/cases.json](digit-plus/cases.json). `--split` accepts `development` (default) or `holdout`.

```bash
# Validate both splits without Chrome.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --check
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --split holdout --check

# Run the selected prompt.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --out scripts/prompt-experiments/digit-plus/results-next-screen

# Run diagnostics for a case.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --orders 1 --diagnostics tw-lb-07-1 --out scripts/prompt-experiments/digit-plus/results-next-diagnostics
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
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/hyphen-digit/results/20260911-round1/collect-sources.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/new-development.json --out scripts/prompt-experiments/hyphen-digit/results/new-sources

# Replay its production inputs, target edits, and combined spacing without inference.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/new-development.json
```

Replace `new-development.json` with your corpus path and `new-sources` with a new output directory.

## Paired gate helper

Import `evaluatePaired({ phase, cases, comparisons, exampleSources, editsForLabel, applyTextEdits })` from `hyphen-digit/paired-gates.mjs`. Each comparison is `{ baseline, candidate }` from the two result JSON files. Supply current production `hyphenDigit.edits({ index: kase.settled_index }, label)` and `applyTextEdits`; bundle their TypeScript imports with the installed `rolldown` as the existing replay helper does.
