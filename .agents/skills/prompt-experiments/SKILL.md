---
name: prompt-experiments
description: Use when running or verifying pangu.js prompt experiments, diagnosing model classification failures, or comparing candidate prompts. Excludes applying results to production and ordinary deterministic spacing fixes.
---

# Prompt experiments

Use the existing helpers in the [command reference](../../../scripts/prompt-experiments/README.md). Keep helpers and durable round records under `scripts/prompt-experiments/`, and raw output under `tmp/prompt-experiments/`. Applying results to production is a separate task; leave production source and prompt tests unchanged.

## Resume or start

A round contains many candidate iterations. To resume, read its current-state entry in `REPORT.md` and the relevant frozen prompt; continue the screening loop. Reuse recorded checks and diagnostics while their inputs remain unchanged. Read older reports, corpus text, raw answers, and reference sections only to resolve the next question.

For a new round, read the [destinations](references/artifacts.md#destinations) and [round record](references/artifacts.md#round-record) sections once, inspect current production code and relevant previous findings, and select verified corpus records with their exposure history. Record the goal, selection, controls, and reused findings. Declare holdout coverage and separation rules now; collect holdouts only after confirmation passes. Existing unseen reservations may remain private.

For an existing shape, measure fresh shipping as the control; for a new shape, start with a concise instruction and explicit labels. Screening uses corpus order and a recorded seeded shuffle, with 1 attempt per target per order. If no development failures remain, collect more verified coverage or finish without a prompt change.

For an audit of a completed round, read [verification and retention](references/artifacts.md#verification-and-retention) and inspect its saved evidence; a new inference run is new evidence.

For inference on a configured machine:

1. Use `scripts/prompt-experiments/.env.local`. Reuse the live `pangu-eval` connection, or attach it to the configured `PANGU_CDP_URL` with `playwright-cli -s=pangu-eval attach --cdp="$PANGU_CDP_URL"` after loading the settings into the environment.
2. Apply the [reuse conditions](#checks-to-reuse) to the recorded checks. Run the missing or invalidated checks and record any missing runtime metadata.
3. Once those checks pass, run shipping and the first frozen candidate with `sweep.mjs`; resume an existing round from its recorded next comparison.

Read [setup and repair](references/setup.md) for a missing prerequisite or failed connection/runtime check. Follow the relevant section, then resume the interrupted step.

## Checks to reuse

| Work                                                                       | Run when                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Runner tests](../../../scripts/prompt-experiments/README.md#runner-tests) | No matching passing check is recorded, or runner, gate, or relevant dependencies change; add coverage for helper changes                                                                                            |
| Production fixture replay                                                  | No matching pass is recorded, or fixtures, annotations, relevant spacing/detector/extractor code, replay tooling, or browser version/configuration change                                                           |
| Runtime verification                                                       | Initial connection or changed browser/profile/model; verify the intended profile before browser replay and record model component version or its unavailability                                                     |
| Fresh screening baseline                                                   | New round; changed scored records, example-page exclusions, gold, production inputs/edits, baseline prompt/options, tooling, or schedule; browser/model restart, update, reconnect, or uncertain runtime continuity |

Use `sweep.mjs` for inference. Each invocation validates cases and rendered prompts, verifies the extension profile and model readiness, isolates sessions, and records immutable results. Separate `--check` is optional for offline validation or diagnosis. Helper-managed output already enforces ignored, untracked destinations; apply [destination checks](references/artifacts.md#destinations) to private writes that bypass it.

Reuse a complete baseline's saved answers only within the same round and continuous browser connection with unchanged model/runtime and controls above. The runner still creates fresh inference sessions. Record which baseline each screening comparison uses. Gates check orders and sampling, not browser/model identity; if continuity cannot be established, run shipping with the candidate. Match production sampling, language declarations, and schema handling.

## Corpus and roles

Use verified real text for examples, diagnostics, development, confirmation, and holdout. Preserve authored text and context; synthetic fixtures are only for deterministic implementation tests. Read [source collection](references/sources.md) for new/changed records, evidence gaps or disputes, and live-page behavior. Reuse verified snapshots; regenerate affected production inputs and spacing from saved context when the contract changes.

Before scoring, every eligible target needs a verified label and individual/combined spacing. Keep routing and authored-space exclusions separate from classifier accuracy. Disputed meanings stay unscored; gold `unsure` needs an explanation of why the exact production context is insufficient.

Keep canonical pages disjoint across examples, development, and holdout. Record exposure; uncertain exposure belongs in development. Promoting a development case to an example excludes its whole page from scoring and requires a fresh baseline. Keep holdout text and labels outside the prompt-editing context until frozen evaluation. If holdout evidence guides tuning, end the round, move affected pages to development, and reserve fresh holdouts.

## Screening loop

1. Record the hypothesis, predicted effect, parent variant, and one changed prompt dimension. Freeze the variant ID, prompt bytes, and question builder in `prompts.mjs` before inference.
2. Run the candidate on the same scored records, orders, and attempts as its baseline. Use saved baseline answers when eligible; otherwise run both prompts. Compute the paired gates and individual/combined spacing from saved answers using a compatible shared helper and production edits. A command exit or `--require-perfect` is not a paired-gate result.
3. Read CLI scores, miss IDs, unstable cases, and gate summaries first; inspect only relevant failed rows. For a new unexplained development failure, use `--diagnostics` with 1 order and 1 attempt: follow classification with translation, target identification, and label-meaning questions. Reuse earlier diagnostic findings for the same failure. Explanations may be rationalizations and never count as accuracy evidence.
4. Append the result and decision to `REPORT.md`; update its current-state entry with the next hypothesis and any invalidated checks. Prefer the smaller prompt when qualifying candidates behave equally.

After two or three similar wording changes leave the same failures, investigate another cause. Use sourced examples for an identified vocabulary/domain gap, revisit disputed annotations, or report routing/extraction limits. Finish the iteration with a recorded gate outcome and next decision; retain raw artifacts without loading the full runs into context.

## Confirm and finish

Once one candidate meets screening and the task's requirements, read [confirmation and holdout](references/artifacts.md#confirmation-and-holdout). These phases always require fresh paired comparisons. Prepare new holdouts in a separate context only after confirmation passes, keeping the declared coverage and page separation fixed.

When ending the round, read [verification and retention](references/artifacts.md#verification-and-retention), complete the report, close temporary inspection pages, and disconnect. Failed or inconclusive experiments are valid outcomes; later dependent phases remain unrun.

## Acceptance gates

A correct attempt has no error, returns the expected label, and produces expected individual-target and combined-excerpt spacing through production edits. Missing attempts and skips fail. A case passes only when every scheduled attempt passes. Report label and spacing correctness separately.

| Phase        | Required result                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preflight    | Every model input/example has verified real provenance and production context; role separation passes; no unresolved labels in scored sets                               |
| Screening    | Candidate preserves every baseline-passing case and fixes at least one baseline-failing case outside its example source pages; no inference errors in either run         |
| Confirmation | The same rule holds independently in both fresh runs, and at least one same scored case is a stable improvement in both; no inference errors in either run               |
| Holdout      | Candidate preserves every baseline-passing case and has at least as many passing cases as baseline; no inference errors in either run; a new improvement is not required |

For baseline-unstable cases, require candidate correct-attempt counts to be no lower in each matched run. Aggregate gains cannot offset a new case failure. List remaining failures and coverage gaps. Report target, sentence, page, and publisher counts separately; repeated answers are not independent source cases.

An infrastructure failure leaves the comparison incomplete; retain its artifact and record it. After repair, repeat the entire affected comparison under the frozen protocol, refreshing the baseline if required above. Otherwise report it incomplete. Never retry a semantic failure until it passes.

## References

[Chrome's evaluation guidance](https://developer.chrome.com/docs/ai/evals/run) describes evaluation layers, contamination from prompt examples, and final evaluation on unseen cases. Its suggestions to generate synthetic data do not apply to this workflow.

Check the current [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api) before changing session or schema options. [Structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) constrains format; semantic correctness requires separate evaluation.
