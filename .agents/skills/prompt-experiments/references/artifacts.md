# Artifact rules

Keep enough to rerun an experiment and understand its decisions. Raw execution history is disposable after verification and reporting.

## Destinations

Keep reusable helpers under `scripts/prompt-experiments/`. Keep reusable cases in each shape’s shared corpus under `<shape>/corpus/`. Each completed round under `<shape>/results/<round>/` keeps only `REPORT.md` and `prompts.mjs`.

Write raw answers, diagnostics, rendered inputs, intermediate prompt/corpus snapshots, source captures, gate outputs, and verification results under `tmp/prompt-experiments/<round>/`. Use a new subdirectory for each invocation and never overwrite run output. Keep personal connection settings in `scripts/prompt-experiments/.env.local`; [setup](setup.md) explains discovery and use.

Sweep and source collection use `artifacts.mjs` to enforce the temporary root, ignored/untracked destinations, and exclusive output creation; their writes need no duplicate manual probes. Before a private write that bypasses those helpers, run `git check-ignore -- <destination>` and `git ls-files -- <destination>` from the repository root. Proceed only when the first confirms a repository ignore rule and the second returns no tracked path. Check existing files inside directories too.

Select public fields before writing durable records, including nested objects. Keep credentials, connection/profile values, machine paths, session identifiers, authenticated content, and unfiltered logs/captures local. Review embedded fixtures and metadata; a secret scan alone does not establish privacy.

## Round record

Record shared controls once, then append iteration changes and outcomes. Keep a short current-state entry in `REPORT.md` pointing to those controls, matching completed checks, active baseline/runs, latest result, next hypothesis, and invalidated checks. Use public identifiers; replace temporary run references with durable settings and findings before finalizing.

- **`REPORT.md`:** the goal and each iteration's parent prompt, finding, hypothesis, exact change, result, and decision. Include decisive failures and regressions, phase/gate outcomes, uncertainty, unresolved ideas, and reasons to revisit an approach. Separate observations from interpretations. Record code revision, model/browser versions or their unavailability, sampling/schema options, repetitions, case order/seeds, and commands for rerunning and checking results. Identify reused historical findings and prompts. Record the shared corpus path, Git revision or blob ID, exact ordered case IDs for each selection, and example-page exclusions. If corpus changes are uncommitted, state that their version becomes retrievable from Git after commit.
- **`prompts.mjs`:** frozen system prompts and question builders for every iteration, including the baseline, diagnostic follow-up questions, ordered response schemas, and any mapping from corpus meanings to prompt-specific labels. Preserve exact rendered input construction independently of future production edits. Reuse unchanged definitions by reference within the module.

## Shared corpus

Keep verified development cases in the shape’s canonical development corpus: exact source text, public URLs, capture dates, verification summaries, replay fixtures, target annotations, expected labels and individual/combined spacing, roles, and exposure history. Merge records by stable case ID and check conflicts in source text, target offsets, or annotations. Store each distinct case once; the round report records its selections. Retain necessary provenance inline so the corpus works after temporary captures are deleted.

Keep legacy synthetic cases in a separate historical corpus for reproducing old experiments. Record missing provenance, measurements, or runtime details as gaps; use verified real-source cases for new experiments.

Freeze shared corpus, code, and execution controls at round start; freeze each candidate's prompt and input construction before its first inference. Recheck controls at phase transitions or when the [reuse conditions](../SKILL.md#checks-to-reuse) change. Use the recorded Git version to restore a historical corpus when shared records change. Any helper changes needed for reproduction belong in shared versioned tooling, with their code revision recorded.

## Confirmation and holdout

Freeze one candidate, examples, source roles, questions, schema, sampling, and spacing expectations. Run 2 fresh confirmation comparisons, each with 2 case orders and 3 attempts per target per order. Run both prompts and reverse their execution order in the second comparison. This gives 12 answers per target per prompt; screening baseline reuse ends here.

Only after confirmation passes, collect and replay fresh holdouts in a separate context using the previously declared coverage and source-separation rules, or use eligible unseen reservations. Follow [source collection](sources.md); keep their text and labels outside the prompt-editing context. Evaluate candidate and shipping with the same 2-run protocol. Save both sides of both runs before inspecting answers. Holdout answers must not enter diagnostics or tuning in this round.

Done when confirmation and any eligible holdout evaluation have recorded gate outcomes. Count every error as a failure and state coverage limits. Repetition establishes stability on those inputs; broader sources establish coverage.

## Verification and retention

Finalize from saved evidence: recompute any unverified paired gates and individual/combined spacing with compatible shared helpers and production edits. Reuse recorded verification when its answers, controls, and verifier are unchanged. Check that prompts, rendered questions, labels, API options, orders, and attempts match the frozen protocol; save verification outputs with raw results.

Complete `REPORT.md` with the hypothesis, comparisons, each phase's pass/fail/incomplete/not-run status, remaining failures, and coverage limits. Report label and spacing accuracy separately, since different labels can produce the same edit. State that applying the candidate and verifying its extension integration remain separate work.

Keep successful and failed raw runs locally until their scores, individual/combined spacing, and paired gates have been checked and the findings recorded. Use shared helpers for verification rather than creating a verifier for every round. Durable records must not depend on temporary files or archives.

Preserve exact scored text and model inputs; exclude sensitive cases or collect another verified source instead of altering them for privacy. Fixtures must reproduce production inputs, UTF-16 target offsets, routing, individual edits, combined spacing, and authored-space exclusions. Validate any retained public references.

Keep reserved holdout cases in ignored temporary storage and outside the prompt-editing context until evaluation of the frozen prompt. After evaluation, merge them into the shared development corpus with inference exposure recorded. They remain useful regression cases but are no longer unseen holdouts.

When auditing a completed round, check its report, frozen prompts, and pinned corpus selection first. Recompute original scores and gates when raw answers remain. Otherwise, report which setup checks passed and that original scores could not be independently recomputed. A new inference run produces new evidence; model or runtime changes can change its answers.

Done when the report, frozen prompts, and recorded version of the shared corpus explain every tested iteration and support rerunning the setup without temporary artifacts. Temporary output may then be removed.
