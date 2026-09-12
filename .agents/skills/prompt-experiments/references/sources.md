# Source collection

For new records, collect exact sentences from Taiwanese websites, news, and public posts. Verify the text on the source page or in its HTML; search snippets alone are insufficient. Populate the fields below from verified text and production replay.

Use the connected Chrome Beta session to collect new sources and inspect their rendered pages and source HTML. Before loading sources, disable Pangu and verify its switch is off. Reload pages opened with Pangu enabled before capture. After collection, re-enable Pangu and verify its service worker before inference. Keep new or changed records out of scoring until verified. A later website change does not invalidate an intact historical snapshot; retain its capture date and state which version is being evaluated.

Before capture, apply [artifact rules](artifacts.md) for public fixtures and private raw captures.

Use the collection and replay commands in the [command reference](../../../../scripts/prompt-experiments/README.md). Collection verifies source text; you still judge meaning, role separation, exposure, and completeness of target annotations.

## New corpus record

Use a JSON object with `role` (`development` or `holdout`), `enums`, and `cases`. Copy label definitions from current production: Set `enums.hyphen` to the exact ordered `hyphenDigitPrompt.candidateLabels` and each case's `enum` to `hyphen`. Choose a unique `id` for each target. The existing [development records](../../../../scripts/prompt-experiments/hyphen-digit/corpus/development.json) show the shape without loading model answers; read them only when a concrete example is needed.

| Fields | Required content |
| --- | --- |
| `id`, `enum`, `type`, `expected_label` | Unique target ID, enum key, semantic category, and defensible label |
| `source`, `canonical_source`, `retrieved_at`, `annotation_rationale` | Verified public page URL, canonical page, capture date, and why the label fits |
| `original_excerpt`, `original_at` | Exact authored text node and target's JavaScript UTF-16 offset |
| `source_html`, `source_css`, `source_surface` | Minimal faithful fixture, required styles (empty string is valid), and `document-title` when applicable |
| `input`, `at` | Exact production sentence and target offset after context extraction |
| `settled`, `settled_index` | Rule output and target offset found by the production detector |
| `expected_target_spacing`, `expected_spacing` | Production edits for this target alone and every eligible target combined |
| `prior_exposure`, `role_note` | Source/label/inference/example exposure and role rationale |
| `source_verification`, `routing_status` | Nonempty verification evidence and production routing descriptions |
| `fresh_verification` | Public source-record reference/date/method |

Generate UTF-16 offsets with JavaScript string indexing, not code-point counting. Done when the collector/replay checks pass, all eligible targets are annotated, and public evidence references resolve; offline runner validation checks structure only.
