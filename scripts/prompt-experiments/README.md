# Prompt experiments

For `omitResponseConstraintInput` on the hyphen classifier, see [the v26 comparison](hyphen-digit/reports/2026-09-07-omit-constraint-input.md).

For title numbers and subtitle context, see [the v31 comparison](hyphen-digit/reports/2026-09-09-title-number.md).

For `Switch 2+遊戲` versus `Python 3+的版本`, see [the digit-plus experiment](digit-plus/README.md).

Run Gemini Nano experiments alongside the shipping code. The CLI sends evaluation code through Playwright to the installed pangu extension's service worker. No extra extension, eval page, or extension rebuild is needed to compare prompts.

Requires Node 22.18+ and `playwright-cli` on PATH. The model must already be available in the configured Chrome profile. The runner does not download it.

## Connect to Chrome

For this machine's settings, read the ignored `AGENTS.local.md` at the repository root if present. Keep personal setup details there.

Check `playwright-cli list` first. Reuse an open `pangu-eval` session across experiment rounds; attach only when it is missing. Detach when the experiment work is finished.

1. Open the intended Chrome profile. In that window, open `chrome://inspect/#remote-debugging` and enable **Allow remote debugging for this browser instance**.
2. Attach to the displayed server address and accept Chrome's debugging connection dialog. The command below uses `127.0.0.1:9222`; use the address shown by the configured profile.
3. Set `PANGU_CHROME_PROFILE_PATH` to the absolute **Profile Path** from `chrome://version`, and `PANGU_CHROME_PROFILE_NAME` to its Chrome display name. The runner verifies that path through a temporary tab created by the target extension. CDP can expose several profiles; a generic Playwright `newPage()` can open in Default.

```bash
# Attach to the configured profile and accept Chrome's debugging connection dialog.
playwright-cli -s=pangu-eval attach --cdp=ws://127.0.0.1:9222/devtools/browser
```

In that profile's `chrome://extensions/`, find the shipping pangu extension and copy its ID. For an unpacked installation, verify that its source directory is the intended shipping checkout. Set `PANGU_EXTENSION_ID` in your shell to that ID. The runner requires `--extension-id` and selects only that extension's `dist/service-worker.js`.

If the worker is missing, click its **service worker** inspection link in `chrome://extensions/`, then retry. The runner fails with the exact target URL if it cannot find the worker.

## Run

The default experiment is `hyphen-digit`. For classification after a digit, use `--experiment digit-plus`; see [the digit-plus experiment](digit-plus/README.md).

Run from the repository root. Every output directory must be new; existing results are never overwritten.

```bash
# Validate the cases and render selected prompts without connecting to Chrome.
node scripts/prompt-experiments/sweep.mjs --check shipping v21-zh v26-zh

# Compare the current shipping source with a candidate, 3 times per case.
node scripts/prompt-experiments/sweep.mjs --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --profile-name "$PANGU_CHROME_PROFILE_NAME" --repeats 3 --out scripts/prompt-experiments/hyphen-digit/results/my-comparison shipping v26-zh

# Require the candidate to pass every scored case in two fresh sessions.
node scripts/prompt-experiments/sweep.mjs --extension-id "$PANGU_EXTENSION_ID" --profile-path "$PANGU_CHROME_PROFILE_PATH" --profile-name "$PANGU_CHROME_PROFILE_NAME" --require-perfect --repeats 3 --out scripts/prompt-experiments/hyphen-digit/results/my-confirmation v26-zh v26-zh

# Disconnect when finished, leaving Chrome open.
playwright-cli -s=pangu-eval detach
```

With no variant arguments, the runner uses `shipping`. This imports `hyphenDigitPrompt` from `browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts` in the current checkout. It measures those source bytes even if the installed extension was built from an older checkout. The installed worker provides the execution context; its classifier and cached sessions are not used by the sweep.

Use `--cases <JSON path>` for a separate hyphen corpus. It replaces both `cases.json` and `field-cases.json`; keep the same `{ "enums": ..., "cases": [...] }` structure. An optional `set` names the corpus in result exports. Without it, custom runs use `hyphen-digit:custom`.

Add candidates to `hyphen-digit/prompts.js`. Keep measured variants unchanged and give revised prompts new IDs. Keep glosses generic; never describe control-specific cases or copy evaluation sentences into examples. To promote a winner, update the shipping prompt and compare `shipping` with the measured candidate.

## What the runner measures

- Original sign accuracy, control flips, and field accuracy, reported separately. Any wrong repeat makes that case fail.
- Exact system/user prompts, response schemas, token-to-label mappings, every raw response, errors, timings, browser user agent and prompt version in each new export.
- Fixed `temperature: 0`, `topK: 1`, canonical menu order, and no language declaration. Each case/repeat gets a fresh clone.
- `--orders N` (default 2) runs the cases in N orders per variant: corpus order, then seeded shuffles. Each order gets its own base session. A label near a tie depends on which questions earlier clones of the same base answered, so agreement within one order is not stability; the export lists the orders and tags every answer with its order index, and any disagreement marks the case unstable and wrong. Use `--orders 1` only for diagnostics.

The runner verifies the configured profile before each variant. Inference errors make the command fail; `--require-perfect` also fails if any scored case is wrong. A normal comparison can finish successfully while reporting accuracy failures.

The hyphen suite has 23 original cases, 5 field development cases, and 12 synthetic collision targets from review. Three original cases remain unscored: 12 original sign cases, 8 controls, 5 field cases, and 12 synthetic targets are scored. Synthetic IDs start with `field-collision-`; their scores are separate from the 5 webpage cases. These cases were used for prompt tuning, so results are regression evidence, not held-out accuracy. This does not exercise shipping message handling or webpage spacing end to end.

A prompt builder can return `null` to abstain before inference. Exports retain the target with `skipped`, no answers, and `correct: false`. Every scored skip fails `--require-perfect`; a skipped sign is a missed correction. Skips are never counted as correct classifications.

Use `--diagnostics <case-id,case-id>` with `--repeats 1 --orders 1` for separate interpretation sessions. After the constrained answer, the runner asks which occurrence the model understood and requests an exact surrounding quote. A custom corpus can supply `diagnosticQuestions`, a nonempty array of nonempty strings, to replace these follow-ups. These questions run only with `--diagnostics`. Diagnostic exports carry `purpose: interpretation-diagnostics-not-accuracy`; they are clues, not accuracy measurements. The flag cannot be combined with `--require-perfect`. Normal runs never include diagnostic history.

Run `node scripts/prompt-experiments/hyphen-digit/check-targets.mjs` to assert the baseline collision, target identities, unchanged sentences, and impossible quotes. Pass the intended shipping prompt's absolute path as the first argument to verify v26 parity too. The [target experiment report](hyphen-digit/reports/2026-09-06-target-identification.md) records the source commit used for this comparison.

## Files and evidence

- `sweep.mjs`: Chrome execution, scoring, and result export.
- `hyphen-digit/prompts.js`: frozen prompt variants, including rejected candidates.
- `hyphen-digit/cases.json`, `field-cases.json`: cases and expected labels.
- `hyphen-digit/build-cases.mjs`: regenerate the original corpus from the built library after rule changes. Run `npm run build:lib` first, then `node scripts/prompt-experiments/hyphen-digit/build-cases.mjs` and review the diff.
- `hyphen-digit/reports/`: field notes and experiment findings.
- `hyphen-digit/results/`: original raw exports preserved from `feature/context-aware-spacing` at `0e4bea8`, followed by new runs. Personal profile paths and extension IDs have been removed from saved exports. Field-case IDs and directory names use neutral labels; prompts, responses, scores, and timings are preserved.

Start with the [direct-label comparison](hyphen-digit/reports/2026-09-06-direct-labels.md) and [v26 tuning report](hyphen-digit/reports/2026-09-06-direct-labels-tuning.md). Historical reports describe the branch and runtime used at the time; `shipping` always comes from today's checkout.

Historical exports retain the experiment name and paths recorded when they were created.
