# Source collection

Fetch sources only for new or changed records, missing or disputed evidence, or experiments that require current live-page behavior. For new records, collect exact sentences from Taiwanese websites, news, and public posts. Record the source URL, retrieval date, original excerpt, expected meaning, and annotation rationale. Preserve the author's whitespace and punctuation. Verify the text on the source page or in its HTML; search snippets alone are insufficient. Keep source HTML, relevant styles, original and extracted target offsets in JavaScript UTF-16 units, and expected production spacing.

If a fetch fails or is blocked, inspect the rendered page and source HTML in the configured Chrome Beta profile. Before loading sources, disable Pangu and verify its switch is off. Reload pages opened with Pangu enabled before capture. Keep it disabled until collection ends. Keep new or changed records out of scoring until verified. A later website change does not invalidate an intact historical snapshot; retain its capture date and state which version is being evaluated.

Before the first capture, apply [artifact rules](artifacts.md). Public records retain the smallest faithful HTML/CSS fixture, exact excerpt, authored whitespace, UTF-16 offsets, production input, source URL, capture date, rationale, and exposure. Raw page captures belong only in a verified ignored, untracked location. Exclude sensitive text instead of substituting names.

Use the collection and replay commands in the [command reference](../../../../scripts/prompt-experiments/README.md). Collection verifies source text; you still judge meaning, role separation, exposure, and completeness of target annotations.

Done when each new record is verified against the source, its fixture reproduces production routing/input/spacing, all eligible targets are annotated, and its public evidence references and hashes resolve.

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
| `fresh_verification`, `fixture_sha256` | Public source-record reference/date/method and hash of the reviewed fixture |

Generate UTF-16 offsets with JavaScript string indexing, not code-point counting. Populate every field from verified text or production replay; schema examples are not permission to invent text. Keep unresolved labels in a separate review file until settled. Complete the collector/replay checks before scoring; offline runner validation checks structure only.
