# Prompt experiments

Use [the real-text workflow](../../docs/research/2026-09-11-shape-prompt-improvement.md). For the next hyphen-digit round, follow [the experiment plan](../../docs/research/2026-09-11-hyphen-digit-real-text-experiment.md). Develop candidates from new baseline measurements and diagnostics; do not retrieve deleted experiments from Git history, temporary reports, previous sessions, or memories.

NEVER use fabricated text for experiments or prompt improvement. Every source passage in an input, example, or diagnostic must have verified provenance. Preserve authored text and production context. Keep disputed meanings unscored.

The runner uses the installed extension worker to call Gemini Nano. It requires Node 22.18+ and `playwright-cli` on PATH. The model must already be available; the runner does not download it.

## Browser connection

Read ignored `AGENTS.local.md` for the intended Chrome Beta profile, debugging endpoint, extension ID, and local paths. Verify current state before reusing those settings. Keep personal identifiers out of tracked files.

Use `playwright-cli list` to check the existing `pangu-eval` session. Attach to the configured debugging endpoint only if needed. The runner checks the Chrome profile name and verifies its actual path through a tab created by the extension. Browser launches and replay checks on macOS run outside the execution sandbox.

Set `PANGU_EXTENSION_ID`, `PANGU_CHROME_PROFILE_PATH`, and `PANGU_CHROME_PROFILE_NAME` from the verified local settings. Verify the unpacked extension's source checkout before any shipping integration check.

## Run

Run commands from the repository root. Hyphen-digit requires an explicit `--cases` file and has no legacy corpus fallback. Its source records live in `hyphen-digit/corpus/`; the corpus contains 19 development and 8 holdout targets. Recheck the sources and production inputs before the new experiment.

```bash
# Validate the retained source records and render shipping without a browser.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --check shipping

# Replay captured source context without model inference, in the verified browser session.
node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs

# Measure shipping in the new execution session; every output directory must be new.
node scripts/prompt-experiments/sweep.mjs --experiment hyphen-digit --cases scripts/prompt-experiments/hyphen-digit/corpus/development.json --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --profile-name "$PANGU_CHROME_PROFILE_NAME" --out scripts/prompt-experiments/hyphen-digit/results/new-baseline shipping
```

`shipping` imports `hyphenDigitPrompt` from the current production source. The installed worker provides the execution context; the sweep uses its own model sessions. Freeze the shipping bytes before measurement and keep them fixed while comparing candidates.

The hyphen candidate registry starts empty. Add a candidate only after the new baseline and real diagnostics justify its hypothesis. Give each measured version a distinct ID and preserve its rendered bytes. Any prompt examples must reference verified real records and their source pages must be excluded from scored cases.

For the separate digit-plus experiment, use `--experiment digit-plus`; its interface is documented in [digit-plus/README.md](digit-plus/README.md). That experiment's historical results are outside the hyphen round and must not guide it.

## Measurements and gates

The runner records labels, raw answers, errors, timings, and actual case orders. It creates a fresh base session per order and a fresh clone per target/attempt, with the sampling settings used by production. `--orders` defaults to two; `--repeats` defaults to one. Recorded seeded shuffles make orders reproducible.

A case passes only when every expected answer is correct and has no error. Missing answers, skips, and incomplete runs fail. Diagnostic output is separate from accuracy: use `--diagnostics <case IDs>` with `--orders 1 --repeats 1` on development cases only. Never run diagnostics on holdout.

`--require-perfect` fails if any scored case fails. The new experiment's paired no-regression gate is different: compare baseline and candidate per case under the declared protocol. Label outputs alone do not establish final spacing or shipping integration. Complete the spacing annotations and production checks required by the plan before accepting a candidate.

When finished, disconnect with `playwright-cli -s=pangu-eval detach`.

## Runner tests

```bash
npx vitest run scripts/prompt-experiments/sweep.test.ts
```

These tests use mocked model responses and require no browser. They run separately from `npm test` and are outside the typed ESLint scope.
