# Improving prompts for ambiguous spacing shapes

Date: 2026-09-11. Evaluation workflow for experiments using verified real source text.

Use this workflow when adding a model-assisted shape, investigating a classification failure, or comparing a replacement prompt for an existing shape. Choose candidate changes from the current baseline and diagnostics.

## Workflow

### 1. Establish the real input contract

NEVER use fabricated text for experiments or prompt improvement. This applies to prompt examples, diagnostic probes, development cases, confirmation runs, and holdouts. Do not invent sentences, substitute names or numbers in real excerpts, or append artificial context. If a real case is missing, record the coverage gap and find a verified source.

Reuse verified source snapshots by default. Check recorded hashes for unchanged text, HTML, styles, and provenance, then replay production inputs and spacing locally. A new prompt experiment does not require downloading every source again.

Fetch sources only for new or changed records, missing or disputed evidence, or experiments that require current live-page behavior. For new records, collect exact sentences from Taiwanese websites, news, and public posts. Record the source URL, retrieval date, original excerpt, expected meaning, and annotation rationale. Preserve the author's whitespace and punctuation. Verify the text on the source page or in its HTML; search snippets alone are insufficient. Keep source HTML, relevant styles, original and extracted target offsets in JavaScript UTF-16 units, and expected production spacing.

If a fetch fails or is blocked, inspect the rendered page and source HTML in the configured Chrome Beta profile. Before loading sources, disable Pangu and verify its switch is off. Reload pages opened with Pangu enabled before capture. Keep it disabled until collection ends. Keep new or changed records out of scoring until verified. A later website change does not invalidate an intact historical snapshot; retain its capture date and state which version is being evaluated.

Replay each snapshot through the production detector and context extractor before inference. If those components change, regenerate production inputs and spacing expectations from the saved source context; revisit the live page only where that context is insufficient. Save the model input separately from the original excerpt. Context boundaries, neighboring inline text, and author-written spaces can determine whether a candidate reaches the model. Keep excluded inputs as routing checks, separate from classifier accuracy. Keep disputed meanings in an unscored review set until their labels are resolved. Gold `unsure` requires a defensible explanation that the exact production context is insufficient. Model explanations and translations remain diagnostic outputs; never turn them into corpus examples.

Annotate every eligible target in multi-target excerpts before inference. Verify both each target's edit on frozen rule output and the combined edits through production text application. Bind `settled` text and `settled_index` to that path. Keep authored-space exclusions as routing checks.

**Done when:** every scored case has verified provenance, a defensible label, and the exact input the production model would receive. Each supported meaning and preserve-output behavior has coverage, or an explicit coverage gap.

### 2. Separate examples, development, and holdout

Use three roles: prompt examples teach the task, development cases guide changes, and holdouts evaluate a frozen candidate. Split by canonical source page, recording redirects, duplicate passages, syndication, and related publishers. Keep pages disjoint across roles. Repeated mentions of one brand test that brand, not arbitrary name recognition.

When a development case becomes a prompt example, exclude its entire source page from scoring and rerun the baseline on the reduced set. If holdout text, labels, or answers guide tuning, end the round, move the affected pages to development, and obtain fresh holdouts. Record prior inference and example exposure; uncertain exposure belongs in development. Synthetic fixtures are limited to deterministic implementation tests; never use them as model inputs or evidence for prompt selection or no-regression gates.

**Done when:** role assignments are recorded before inference, prompt examples are excluded from accuracy, and source overlap has been checked. This follows [Chrome's guidance on evaluation contamination](https://developer.chrome.com/docs/ai/evals/run).

### 3. Measure a baseline and diagnose failures

For an existing shape, keep the shipping prompt as the control. For a new shape, start with a concise instruction and explicit label definitions. Freeze the baseline bytes, question builder, labels/order, schema, detector, context extraction, and sampling before inference. Record the commit and file hashes; recheck them before each phase. Keep these controls fixed during comparisons. A detector or extraction change requires a new baseline.

Measure a fresh shipping baseline in each new round, even when source snapshots are reused. Use corpus order and a recorded seeded shuffle, using 1 attempt per target per order. If no development failures remain, collect more verified coverage or finish without a prompt change.

Record raw answers, errors, misses by meaning, and unstable cases. For representative failures, run separate diagnostic conversations: ask the model to interpret or translate the original sentence, identify the target symbol, and explain which label fits. Use these answers to generate falsifiable hypotheses. Explanations after a wrong answer may be rationalizations.

**Done when:** a saved baseline reproduces the failure and each proposed change has a prediction that an isolated experiment can confirm or reject.

### 4. Test one hypothesis at a time

Write the hypothesis, predicted effect, parent variant, and isolated change before inference. Change one prompt dimension per comparison: instruction language, semantic definitions, target identification using unchanged source text, or sourced examples. Freeze variant IDs and rendered bytes. Run matched shipping and candidate comparisons on the same scored records, orders, and attempt counts. Prefer the smaller prompt when qualifying candidates behave equally.

If two or three similar wording changes leave the same failures, investigate a different cause. Vocabulary or domain misunderstandings may benefit from a few sourced examples. Routing errors belong in the detector or extractor. Ambiguous annotations require revisiting the expected meaning. Add examples only after identifying what they need to teach.

**Done when:** the selected change improves the declared development checks without a control regression. Retain the baseline when the experiment shows no benefit.

### 5. Freeze and confirm

Freeze one candidate, examples, source roles, questions, schema, sampling, and spacing expectations. Run 2 fresh confirmation comparisons, each with 2 case orders and 3 attempts per target per order. Run both prompts and reverse their execution order in the second comparison. This gives 12 answers per target per prompt.

Only after confirmation passes, evaluate that candidate and shipping on holdout with the same 2-run protocol. Save both sides of both runs before inspecting answers. Holdout answers must not enter diagnostics or tuning in this round.

**Done when:** the declared confirmation and holdout gates pass, every error counts as a failure, and remaining coverage limits are stated. Repetition establishes stability on those inputs; broader sources establish coverage.

### 6. Verify the shipping path

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

## Automated execution

The agent verifies sources, annotates cases, and chooses hypotheses. The runner handles serial model calls and immutable result export. Before inference, finish snapshot integrity checks, any source verification required by step 1, local production input/spacing replay, and runner checks. Test paired gates with retained real inputs and mocked answers: regression, stable improvement, baseline instability, missing attempts, and errors.

Verify the configured Chrome Beta profile, intended extension worker, model availability, and current production options. Record actual browser/Node/model details. Read local connection settings from ignored configuration and keep machine-local identifiers out of tracked reports.

Use fresh base sessions per prompt/order and fresh clones per target/attempt. Match production sampling, language declarations, and schema handling. Keep diagnostics isolated. Save raw answers, errors, timings, and execution order in a new directory per invocation.

Keep one frozen protocol, verified source records, candidate definitions, raw outputs, per-case gates, and a report for each round. Redact session-cookie values from retained HTTP headers; they are not source-text evidence. Close temporary inspection pages and disconnect when done.

## Starting an independent round

Start with this workflow, current production code, and verified source snapshots with their exposure history. Verify source hashes without reading prior reports, diagnostics, or model outputs. Remove previous candidate prompts, diagnostic answers, scores, and conclusions from the new round's working context. Do not retrieve them from Git history, temporary reports, old agent sessions, or memories to select candidates. Use current production code as the baseline and new real-text measurements as evidence.

Reusing a development case does not make it unseen. Obtain fresh holdouts for a new qualification round when the previous holdouts have been evaluated. An exposed holdout must be reassigned before it can guide tuning. Record related source pages and shared entities, and retain coverage gaps when verified real examples are unavailable.

## References

[Chrome's evaluation guidance](https://developer.chrome.com/docs/ai/evals/run) describes evaluation layers, contamination from prompt examples, and final evaluation on unseen cases. Its suggestions to generate synthetic data do not apply to this workflow.

Check the current [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api) before changing session or schema options. [Structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) constrains format; semantic correctness requires separate evaluation.
