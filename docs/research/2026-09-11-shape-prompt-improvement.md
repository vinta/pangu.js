# Improving prompts for ambiguous spacing shapes

Date: 2026-09-11. Evidence: digit-plus experiments with Gemini Nano in Chrome Beta 154.0.8037.17. Treat the measured results as a runtime snapshot.

Use this workflow when adding a model-assisted shape, investigating a classification failure, or comparing a replacement prompt for an existing shape. The transferable result is the evaluation method; English instructions and few-shot examples remain hypotheses to test for each shape.

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

For an existing shape, keep the shipping prompt as the control. For a new shape, start with a concise instruction and explicit label definitions. Test English instructions while preserving the original Chinese input as an early comparison; instruction language and response-label language are separate variables.

Record raw answers, errors, misses by meaning, and unstable cases. For representative failures, run separate diagnostic conversations: ask the model to interpret or translate the original sentence, identify the target symbol, and explain which label fits. Use these answers to generate falsifiable hypotheses. Explanations after a wrong answer may be rationalizations.

**Done when:** a saved baseline reproduces the failure and each proposed change has a prediction that an isolated experiment can confirm or reject.

### 4. Test one hypothesis at a time

Change one dimension per comparison: instruction language, semantic definitions, context presentation, examples, text-menu order, schema order, or output options. Preserve immutable variant IDs and rendered prompts. Distinguish improvements from regressions in other meanings and preserve-output controls.

If two or three similar wording changes leave the same failures, investigate a different cause. Vocabulary or domain misunderstandings may benefit from a few sourced examples. Routing errors belong in the detector or extractor. Ambiguous annotations require revisiting the expected meaning. Add examples only after identifying what they need to teach.

**Done when:** the selected change improves the declared development checks without a control regression. Retain the baseline when the experiment shows no benefit.

### 5. Freeze and confirm

Freeze the candidate prompt, response schema, and corpus before confirmation. Match production session behavior and sampling options. Use fresh base sessions per run/order and fresh clones per candidate; keep diagnostic history out of accuracy runs. Record browser/model availability and runtime details needed to reproduce the result, with machine-local identifiers kept out of publishable reports.

The digit-plus confirmation protocol used two fresh runs, each with two case orders and three attempts per case. A case passed only if every attempt returned the correct label. Report distinct case counts separately from repeated attempts. Then evaluate the frozen candidate and baseline on the same untouched holdouts, including meanings missing from development coverage. Record both before using either result to guide further tuning.

**Done when:** the declared confirmation and holdout gates pass, every error counts as a failure, and remaining coverage limits are stated. Repetition establishes stability on those inputs; broader sources establish coverage.

### 6. Verify the shipping path

Check that the built extension uses the measured system prompt, rendered questions, enum, and API options. Reload the extension and send classification requests through its actual message entry point. Apply the returned labels through production spacing and edits, then compare final text. Count cached responses separately from fresh inference.

**Done when:** the built runtime returns the intended labels and final spacing for the evaluation cases, and relevant deterministic checks pass. Report label accuracy and spacing accuracy separately: different labels can produce the same edit.

## Automated execution

The automation had two parts: an AI agent made the research and prompt-design decisions, while scripts handled repeatable model calls and scoring. Once browser setup and the required permissions were complete, the agent could run the improvement loop without a person entering prompts, copying answers, or starting each comparison.

### Connect the agent to the model

A Node.js script used Playwright through the Chrome DevTools Protocol to reach the installed extension's service worker. Code evaluated in that worker called Chrome's Prompt API, which ran Gemini Nano locally. The script received structured results back through the browser connection.

```text
Agent → Node.js script → Playwright → extension worker → Chrome Prompt API
  ↑                          results and scores                        ↓
  └────────────────────────────────────────────────────────────────────┘
```

Computer automation handled the browser-facing setup: selecting the intended Chrome profile, opening the extension's worker inspector when needed, and later reloading the built extension. Before inference, the script verified the target profile and extension worker and checked that the model was available in that context. Model provisioning and browser debugging permissions remained prerequisites for unattended runs.

### Automate a comparison

The agent supplied a versioned candidate prompt and annotated cases. For each comparison, the script:

1. Rendered the exact system prompt, case questions, and allowed response labels, then saved the inputs used by the run.
2. Created a fresh base model session for each candidate and execution order, with the candidate's system prompt and the chosen sampling settings.
3. Cloned that base for each case and repeat, submitted the question with a constrained response format, and collected the raw answer or error. Each clone started from the same base context, keeping earlier case answers out of later conversations.
4. Parsed answers and compared them with the expected labels. It reported failures by case and meaning, flagged inconsistent repeats, and saved raw responses, errors, timings, and execution order. Confirmation failed if any required answer was wrong.

Candidate prompts were passed directly to these experiment sessions. This let the agent compare wording, examples, and output options without rebuilding the extension for every variant. The installed worker provided the model execution context; the sweep used its own sessions rather than the shipping classifier's cached answers.

### Let results drive the next experiment

The agent read the result files and selected representative failures for a separate diagnostic run. The script asked follow-up questions about the sentence's meaning and recorded the replies. The agent used those replies to propose a hypothesis, wrote a new candidate, and launched another development comparison.

Source selection, label judgments, and the decision to change a prompt remained agent tasks. The script made those decisions measurable by executing the same checks consistently. Diagnostic conversations and prompt examples stayed outside independent accuracy scoring; a passing development run triggered confirmation and then the frozen holdout evaluation.

### Verify the installed implementation

After selection, automation rebuilt and reloaded the extension. A temporary extension page sent classification requests through the extension's actual message entry point, exercising the registered prompt and model-handling code. Returned labels were applied through production spacing and edits, and the final strings were compared with the expected output.

This last check covered the gap between a successful experimental prompt and a correctly integrated feature. Automation then closed temporary inspection pages and disconnected from the browser.

## What the digit-plus experiments established

| Experiment                                                                                    | Observation                                                                         | Interpretation                                                                                              |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Original Chinese prompt                                                                       | Passed the five synthetic acceptance cases, but only 3/10 real development cases    | Synthetic acceptance success did not predict real usage                                                     |
| English instructions, unchanged Chinese inputs                                                | 7/10 on the same real cases                                                         | Instruction language mattered on this runtime                                                               |
| Clearer English semantic definitions                                                          | 8/10 on the same cases                                                              | Definitions helped, then wording changes plateaued                                                          |
| Remove left/right fragments or reorder the Chinese text menu                                  | Remained 3/10                                                                       | The model's explanation implicating fragments was not confirmed                                             |
| English glossary, renamed labels, extra name-scope guidance, or omitted automatic schema text | Remained 8/10 against the English definition baseline                               | These changes added no measured benefit                                                                     |
| Three sourced prompt examples                                                                 | 7 other development cases passed 84/84 confirmation attempts; 6 holdouts passed 6/6 | Example fit and holdout checks passed; unseen-case improvement over the zero-shot baseline was not measured |
| Rebuilt extension                                                                             | 13/13 evaluation cases had correct labels and final spacing                         | The selected prompt worked through the shipping path                                                        |

Diagnostics described a game expansion as “data chips” and treated a media brand as an age threshold. The selected examples covered a game plus expansion from [PTT](https://www.ptt.cc/bbs/NSwitch/M.1610033538.A.1C4.html), an age threshold from [TVBS](https://health.tvbs.com.tw/nutrition/340731), and a brand name from [50+](https://event.fiftyplus.com.tw/funyouth2023/market.html). Example fit passed separately at 3/3.

The two remaining zero-shot failures became prompt examples. The seven remaining development cases already passed the English definition baseline, so their later success does not establish a few-shot gain. The zero-shot baseline was not evaluated on the holdouts.

The final development set had seven cases because three of the original ten became prompt examples. A direct 3/10-to-7/7 accuracy comparison would mix datasets. The 84 successful confirmation attempts represent seven distinct inputs. Both fresh brand holdouts concern the same `50+` brand; one publisher is independent and one shares its corporate group. Real rating/version cases were absent. These results establish neither universal brand recognition nor general Chinese-language reliability.

Valid enum responses were often consistently wrong. [Structured output](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api) constrains the response format; semantic correctness needs separate evaluation. Text-menu ordering, schema ordering, and case execution ordering are distinct experiments. This round did not establish a benefit from schema reordering or explanation-before-label output.

## Evidence and reuse

The [digit-plus prompt](../../browser-extensions/chrome/src/ai-spacing/shapes/digit-plus-prompt.ts) contains the selected instructions and examples. Its [frozen prompt tests](../../tests/extension/ai-spacing/shapes/digit-plus-prompt.test.ts) check exact bytes, not model accuracy.

[Chrome's evaluation guidance](https://developer.chrome.com/docs/ai/evals/run) supports separate evaluation layers and fresh release cases. Check the current [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api) before changing session or schema options.
