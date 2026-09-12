# Source collection

For new records, collect exact sentences from Taiwanese websites, news, and public posts. Verify the text on the source page or in its HTML; search snippets alone are insufficient. Build corpus records from verified text and production replay.

Use the connected Chrome Beta session to collect new sources and inspect their rendered pages and source HTML. Before loading sources, disable Pangu and verify its switch is off. Reload pages opened with Pangu enabled before capture. After collection, re-enable Pangu and verify its service worker before inference. Keep new or changed records out of scoring until verified. A later website change does not invalidate an intact historical snapshot; retain its capture date and state which version is being evaluated.

Before capture, apply [artifact rules](artifacts.md) for public fixtures and private raw captures.

Use the [command reference](../../../../scripts/prompt-experiments/README.md) to find applicable collection and replay helpers. Read the selected shape's production prompt, detector, context extractor, and corpus loader for its ordered labels, input contract, and required fields. Verify production inputs and spacing before inference, including checks the loader does not enforce.

## New corpus record

Use the schema required by the selected loader. Record enough evidence to reproduce and judge each target:

- Public source and canonical URLs, capture date, exact authored context, and verification method.
- A minimal faithful HTML/style fixture and its source surface, such as a document title or rendered text.
- The production sentence, target offsets before and after rule spacing, and routing outcome.
- The expected label and its rationale, individual-target spacing, and combined-excerpt spacing.

Merge verified development records into the shape's shared corpus. Reuse the existing ID for the same source target; assign a new ID to a new target and check annotation conflicts. Apply the exposure and source-page rules in [role separation](../SKILL.md#2-separate-examples-development-and-holdout). Keep prompt examples and unresolved review records outside the scored selection. Read existing development records only when a concrete example is needed; older records can have evidence gaps.

Generate UTF-16 offsets with JavaScript string indexing, not code-point counting. Done when source verification and the selected shape’s production replay pass, all eligible targets are annotated, necessary provenance is retained in the corpus, and any public references resolve; offline runner validation checks structure only.
