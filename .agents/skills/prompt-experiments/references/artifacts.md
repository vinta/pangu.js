# Artifact rules

Keep enough to rerun an experiment and understand its decisions. Raw execution history is disposable after verification and reporting.

## Destinations

Keep reusable helpers under `scripts/prompt-experiments/`. Keep reusable cases in each shape’s shared corpus (`hyphen-digit/corpus/` for hyphen-digit). Each completed round under `<shape>/results/<round>/` keeps only `REPORT.md` and `prompts.mjs`.

Write raw answers, diagnostics, rendered inputs, intermediate prompt/corpus snapshots, source captures, gate outputs, and verification results under `tmp/prompt-experiments/<round>/`. Use a new subdirectory for each invocation and never overwrite run output. Keep personal connection settings in `scripts/prompt-experiments/.env.local`; [setup](setup.md) explains discovery and use.

Before a private write, run `git check-ignore -- <destination>` and `git ls-files -- <destination>` from the repository root. Proceed only when the first confirms a repository ignore rule and the second returns no tracked path. Check existing files inside directories too. Active runners enforce the temporary output root.

Select public fields before writing durable records, including nested objects. Keep credentials, connection/profile values, machine paths, session identifiers, authenticated content, and unfiltered logs/captures local. Review embedded fixtures and metadata; a secret scan alone does not establish privacy.

## Round record

- **`REPORT.md`:** the goal and each iteration's parent prompt, finding, hypothesis, exact change, result, and decision. Include decisive failures and regressions, phase/gate outcomes, uncertainty, unresolved ideas, and reasons to revisit an approach. Separate observations from interpretations. Record code revision, model/browser versions or their unavailability, sampling/schema options, repetitions, case order/seeds, and commands for rerunning and checking results. Identify reused historical findings and prompts. Record the shared corpus path, Git revision or blob ID, exact ordered case IDs for each selection, and example-page exclusions. If corpus changes are uncommitted, state that their version becomes retrievable from Git after commit.
- **`prompts.mjs`:** frozen system prompts and question builders for every iteration, including the baseline, label definitions, and response schema. Preserve exact rendered input construction independently of future production edits. Reuse unchanged definitions by reference within the module.

## Shared corpus

Keep verified development cases in the shape’s canonical corpus (`hyphen-digit/corpus/development.json` for hyphen-digit): exact source text, public URLs, capture dates, verification summaries, replay fixtures, target annotations, expected labels and individual/combined spacing, roles, and exposure history. Merge records by stable case ID and check conflicts in source text, target offsets, or annotations. Store each distinct case once; the round report records its selections. Retain necessary provenance inline so the corpus works after temporary captures are deleted.

Before inference, freeze the corpus, prompts, input construction, code version, and execution settings. Recheck those controls before each phase. Use the recorded Git version to restore a historical corpus when shared records change. Freeze any changed input construction in the round prompt module. Any helper changes needed for reproduction belong in shared versioned tooling, with their code revision recorded.

## Verification and retention

Keep successful and failed raw runs locally until their scores, individual/combined spacing, and paired gates have been checked and the findings recorded. Use shared helpers for verification rather than creating a verifier for every round. Durable records must not depend on temporary files or archives.

Preserve exact scored text and model inputs; exclude sensitive cases or collect another verified source instead of altering them for privacy. Fixtures must reproduce production inputs, UTF-16 target offsets, routing, individual edits, combined spacing, and authored-space exclusions. Validate any retained public references.

Keep reserved holdout cases in ignored temporary storage and outside the prompt-editing context until evaluation of the frozen prompt. After evaluation, merge them into the shared development corpus with inference exposure recorded. They remain useful regression cases but are no longer unseen holdouts.

Done when the report, frozen prompts, and recorded version of the shared corpus explain every tested iteration and support rerunning the setup without temporary artifacts. Temporary output may then be removed; recomputing original scores requires the original answers, and reruns may differ after model or runtime changes.
