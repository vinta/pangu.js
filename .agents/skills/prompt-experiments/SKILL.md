---
name: prompt-experiments
description: Use when running pangu.js prompt experiments, adding a model-assisted spacing shape, diagnosing model classification failures, or comparing replacement prompts. Excludes ordinary deterministic spacing fixes.
---

# Prompt experiments

Use the existing helpers in the [command reference](../../../scripts/prompt-experiments/README.md). This skill guides source selection, prompt decisions, and acceptance.

Before collecting or writing experiment evidence, read [artifact rules](references/artifacts.md) for what to save and keep private.

## Starting context

Start from current production code and verified source snapshots with their exposure history. Select candidates from fresh baseline measurements and diagnostics. Keep previous candidate prompts, answers, scores, and conclusions outside the new round's context, including copies in Git history, temporary reports, old agent sessions, and memories.

## 1. Establish the real input contract

Use only verified real text for prompt examples, diagnostics, development, confirmation, and holdout. Preserve authored text and context; never invent passages, substitute names or numbers, or use model explanations/translations as corpus examples. Synthetic fixtures are limited to deterministic implementation tests. Record missing meaning or preserve-output coverage and find verified sources.

Read [source collection](references/sources.md) when adding or changing records, evidence is missing or disputed, or live-page behavior matters. Reuse verified source snapshots by default and replay production inputs and spacing locally. A new prompt experiment does not require downloading every source again.

If the detector or context extractor changes, regenerate production inputs and spacing expectations from saved context; revisit the live page only where that context is insufficient. Before inference, annotate every eligible target and verify individual and combined edits on frozen rule output. Keep routing and authored-space exclusions separate from classifier accuracy, and disputed meanings unscored. Gold `unsure` requires a defensible explanation that the exact production context is insufficient.

## 2. Separate examples, development, and holdout

Assign roles before inference: prompt examples teach the task, development cases guide changes, and holdouts evaluate a frozen candidate. Keep canonical source pages disjoint across roles; record redirects, duplicate passages, syndication, related publishers, and shared entities. Repeated mentions of one brand test that brand, not arbitrary name recognition.

Record prior inference and example exposure; uncertain exposure belongs in development. Obtain fresh holdouts when previous ones have been evaluated. When a development case becomes a prompt example, exclude its entire source page from scoring and rerun the baseline. If holdout text, labels, or answers guide tuning, end the round, move affected pages to development, and obtain fresh holdouts.

## Automated execution

Use `sweep.mjs` for inference; it owns session isolation, runtime checks, and immutable result recording. Run the existing [runner tests](../../../scripts/prompt-experiments/README.md#runner-tests) before inference; add coverage when changing helpers. Match production sampling, language declarations, and schema handling.

For initial setup or connection repair, read [setup](references/setup.md). Verify the intended profile and extension before browser replay; sweep verifies them again before inference. Record the actual model component version or its unavailability in the [round record](references/artifacts.md#round-record), alongside the runner's runtime metadata. Close temporary inspection pages and disconnect when done.

## 3. Measure a baseline and diagnose failures

For an existing shape, keep shipping as the control; for a new shape, start with a concise instruction and explicit label definitions. Freeze the [round record](references/artifacts.md#round-record) before inference and keep its controls fixed during comparisons. A detector or extraction change requires a new baseline.

Measure a fresh shipping baseline in each new round, even when source snapshots are reused. Use corpus order and a recorded seeded shuffle, using 1 attempt per target per order. If no development failures remain, collect more verified coverage or finish without a prompt change.

Inspect recorded errors, misses by meaning, and unstable cases. For representative development failures, run separate diagnostic conversations: ask the model to interpret or translate the original sentence, identify the target symbol, and explain which label fits. Use these answers to generate falsifiable hypotheses. Explanations after a wrong answer may be rationalizations.

**Done when:** a saved baseline reproduces the failure and each proposed change has a prediction that an isolated experiment can confirm or reject.

## 4. Test one hypothesis at a time

Write the hypothesis, predicted effect, parent variant, and isolated change before inference. Change one prompt dimension per comparison: instruction language, semantic definitions, target identification using unchanged source text, or sourced examples. Freeze variant IDs and rendered bytes. Run matched shipping and candidate comparisons on the same scored records, orders, and attempt counts. Prefer the smaller prompt when qualifying candidates behave equally.

If two or three similar wording changes leave the same failures, investigate a different cause. Vocabulary or domain misunderstandings may benefit from a few sourced examples. Routing errors belong in the detector or extractor. Ambiguous annotations require revisiting the expected meaning. Add examples only after identifying what they need to teach.

**Done when:** the selected change improves the declared development checks without a control regression. Retain the baseline when the experiment shows no benefit.

## 5. Freeze and confirm

Freeze one candidate, examples, source roles, questions, schema, sampling, and spacing expectations. Run 2 fresh confirmation comparisons, each with 2 case orders and 3 attempts per target per order. Run both prompts and reverse their execution order in the second comparison. This gives 12 answers per target per prompt.

Only after confirmation passes, evaluate that candidate and shipping on holdout with the same 2-run protocol. Save both sides of both runs before inspecting answers. Holdout answers must not enter diagnostics or tuning in this round.

**Done when:** the declared confirmation and holdout gates pass, every error counts as a failure, and remaining coverage limits are stated. Repetition establishes stability on those inputs; broader sources establish coverage.

## 6. Verify the shipping path

Build and load the intended checkout; verify the installed extension points to it. Check that the built extension uses the measured system prompt, rendered questions, enum, and API options. Reload the extension and send classification requests through its actual message entry point. Apply the returned labels through production spacing and edits, then compare final text. Reset sessions/caches between baseline and candidate checks. Count cache hits separately; they cannot satisfy fresh attempts. Keep real question collisions visible without changing inputs or dropping targets. Run the extension build, relevant shape tests, and typecheck; update frozen prompt tests only to the qualified bytes.

**Done when:** the built runtime returns the intended labels and final spacing for the evaluation cases, and relevant deterministic checks pass. Report label accuracy and spacing accuracy separately: different labels can produce the same edit.

## Acceptance gates

A correct attempt has no error, returns the expected label, and produces expected individual-target and combined-excerpt spacing through production edits. Missing attempts and skips fail. A case passes only when every scheduled attempt passes. Report label and spacing correctness separately.

| Phase | Required result |
| --- | --- |
| Preflight | Every model input/example has verified real provenance and production context; role separation passes; no unresolved labels in scored sets |
| Screening | Candidate preserves every baseline-passing case and fixes at least one baseline-failing case outside its example source pages; no candidate inference errors |
| Confirmation | The same rule holds independently in both fresh runs, and at least one same scored case is a stable improvement in both; no candidate inference errors |
| Holdout | Candidate preserves every baseline-passing case and has at least as many passing cases as baseline; no candidate inference errors; a new improvement is not required |
| Shipping integration | Built prompt/options match the frozen candidate; fresh real requests preserve the confirmed improvements and baseline-passing cases in labels and final spacing; routing exclusions and authored whitespace remain correct |

For baseline-unstable cases, require candidate correct-attempt counts to be no lower in each matched run. Aggregate gains cannot offset a new case failure. List remaining failures and coverage gaps. Report target, sentence, page, and publisher counts separately; repeated answers are not independent source cases.

An infrastructure failure leaves the comparison incomplete. Fix it, repeat the entire affected comparison under the frozen protocol, and retain the failed artifact. Never retry a semantic failure until it passes. A successful command exit or `--require-perfect` does not establish these paired gates. If any phase fails, retain or restore shipping.

## References

[Chrome's evaluation guidance](https://developer.chrome.com/docs/ai/evals/run) describes evaluation layers, contamination from prompt examples, and final evaluation on unseen cases. Its suggestions to generate synthetic data do not apply to this workflow.

Check the current [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api) before changing session or schema options. [Structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) constrains format; semantic correctness requires separate evaluation.
