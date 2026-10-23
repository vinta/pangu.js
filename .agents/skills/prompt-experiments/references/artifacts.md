# Artifact rules

Keep enough to rerun an experiment and understand its decisions. Raw execution history is disposable after verification and reporting.

## Destinations

Keep reusable helpers under `scripts/prompt-experiments/`. Keep reusable cases in each shape’s shared corpus under `<shape>/corpus/`. Each completed round under `<shape>/results/<round>/` keeps only `REPORT.md` and `prompts.mjs`.

Use `scratchDirectory()` to create a system temp directory for each experiment round, and write temporary experiment artifacts there. The [command reference](../../../../scripts/prompt-experiments/README.md) shows the shell setup.

Keep personal connection settings in `scripts/prompt-experiments/.env.local`; [setup](setup.md) explains discovery and use. Before saving them, run `git check-ignore -- <destination>` and `git ls-files -- <destination>` from the repository root. Proceed only when the first confirms a repository ignore rule and the second returns no tracked path.

Select public fields before writing durable records, including nested objects. Keep credentials, connection/profile values, machine paths, session identifiers, authenticated content, and unfiltered logs/captures local. Review embedded fixtures and metadata; a secret scan alone does not establish privacy.

## Round record

Record shared controls once, then append iteration changes and outcomes. Keep a short current-state entry in `REPORT.md` pointing to those controls, matching completed checks, active baseline/runs, latest result, next hypothesis, and invalidated checks. Use public identifiers; replace temporary run references with durable settings and findings before finalizing.

- **`REPORT.md`:** the goal and each iteration's parent prompt, finding, hypothesis, exact change, result, and decision. Include decisive failures and regressions, phase/gate outcomes, uncertainty, unresolved ideas, and reasons to revisit an approach. Separate observations from interpretations. Record code revision, model/browser versions or their unavailability, sampling/schema options, repetitions, case order/seeds, and commands for rerunning and checking results. Identify reused historical findings and prompts. Record the shared corpus path, Git revision or blob ID, exact ordered case IDs for each selection, and example-page exclusions. If corpus changes are uncommitted, state that their version becomes retrievable from Git after commit.
- **`prompts.mjs`:** frozen system prompts and question builders for every iteration, including the baseline, diagnostic follow-up questions, ordered response schemas, and any mapping from corpus meanings to prompt-specific labels. Preserve exact rendered input construction independently of future production edits. Reuse unchanged definitions by reference within the module.

## Shared corpus

Keep verified development cases in the shape’s canonical development corpus: exact source text, public URLs, capture dates, verification summaries, replay fixtures, target annotations, expected labels and individual/combined spacing, roles, and exposure history. Merge records by stable case ID and check conflicts in source text, target offsets, or annotations. Store each distinct case once; the round report records its selections. Retain necessary provenance inline so the corpus works after temporary captures are deleted.

Keep legacy synthetic cases in a separate historical corpus for reproducing old experiments. Record missing provenance, measurements, or runtime details as gaps; use verified real-source cases for new experiments.

Freeze shared corpus, code, and execution controls at round start; freeze each candidate's prompt and input construction before its first inference. Recheck controls at phase transitions or when the [reuse conditions](../SKILL.md#checks-to-reuse) change. Use the recorded Git version to restore a historical corpus when shared records change. Any helper changes needed for reproduction belong in shared versioned tooling, with their code revision recorded.

## User case review

Only new cases or changed case content trigger review. This covers examples, diagnostics, development, confirmation, and holdout. Changes to source text, model context, targets, labels, expected spacing, or source attribution require review of the affected cases. Reuse unchanged cases across rounds and prompt changes without another review; run settings and exposure bookkeeping alone do not trigger one.

After source verification and deterministic input/spacing checks, create `case-review-<experiment>-<round>-<role>-vNN.md` in the round directory. Choose an unused version and preserve earlier reviews. Include only the new or changed cases, mark the document `Pending review`, and identify the corpus revision or content hash and case IDs.

For each case, include its stable ID, source link or supplied provenance, target positions, expected labels for every routed shape, and what changed. Show the exact original excerpt immediately followed by its complete expected output in a `text` code block, one per line, without arrows or added prefixes. For multiline originals, use adjacent original/expected blocks and preserve their line breaks. Include the exact model input separately when it differs from the excerpt. Complete expected output includes all routed shapes; label any additional component-only output explicitly.

Link the document and ask the user to approve, revise, or defer the batch. Wait for explicit approval before model inference uses those cases as examples, diagnostics, or scored inputs; deterministic preparation and work on unchanged cases may continue. Record the approved case IDs, review version, and corpus revision/hash in `REPORT.md`. Apply requested corrections to the corpus, rerun affected deterministic checks, and issue a new review version for the changed entries. Creating the document or receiving no response is not approval.

For holdouts, the separate collection context creates the review document after confirmation and handles case corrections. Give the prompt-editing context only the document path and approval status until frozen evaluation; the user can review the cases without exposing their text or labels to prompt tuning. Keep the existing source-separation and exposure rules.

## Composed output

Component spacing applies only the experiment's shape. When another enabled shape routes in the same excerpt, preserve the original text and independently annotate every routed companion target. Keep component gold and complete-excerpt gold separately.

Compare all current shipping shapes against the same set with only the candidate shape changed or added. Freeze companion prompts, question builders, schemas, and sampling alongside the candidate. Classify every target from original context and derive all edits against the same core-settled snapshot, then combine once with production edit application. Sequentially classifying rewritten text tests a different pipeline.

Check both the candidate shape's component gate and complete-excerpt spacing on the same paired answers during confirmation and holdout. Preserve baseline-passing excerpts and correct-attempt counts; attribute failures to shapes and report absolute component and complete-excerpt accuracy separately. A whole-excerpt gain from different companion answers cannot establish a candidate-shape gain. Deterministic gold composition checks offsets and contracts; fresh companion inference establishes measured output.

Use the shared [composed-output evaluator](../../../../scripts/prompt-experiments/README.md#composed-output) when its supported shapes and phase match the task. Record uncovered interactions and distinguish a contract-only new shape from verified extension integration. Reuse the existing exposure rules for previously evaluated holdouts.

## Confirmation and holdout

Freeze one candidate, examples, source roles, questions, schema, sampling, and spacing expectations. Run 2 fresh confirmation comparisons, each with 2 case orders and 3 attempts per target per order. Run both prompts and reverse their execution order in the second comparison. This gives 12 answers per target per prompt; screening baseline reuse ends here.

Only after confirmation passes, collect and replay fresh holdouts in a separate context using the previously declared coverage and source-separation rules, or use eligible unseen reservations. Follow [source collection](sources.md); keep their text and labels outside the prompt-editing context. Evaluate candidate and shipping with the same 2-run protocol. Save both sides of both runs before inspecting answers. Holdout answers must not enter diagnostics or tuning in this round.

Done when confirmation and any eligible holdout evaluation have recorded gate outcomes. Count every error as a failure and state coverage limits. Repetition establishes stability on those inputs; broader sources establish coverage.

## Verification and retention

Finalize from saved evidence: use the [hyphen-digit paired gate command](../../../../scripts/prompt-experiments/README.md#paired-gate-helper), or a compatible shared evaluator for another shape, to recompute unverified gates and individual/combined spacing. Reuse recorded verification when its answers, controls, and verifier are unchanged. Check that prompts, rendered questions, labels, API options, orders, and attempts match the frozen protocol; save verification outputs with raw results.

Complete `REPORT.md` with the hypothesis, comparisons, each phase's pass/fail/incomplete/not-run status, remaining failures, and coverage limits. Report label and spacing accuracy separately, since different labels can produce the same edit. State that applying the candidate and verifying its extension integration remain separate work.

Retain successful and failed raw runs until their scores, individual/combined spacing, and paired gates have been checked and the findings recorded. Use shared helpers for verification rather than creating a verifier for every round. Durable records must not depend on temporary files or archives.

System cleanup timing and retention are not guaranteed. On resume, check that required temporary evidence still exists. If an unfinished phase lost required evidence, mark it incomplete and repeat the affected collection, review, or comparison before continuing; preserve recorded exposure history. Completed temporary output needs no archive or cleanup step.

Preserve exact scored text and model inputs; exclude sensitive cases or collect another verified source instead of altering them for privacy. Fixtures must reproduce production inputs, UTF-16 target offsets, routing, individual edits, combined spacing, and authored-space exclusions. Validate any retained public references.

Keep reserved holdout cases outside the prompt-editing context until evaluation of the frozen prompt. After evaluation, merge them into the shared development corpus with inference exposure recorded. They remain useful regression cases but are no longer unseen holdouts.

When auditing a completed round, check its report, frozen prompts, and pinned corpus selection first. Recompute original scores and gates when raw answers remain. Otherwise, report which setup checks passed and that original scores could not be independently recomputed. A new inference run produces new evidence; model or runtime changes can change its answers.

Done when the report, frozen prompts, and recorded version of the shared corpus explain every tested iteration and support rerunning the setup without temporary artifacts.
