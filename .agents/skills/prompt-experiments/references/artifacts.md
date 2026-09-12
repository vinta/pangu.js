# Artifact rules

Save only relevant experiment evidence; keep credentials and private operational data out of public artifacts.

## Destinations

Keep helpers and public evidence under `scripts/prompt-experiments/`. Use a new directory for each invocation. Keep personal connection settings in `scripts/prompt-experiments/.env.local`; [setup](setup.md) explains discovery and use.

Before a private write, run `git check-ignore -- <destination>` and `git ls-files -- <destination>` from the repository root. Proceed only when the first confirms an ignore rule and the second returns no tracked path. Check existing files inside directories too. Add a repository ignore rule for a chosen raw-output directory before using it; global ignores are not portable. Never overwrite existing run output.

Select public fields before writing, including nested objects. Keep credentials, connection/profile values, machine paths, session identifiers, authenticated content, and unfiltered logs/captures local. Review embedded fixtures and result metadata for these fields; a secret scan alone does not establish privacy.

## Round record

Keep the following evidence for each round, reusing the existing helpers' formats and metadata:

- **Corpus:** exact source text, source URLs, expected answers, and example/development/holdout roles. Include the context and target annotations needed to reconstruct production inputs and check final spacing.
- **Exact prompts for each iteration:** system prompts, rendered model inputs, and the code that constructed them, including label definitions and response schema.
- **Results:** raw answers, errors, scores, relevant diagnostic exchanges, and individual-target and combined final-spacing outputs. Retain failed runs as well as successful ones.
- **Iteration history:** the previous version and what changed from it.
- **Reasoning and conclusions:** the hypothesis, what the results showed, and whether the candidate met the experiment gates, including failed or inconclusive outcomes.
- **Essential execution settings:** model/browser versions when known, sampling and other model API options, repetition counts, and execution order, including any shuffle seed.
- **Reusable scripts and tests:** the code version and commands needed to run the experiment and check its results again.

Before inference, freeze the corpus, prompts, input construction, code version, and execution settings. Recheck those controls before each phase.

Keep public experiment inputs, scripts, and results in Git. Record the Git revision used for each run and save any uncommitted code or input changes that affected it alongside the results.

## Evidence integrity

Preserve exact scored text and model inputs; exclude sensitive cases or collect another verified source instead of altering them for privacy. Fixtures must reproduce production inputs, UTF-16 target offsets, routing, individual edits, combined spacing, and authored-space exclusions. Validate references to public evidence.

Publish completed holdouts only as historical evidence. Keep active holdouts outside tuning context; an ignore rule alone does not prevent exposure.

Done when the saved evidence identifies what was tested, supports the reported conclusions, and is sufficient to rerun the experiment and recompute its scores and spacing checks.
