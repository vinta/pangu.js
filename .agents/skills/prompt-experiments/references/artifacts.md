# Artifact rules

Read before collecting or writing experiment data, including settings, debugging output, and failed runs. Choose fields before writing. Normal public output must need no later sanitization step.

## Destinations

Keep helpers and public evidence under `scripts/prompt-experiments/`. Use a new directory for each invocation. Keep personal connection settings in `scripts/prompt-experiments/.env.local`; [setup](setup.md) explains discovery and explicit loading.

Before a private write, run `git check-ignore -- <destination>` and `git ls-files -- <destination>` from the repository root. Proceed only when the first confirms an ignore rule and the second returns no tracked path. Check existing files inside directories too. Add a repository ignore rule for a chosen raw-output directory before using it; global ignores are not portable. Never overwrite existing run output.

| Public | Local only |
| --- | --- |
| Helpers, prompts, diagnostics, gates, tests, and usage instructions | Connection values, browser profiles, credentials |
| Verified excerpts, minimal HTML/CSS fixtures, labels, rationale, source URLs, capture dates, exposure | Full pages, headers, unrelated page content, authenticated material |
| Every scored outcome, relevant diagnostic exchange, error, decision, remaining failure | Unfiltered terminal output, traces, screenshots, agent conversations |
| Browser/Node/model versions, sampling, code revisions, fixture hashes | Full environment inventories, session/request identifiers, machine paths |

## Evidence integrity

Explicitly select permitted public fields in collection and result writers, including nested objects. Preserve raw model answers and relevant errors while excluding operational identifiers and unrelated content. Keep failed comparisons that support a decision. Selecting fields must never select favorable outcomes.

Preserve exact authored source text and model inputs. A fixture must reproduce production inputs, UTF-16 target offsets, routing, individual edits, combined spacing, and authored-space exclusions. Retain only required HTML structure and computed styles; give sanitized bytes their own hash. Exclude sensitive cases or collect another verified source; do not alter scored text for privacy.

Validate public paths and hashes against public files alone. Preserve original measurement hashes as provenance when bytes change; never claim cleaned bytes were measured historically. Review embedded HTML, corpus copies, per-run case copies, result metadata, and operational records. A secret scan does not establish privacy.

Publish completed holdouts only as historical evidence. Keep active holdouts outside tuning context; an ignore rule alone does not prevent exposure. For an independent round, read source records and exposure without opening old answers, candidate explanations, or reports.

Done when every output has an appropriate destination, every public field is needed for inspection or replay, public references/hashes resolve, and exact scored inputs/outputs remain intact.

## Round record

Before inference, create a new round's `protocol.json` with baseline prompt bytes, question builder, label order/schema, sampling/languages/API options, detector/context/edit revisions and SHA-256 hashes, corpus/fixture hashes, source roles/exposure, case orders/shuffle seed, scheduled phases, and the skill's acceptance-gates path. Recheck those frozen values before each phase. Save rendered questions as well as code hashes.

Keep `runtime.json` for observed versions/capabilities, a hypothesis record for the parent variant/prediction/isolated change, and a new directory for every invocation. Store baseline/candidate results together with per-case paired gates and the decision. Repetition counts and phase criteria are defined only in the skill. New helpers must select the same public fields as the existing writers.

Before adopting a recorded-round script, inspect its fixed paths, IDs, counts, locks, and prompt lookups without loading its old answers. Adapt only what the new round needs; current production code and newly frozen records supply the replacements. The [command reference](../../../../scripts/prompt-experiments/README.md) identifies reusable gate functions and required integration adaptations.
