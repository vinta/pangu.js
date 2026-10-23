# Prompt experiments

Run commands from the repository root. Each `--out` must be a new, ignored, untracked directory under `local/prompt-experiments/<round>/`.

Keep only `REPORT.md` and `prompts.mjs` in each completed result directory. Follow the skill's [round record](../../.agents/skills/prompt-experiments/references/artifacts.md#round-record) for controls, iteration history, and frozen prompts. Keep reusable cases, fixtures, and exposure history in the shared corpus. Raw answers, diagnostics, snapshots, and gate outputs stay in `local/prompt-experiments/` through verification and reporting.

Supply connection settings through Node's `--env-file` support, exported environment variables, or the sweep's explicit profile/extension flags.

Use these command examples as needed by the skill's [screening loop](../../.agents/skills/prompt-experiments/SKILL.md#screening-loop). Resume from the current-state entry in `REPORT.md`; read CLI summaries and relevant failures during iteration.

## Experiments

### hyphen-digit

Hyphen-digit requires `--cases <corpus.json>`. Add verified development cases to [corpus/development.json](hyphen-digit/corpus/development.json), reusing existing case IDs. Each round records its selected IDs and prompt-example exclusions, so later corpus additions do not change historical reruns.

Keep active holdouts under ignored `local/prompt-experiments/`, outside the prompt-editing agent’s context. Collect and replay new holdouts after confirmation passes; existing eligible holdouts can remain reserved. Freeze the prompt before holdout evaluation. After evaluation, move the used cases into the shared development corpus and record their exposure; future experiments can use them for regression checks.

```bash
# Optional offline inspection; inference repeats this validation.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --check shipping

# Replay new or changed fixtures in the verified browser session.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs

# Measure a fresh shipping baseline for a new round or changed controls.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --out local/prompt-experiments/new-round/baseline shipping
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
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --prompts scripts/prompt-experiments/hyphen-digit/results/new-round/prompts.mjs --out local/prompt-experiments/new-round/comparison shipping control-copy
```

For candidate screening, pass your frozen variant ID. Omit `shipping` when baseline reuse applies, then run the [paired gate command](#paired-gate-helper) on the saved baseline and candidate results.

### digit-plus

Use `--experiment digit-plus`. Cases default to [corpus/development.json](digit-plus/corpus/development.json); select another corpus with `--cases`. The default prompt remains `v18-en-real-examples`. Use `--prompts` and positional prompt IDs to select frozen prompts from a round.

The [historical report](digit-plus/results/20260911-label-meaning/REPORT.md) retains the synthetic experiments and their exact prompt changes. [corpus/historical.json](digit-plus/corpus/historical.json) keeps those cases for historical reruns only. The real development corpus retains source notes, 3 training examples, and 4 unresolved review records. Training and review records are excluded from scoring. Its older evidence still needs the current production-input and spacing checks before a new experiment.

Previously reserved holdouts now stay under ignored `local/prompt-experiments/`; they have no retained evaluation results and must not be treated as evaluated regression cases. Their earlier tracked text also means they cannot be assumed unseen. Pass a separate corpus with `role: "holdout"` for an eligible frozen-prompt evaluation; `--split` has been removed.

```bash
# Optional offline validation without Chrome.
node scripts/prompt-experiments/sweep.mjs --experiment digit-plus --check

# Run the selected prompt in the verified Chrome Beta session after source and spacing checks.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment digit-plus --out local/prompt-experiments/digit-plus-next/screen shipping

# Diagnose a new development failure when existing findings do not explain it.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment digit-plus --orders 1 --diagnostics tw-lb-07-1 --out local/prompt-experiments/digit-plus-next/diagnostics
```

Digit-plus prompt modules can provide `labels` and `expectedLabel(kase)` when comparing label sets. These preserve the historical merged/separate product-name comparisons. Current development inputs require exactly one plus; only a corpus marked `historical: true` permits the old multiple-plus cases. `shipping` loads the current production digit-plus prompt; use it as the control for new experiments. The versioned entries remain frozen historical prompts.

### plus-digit

Use `--experiment plus-digit --prompts <round>/prompts.mjs`. Cases default to [corpus/development.json](plus-digit/corpus/development.json). `shipping` imports the production plus-digit prompt; it is the default variant and the control for new rounds. Candidate entries use the usual model path and the fixed labels `signed-number`, `conjunction`, `unsure`.

`input` contains one `+` in the contract sentence slice. `expected_output` is that input after core spacing and the gold edit. Keep the full authored excerpt in `sourceExcerpt`, its target offset in `excerptAt`, and combined gold in `expected_excerpt_output`. Records from one excerpt share `excerptId`; retain every eligible target when selecting an excerpt. The loader checks the core output and sentence slice, then freezes individual and combined production edits. Composition preparation checks production detection; browser corpus replay verifies DOM routing.

```bash
# Check the corpus and frozen prompt without inference.
node scripts/prompt-experiments/sweep.mjs --experiment plus-digit --prompts scripts/prompt-experiments/plus-digit/results/new-round/prompts.mjs --check shipping candidate

# Measure fresh shipping and the candidate with matched orders and repetitions.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment plus-digit --prompts scripts/prompt-experiments/plus-digit/results/new-round/prompts.mjs --out local/prompt-experiments/new-round/screening shipping candidate
```

Use the shared [paired gate helper](#paired-gate-helper) with `--experiment plus-digit --baseline <frozen-shipping-key>`, the round's frozen copy of the shipping prompt. It reports label, target-spacing, and combined-spacing accuracy separately. An `unsure` answer on a sign is a label miss but keeps safe spacing. Every sign must keep correct target spacing in every attempt; screening and confirmation also need a stable conjunction fix. Invalid answers, errors, skips, and missing attempts fail the gate.

### Composed output

Component combined-spacing scores include only the experiment's shape. When other shapes route in the same excerpt, use `composition.mjs` to check complete output as well. It currently accepts plus-digit corpora and discovers the shipping hyphen-digit and digit-plus targets from the same original text. Each record needs `companion_targets` (including an empty array when none route), `expected_composed_output` for its input slice, and `expected_composed_excerpt_output` for the full excerpt. Each companion records `kind`, `excerptAt`, and independently reviewed `expected_label`.

The frozen prompt module exports `PROMPTS`, `BASELINE_SHAPE_PROMPTS`, and `SHAPE_PROMPTS`; each map names the frozen prompt key that its side runs for every shape kind. Every baseline entry must reproduce the shipping prompt, and the candidate reuses the baseline companion keys, so only its plus-digit entry can differ. Prepare validates complete annotations, production companion questions, and both levels of gold, then writes component corpora plus a frozen manifest:

```bash
node scripts/prompt-experiments/composition.mjs prepare --cases scripts/prompt-experiments/plus-digit/corpus/development.json --prompts scripts/prompt-experiments/plus-digit/results/new-round/prompts.mjs --out local/prompt-experiments/new-composition/prepared
```

The committed [composed-output round](plus-digit/results/20261023-composed-output/REPORT.md) predates `BASELINE_SHAPE_PROMPTS` and the retirement of offline baselines, so it reruns only at its recorded harness revision.

Run each generated component corpus through `sweep.mjs --experiment <shape> --orders 2 --repeats 3`. The baseline uses the frozen shipping prompt for every shape; the candidate uses the same companion prompts and the frozen plus-digit candidate. Generate fresh artifacts for every shape on each side. Run baseline then candidate for comparison 1, followed by candidate then baseline for comparison 2. No sweep is needed for a shape with zero targets. Save the artifact paths as two comparisons:

```json
[
  {
    "baseline": {
      "hyphen-digit": "local/prompt-experiments/new-composition/baseline-1-hyphen/1-hyphen-v29-zh.json",
      "plus-digit": "local/prompt-experiments/new-composition/baseline-1-plus/1-v1-en.json"
    },
    "candidate": {
      "hyphen-digit": "local/prompt-experiments/new-composition/candidate-1-hyphen/1-hyphen-v29-zh.json",
      "plus-digit": "local/prompt-experiments/new-composition/candidate-1-plus/1-v2-en.json"
    }
  },
  {
    "baseline": {
      "hyphen-digit": "local/prompt-experiments/new-composition/baseline-2-hyphen/1-hyphen-v29-zh.json",
      "plus-digit": "local/prompt-experiments/new-composition/baseline-2-plus/1-v1-en.json"
    },
    "candidate": {
      "hyphen-digit": "local/prompt-experiments/new-composition/candidate-2-hyphen/1-hyphen-v29-zh.json",
      "plus-digit": "local/prompt-experiments/new-composition/candidate-2-plus/1-v2-en.json"
    }
  }
]
```

Include every detected shape on each side and use actual paths beneath the ignored round directory. Paths resolve from the repository root, where these commands run, not from the comparisons file. Check the saved answers offline:

```bash
node scripts/prompt-experiments/composition.mjs check --prepared local/prompt-experiments/new-composition/prepared/prepared.json --runs local/prompt-experiments/new-composition/comparisons.json --out local/prompt-experiments/new-composition/gate
```

The gate checks frozen controls, fresh artifacts, reversed execution order, component safety, complete-excerpt regressions, attempt declines, and a stable improvement. Run the experiment's component gate on the same plus-digit artifacts as well: a composed improvement can come from different companion answers, so it cannot by itself establish a plus-digit gain. `gate.json` retains separate component labels/spacing, full outputs, and failures attributed to shapes. The harness uses production detectors and edits for all three shapes. DOM fixture replay separately verifies extraction across text nodes. Previously evaluated holdouts must be marked development for this follow-up.

## Runner options

`--orders` defaults to 2; `--repeats` defaults to 1.

Use `--diagnostics <id1,id2>` with a development corpus, `--orders 1 --repeats 1`, and no `--require-perfect` for separate diagnostic output. Reuse findings about the same failure while testing another hypothesis.

`--require-perfect` fails if any scored case fails.

## Runner tests

Run when no matching pass is recorded, or after runner, gate, or relevant dependency changes. Prompt wording changes alone do not require another run.

```bash
npx vitest run --exclude '**/local/**' scripts/prompt-experiments/sweep.test.ts scripts/prompt-experiments/plus-digit.test.ts scripts/prompt-experiments/composition.test.ts scripts/prompt-experiments/hyphen-digit/paired-gates.test.ts scripts/prompt-experiments/hyphen-digit/check-paired.test.ts
```

These tests require no browser and run separately from `npm test`.

## Collect and replay a new source

Reuse verified sources and matching replay results under the skill's [reuse conditions](../../.agents/skills/prompt-experiments/SKILL.md#checks-to-reuse). Prompt wording alone does not require collection or replay.

```bash
# Verify a reviewed new corpus against the live source.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/hyphen-digit/collect-sources.mjs --cases local/prompt-experiments/new-round/inputs/new-development.json --out local/prompt-experiments/new-round/sources

# Replay its production inputs, target edits, and combined spacing without inference.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases local/prompt-experiments/new-round/inputs/new-development.json
```

Prepare new source records in an ignored, untracked input directory first. After verification, merge development cases into `hyphen-digit/corpus/development.json`. Keep active holdouts private until evaluation. Use a new output directory for each invocation.

## Paired gate helper

Run `check-paired.mjs` on saved hyphen-digit or plus-digit artifacts. It checks the frozen prompts, inputs, schema, sampling, and runtime verification flags. Both shapes use production edits, bundled in memory; the evaluator runs offline without building the extension.

```bash
node scripts/prompt-experiments/hyphen-digit/check-paired.mjs \
  --phase screening \
  --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json \
  --prompts scripts/prompt-experiments/hyphen-digit/results/new-round/prompts.mjs \
  --baseline v27-zh \
  --out local/prompt-experiments/new-round/gate \
  local/prompt-experiments/new-round/baseline/1-shipping.json \
  local/prompt-experiments/new-round/candidate/1-candidate.json
```

Use the exact scored corpus selection; restore its recorded version if the shared corpus changed. `--baseline` names the frozen prompt entry for the saved shipping artifact. Candidate entries come from their saved variant IDs. Replace the example paths and prompt keys with the round's records.

For `--phase confirmation` or `--phase holdout`, supply both fresh comparisons: `baseline-1.json candidate-1.json baseline-2.json candidate-2.json`. Keep this argument order even when candidate inference ran first. Holdout requires a corpus with `role: "holdout"`; other phases require `role: "development"`. Repeat `--example-source <canonical-url>` for excluded example pages; those pages must be absent from the scored selection.

The command prints scores and failure summaries and writes the full result to a new ignored `gate.json`. Failed gates exit 1 and retain their result; invalid inputs exit 1 with an error. Browser/model continuity and source verification remain the skill's responsibility.
