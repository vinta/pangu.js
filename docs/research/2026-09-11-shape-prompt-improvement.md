# Improving prompts for ambiguous spacing shapes

Date: 2026-09-11. Evaluation workflow for experiments using verified real source text.

Use this workflow when adding a model-assisted shape, investigating a classification failure, or comparing a replacement prompt for an existing shape. Choose candidate changes from the current baseline and diagnostics.

## Workflow

### 1. Establish the real input contract

NEVER use fabricated text for experiments or prompt improvement. This applies to prompt examples, diagnostic probes, development cases, confirmation runs, and holdouts. Do not invent sentences, substitute names or numbers in real excerpts, or append artificial context. If a real case is missing, record the coverage gap and find a verified source.

Collect exact sentences from Taiwanese websites, news, and public posts. Record the source URL, retrieval date, original excerpt, expected meaning, and annotation rationale. Preserve the author's whitespace and punctuation. Verify the text on the source page or in its HTML; search snippets alone are insufficient.

Pass each excerpt through the production detector and context extractor. Save the model input separately from the original excerpt. Context boundaries, neighboring inline text, and author-written spaces can determine whether a candidate reaches the model. Keep excluded inputs as routing checks, separate from classifier accuracy. Keep disputed meanings in an unscored review set until their labels are resolved.

**Done when:** every scored case has verified provenance, a defensible label, and the exact input the production model would receive. Each supported meaning and preserve-output behavior has coverage, or an explicit coverage gap.

### 2. Separate examples, development, and holdout

Use three roles: prompt examples teach the task, development cases guide changes, and holdouts evaluate a frozen candidate. Keep source pages disjoint across roles and record shared entities or closely related publishers. Repeated mentions of one brand test that brand, not arbitrary name recognition.

When a development sentence becomes a prompt example, move it out of accuracy scoring before the next run. When a holdout failure guides a change, move that case into development and obtain a fresh holdout. Synthetic fixtures are limited to deterministic implementation tests; never use them as model inputs or evidence for prompt selection or no-regression gates.

**Done when:** role assignments are recorded before inference, prompt examples are excluded from accuracy, and source overlap has been checked. This follows [Chrome's guidance on evaluation contamination](https://developer.chrome.com/docs/ai/evals/run).

### 3. Measure a baseline and diagnose failures

For an existing shape, keep the shipping prompt as the control. For a new shape, start with a concise instruction and explicit label definitions. Measure the baseline before choosing a change.

Record raw answers, errors, misses by meaning, and unstable cases. For representative failures, run separate diagnostic conversations: ask the model to interpret or translate the original sentence, identify the target symbol, and explain which label fits. Use these answers to generate falsifiable hypotheses. Explanations after a wrong answer may be rationalizations.

**Done when:** a saved baseline reproduces the failure and each proposed change has a prediction that an isolated experiment can confirm or reject.

### 4. Test one hypothesis at a time

Change one dimension per comparison: instruction language, semantic definitions, context presentation, examples, text-menu order, schema order, or output options. Preserve immutable variant IDs and rendered prompts. Distinguish improvements from regressions in other meanings and preserve-output controls.

If two or three similar wording changes leave the same failures, investigate a different cause. Vocabulary or domain misunderstandings may benefit from a few sourced examples. Routing errors belong in the detector or extractor. Ambiguous annotations require revisiting the expected meaning. Add examples only after identifying what they need to teach.

**Done when:** the selected change improves the declared development checks without a control regression. Retain the baseline when the experiment shows no benefit.

### 5. Freeze and confirm

Freeze the candidate prompt, response schema, and corpus before confirmation. Match production session behavior and sampling options. Use fresh base sessions per run/order and fresh clones per candidate; keep diagnostic history out of accuracy runs. Record browser/model availability and runtime details needed to reproduce the result, with machine-local identifiers kept out of publishable reports.

Declare the confirmation runs, case orders, and attempts per case before inference. A case passes only if every required attempt returns the correct label without an error. Report distinct case counts separately from repeated attempts. Then evaluate the frozen candidate and baseline on the same untouched holdouts, including meanings missing from development coverage. Record both before using either result to guide further tuning.

**Done when:** the declared confirmation and holdout gates pass, every error counts as a failure, and remaining coverage limits are stated. Repetition establishes stability on those inputs; broader sources establish coverage.

### 6. Verify the shipping path

Check that the built extension uses the measured system prompt, rendered questions, enum, and API options. Reload the extension and send classification requests through its actual message entry point. Apply the returned labels through production spacing and edits, then compare final text. Count cached responses separately from fresh inference.

**Done when:** the built runtime returns the intended labels and final spacing for the evaluation cases, and relevant deterministic checks pass. Report label accuracy and spacing accuracy separately: different labels can produce the same edit.

## Automated execution

The agent verifies sources, annotates cases, and chooses hypotheses. The runner handles repeatable model calls and raw result export. Keep those responsibilities separate so source judgments and model outcomes can be reviewed independently.

Connect to the intended extension worker through the configured browser session. Verify the profile, worker, model availability, and current API options before inference. Read machine-specific connection settings from ignored local configuration; keep them out of tracked reports.

For each run, save the exact source cases, rendered instructions, questions, labels/schema, runtime details, and execution order. Create fresh base sessions for the declared runs/orders and fresh clones per case. Keep diagnostic history out of accuracy sessions. Record raw answers, errors, missing attempts, and timings. An incomplete run cannot pass a gate.

Compare baseline and candidate on the same cases and report per-case changes. Protect baseline-correct cases; aggregate improvements cannot offset a new failure. Follow the experiment's declared gate for unstable cases, confirmation, holdout, and final spacing. A successful command exit is not itself evidence of a successful experiment.

When a candidate qualifies, rebuild and load the intended extension checkout. Verify the actual message entry point and production edits on sourced text. Distinguish fresh inference from cached answers. Close temporary inspection pages and disconnect when the work is complete.

## Starting an independent round

Preserve verified source records and their exposure history. Remove previous candidate prompts, diagnostic answers, scores, and conclusions from the new round's working context. Do not retrieve them from Git history, temporary reports, old agent sessions, or memories to select candidates. Use current production code as the baseline and new real-text measurements as evidence.

Reusing a development case does not make it unseen. An exposed holdout must be reassigned before it can guide tuning. Record related source pages and shared entities, and retain coverage gaps when verified real examples are unavailable.

## References

[Chrome's evaluation guidance](https://developer.chrome.com/docs/ai/evals/run) describes evaluation layers, contamination from prompt examples, and final evaluation on unseen cases. Its suggestions to generate synthetic data do not apply to this workflow.

Check the current [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api) before changing session or schema options. [Structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) constrains format; semantic correctness requires separate evaluation.
