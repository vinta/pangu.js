# Prompt experiments

Invoke the `prompt-experiments`. It runs experiments, verifies results, and reports findings for the user to decide what comes next. This README covers commands.

## Setup

Follow [machine setup](../../.agents/skills/prompt-experiments/references/setup.md) to install dependencies, load the extension, provision the model, and attach `pangu-eval`. Use Node 22.18+ and `playwright-cli` on `PATH`.

Connection settings are optional and local. Copy [`.env.example`](.env.example) to `.env.local` after checking it is ignored and untracked. Supply settings through Node's `--env-file` support, exported environment variables, or the sweep's explicit profile/extension flags.

## Run

Run commands from the repository root. Hyphen-digit requires an explicit `--cases` file and has no legacy corpus fallback. Its source records live in `hyphen-digit/corpus/`; the corpus contains 21 development and 8 holdout targets. The completed round evaluated all 8 holdouts; obtain fresh holdouts before another qualification round. Reuse saved source snapshots and replay production inputs locally. Fetch sources again only under the workflow’s [source-verification rules](../../.agents/skills/prompt-experiments/references/sources.md).

```bash
# Validate the retained source records and render shipping without a browser.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --check shipping

# Replay captured source context without model inference, in the verified browser session.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs

# Measure shipping in the new execution session; every output directory must be new.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --out scripts/prompt-experiments/hyphen-digit/results/new-baseline shipping
```

`shipping` imports `hyphenDigitPrompt` from the current production source. The installed worker provides the execution context; the sweep uses its own model sessions. Freeze the shipping bytes before measurement and keep them fixed while comparing candidates.

For an independent round, use `--prompts <module>` with a new module exporting `PROMPTS`. This avoids loading historical candidates. `shipping` always comes from current production and cannot be overridden.

After fresh diagnostics justify a candidate, create `scripts/prompt-experiments/hyphen-digit/new-round-prompts.mjs`. Each entry has `system`, `build(kase)`, and optional `omitResponseConstraintInput`. For an initial wiring check, a copy of the baseline can use this interface:

```javascript
import { hyphenDigitPrompt } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts';

export const PROMPTS = {
  'control-copy': {
    system: hyphenDigitPrompt.systemPrompt,
    build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
  },
};
```

A copied control tests the execution path; it is not an improvement candidate. Freeze a distinct variant ID and the measured prompt bytes after making the justified change.

```bash
# Matched invocation using only the new round's definitions and current shipping.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/sweep.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --prompts scripts/prompt-experiments/hyphen-digit/new-round-prompts.mjs --out scripts/prompt-experiments/hyphen-digit/results/new-comparison shipping control-copy
```

For the separate digit-plus experiment, use `--experiment digit-plus`; its interface is documented in [digit-plus/README.md](digit-plus/README.md). That experiment's historical results are outside the hyphen round and must not guide it.

## Measurements and gates

The runner records labels, raw answers, errors, timings, and actual case orders. It creates a fresh base session per order and a fresh clone per target/attempt, with the sampling settings used by production. `--orders` defaults to two; `--repeats` defaults to one. Recorded seeded shuffles make orders reproducible.

Record the run's Git revision in the experiment notes. Save any relevant uncommitted or external code and inputs alongside the results before changing them again.

A case passes only when every expected answer is correct and has no error. Missing answers, skips, and incomplete runs fail. Diagnostic output is separate from accuracy: use `--diagnostics <case IDs>` with `--orders 1 --repeats 1` on development cases only. Never run diagnostics on holdout.

`--require-perfect` fails if any scored case fails. The new experiment's paired no-regression gate is different: compare baseline and candidate per case under the declared protocol. Label outputs alone do not establish final spacing. Complete the spacing annotations and replay checks in the workflow’s [acceptance gates](../../.agents/skills/prompt-experiments/SKILL.md#acceptance-gates), then report the outcomes.

When finished, disconnect with `playwright-cli -s=pangu-eval detach`.

## Runner tests

```bash
npx vitest run --exclude '**/tmp/**' scripts/prompt-experiments/sweep.test.ts scripts/prompt-experiments/hyphen-digit/paired-gates.test.ts
```

These tests use mocked model responses and require no browser. They run separately from `npm test` and are outside the typed ESLint scope.

## Collect and replay a new source

Read the skill's [source collection rules](../../.agents/skills/prompt-experiments/references/sources.md) and [artifact rules](../../.agents/skills/prompt-experiments/references/artifacts.md) before capture. Select a public passage, annotate all eligible targets, and prepare a reviewed corpus with exact source context. Disable Pangu and verify its switch before loading source pages.

```bash
# Verify a reviewed new corpus against the live source; output must be a new directory.
node --env-file-if-exists=scripts/prompt-experiments/.env.local scripts/prompt-experiments/hyphen-digit/results/20260911-round1/collect-sources.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/new-development.json --out scripts/prompt-experiments/hyphen-digit/results/new-sources

# Replay its production inputs, target edits, and combined spacing without inference.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs --cases scripts/prompt-experiments/hyphen-digit/corpus/new-development.json
```

These paths describe files you create for the new round. Collection verifies source text; annotation, exposure, role assignment, and choosing the smallest faithful fixture still require judgment.

## New round helpers

For a new round, write its own protocol with the fields in [artifact rules](../../.agents/skills/prompt-experiments/references/artifacts.md#round-record). Reuse `hyphen-digit/paired-gates.mjs`'s `evaluatePaired({ phase, cases, comparisons, exampleSources, editsForLabel, applyTextEdits })`. Each comparison is `{ baseline, candidate }` from the two result JSON files. Supply current production `hyphenDigit.edits({ index: kase.settled_index }, label)` and `applyTextEdits`; bundle their TypeScript imports with the installed `rolldown` as the existing replay helper does.

If adapting a recorded-round gate helper, replace its round/corpus paths, baseline and candidate locks, variant IDs, count assumptions, and prompt-question lookup with the new round's frozen values. Check the recorded revision and saved changes, then validate options, labels and questions before scoring. Keep production spacing functions and `evaluatePaired` unchanged. Do not run a historical helper against new-round output without those adaptations.
