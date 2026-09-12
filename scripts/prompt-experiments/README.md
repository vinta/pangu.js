# Prompt experiments

Run commands from the repository root. Each `--out` must be a new, ignored, untracked directory under `tmp/prompt-experiments/<round>/`.

Keep only `REPORT.md` and `prompts.mjs` in each completed result directory. Follow the skill's [round record](../../.agents/skills/prompt-experiments/references/artifacts.md#round-record) for controls, iteration history, and frozen prompts. Keep reusable cases, fixtures, and exposure history in the shared corpus. Raw answers, diagnostics, snapshots, and gate outputs stay in `tmp/prompt-experiments/` through verification and reporting.

Supply connection settings through Node's `--env-file` support, exported environment variables, or the sweep's explicit profile/extension flags.

Use these command examples as needed by the skill's [screening loop](../../.agents/skills/prompt-experiments/SKILL.md#screening-loop). Resume from the current-state entry in `REPORT.md`; read CLI summaries and relevant failures during iteration.

## Experiments

### hyphen-digit

Hyphen-digit requires `--cases <corpus.json>`. Add verified development cases to [corpus/development.json](hyphen-digit/corpus/development.json), reusing existing case IDs. Each round records its selected IDs and prompt-example exclusions, so later corpus additions do not change historical reruns.

Keep active holdouts under ignored `tmp/prompt-experiments/`, outside the prompt-editing agent’s context. Collect and replay new holdouts after confirmation passes; existing eligible holdouts can remain reserved. Freeze the prompt before holdout evaluation. After evaluation, move the used cases into the shared development corpus and record their exposure; future experiments can use them for regression checks.

```bash
# Optional offline inspection; inference repeats this validation.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --check shipping

# Replay new or changed fixtures in the verified browser session.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs

# Measure a fresh shipping baseline for a new round or changed controls.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --out tmp/prompt-experiments/new-round/baseline shipping
```

`shipping` imports `hyphenDigitPrompt` from the current production source and cannot be overridden.

Use `--prompts <module>` to load a module exporting `PROMPTS`. Record reused historical prompts and corpora. Measure fresh shipping for each new round; screening can reuse it under the skill's [reuse conditions](../../.agents/skills/prompt-experiments/SKILL.md#checks-to-reuse). Confirmation and holdout always use fresh paired runs.

Create `scripts/prompt-experiments/hyphen-digit/results/new-round/prompts.mjs`. Each entry has `system`, `build(kase)`, and optional `omitResponseConstraintInput`. This control copy is an optional harness smoke test; skip it when the harness is already verified. Freeze its production-derived text and builder before retaining a completed round:

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
# Optional harness smoke test with shipping and its copy.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/new-round/prompts.mjs --out tmp/prompt-experiments/new-round/comparison shipping control-copy
```

For candidate screening, pass your frozen variant ID. Omit `shipping` when baseline reuse applies, and give the saved baseline and candidate results to the paired gate helper.

### digit-plus

Use `--experiment digit-plus`. Cases default to [corpus/development.json](digit-plus/corpus/development.json); select another corpus with `--cases`. The default prompt remains `v18-en-real-examples`. Use `--prompts` and positional prompt IDs to select frozen prompts from a round.

The [historical report](digit-plus/results/20260911-label-meaning/REPORT.md) retains the synthetic experiments and their exact prompt changes. [corpus/historical.json](digit-plus/corpus/historical.json) keeps those cases for historical reruns only. The real development corpus retains source notes, 3 training examples, and 4 unresolved review records. Training and review records are excluded from scoring. Its older evidence still needs the current production-input and spacing checks before a new experiment.

Previously reserved holdouts now stay under ignored `tmp/prompt-experiments/`; they have no retained evaluation results and must not be treated as evaluated regression cases. Their earlier tracked text also means they cannot be assumed unseen. Pass a separate corpus with `role: "holdout"` for an eligible frozen-prompt evaluation; `--split` has been removed.

```bash
# Optional offline validation without Chrome.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --check

# Run the selected prompt in the verified Chrome Beta session after source and spacing checks.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment digit-plus --out tmp/prompt-experiments/digit-plus-next/screen shipping

# Diagnose a new development failure when existing findings do not explain it.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment digit-plus --orders 1 --diagnostics tw-lb-07-1 --out tmp/prompt-experiments/digit-plus-next/diagnostics
```

Digit-plus prompt modules can provide `labels` and `expectedLabel(kase)` when comparing label sets. These preserve the historical merged/separate product-name comparisons. Current development inputs require exactly one plus; only a corpus marked `historical: true` permits the old multiple-plus cases. `shipping` loads the current production digit-plus prompt; use it as the control for new experiments. The versioned entries remain frozen historical prompts.

## Runner options

`--orders` defaults to 2; `--repeats` defaults to 1.

Use `--diagnostics <id1,id2>` with a development corpus, `--orders 1 --repeats 1`, and no `--require-perfect` for separate diagnostic output. Reuse findings about the same failure while testing another hypothesis.

`--require-perfect` fails if any scored case fails.

## Runner tests

Run when no matching pass is recorded, or after runner, gate, or relevant dependency changes. Prompt wording changes alone do not require another run.

```bash
npx vitest run --exclude '**/tmp/**' scripts/prompt-experiments/sweep.test.ts scripts/prompt-experiments/hyphen-digit/paired-gates.test.ts
```

These tests require no browser and run separately from `npm test`.

## Collect and replay a new source

Reuse verified sources and matching replay results under the skill's [reuse conditions](../../.agents/skills/prompt-experiments/SKILL.md#checks-to-reuse). Prompt wording alone does not require collection or replay.

```bash
# Verify a reviewed new corpus against the live source.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/hyphen-digit/collect-sources.mjs --cases tmp/prompt-experiments/new-round/inputs/new-development.json --out tmp/prompt-experiments/new-round/sources

# Replay its production inputs, target edits, and combined spacing without inference.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases tmp/prompt-experiments/new-round/inputs/new-development.json
```

Prepare new source records in an ignored, untracked input directory first. After verification, merge development cases into `hyphen-digit/corpus/development.json`. Keep active holdouts private until evaluation. Use a new output directory for each invocation.

## Paired gate helper

Import `evaluatePaired({ phase, cases, comparisons, exampleSources, editsForLabel, applyTextEdits })` from `hyphen-digit/paired-gates.mjs`. Each comparison is `{ baseline, candidate }` from the two result JSON files. Supply current production `hyphenDigit.edits({ index: kase.settled_index }, label)` and `applyTextEdits`; bundle their TypeScript imports with the installed `rolldown` as the existing replay helper does.
