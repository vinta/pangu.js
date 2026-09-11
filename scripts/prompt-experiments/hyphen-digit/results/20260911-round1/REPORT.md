# Hyphen-digit real-text round 1

Adopt `real-r1-semantic` as `v27-zh`. Screening, both confirmation runs, holdout, and shipping integration passed every declared gate. The production change adds one semantic instruction to the system prompt. Detector behavior, context extraction, questions, ordered labels, schema, and sampling remain unchanged.

## Results

A passing target requires every scheduled attempt to have the right label, individual-target spacing, and combined excerpt spacing. Correct labels alone do not qualify a target.

| Phase | Attempts per target per prompt | Shipping labels | Candidate labels | Shipping full gate | Candidate full gate | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| New baseline | 2 | 15/21 | — | 15/21 | — | Six stable label failures |
| Matched screening | 2 | 15/21 | 19/21 | 15/21 | 17/21 | Pass |
| Confirmation run 1 | 6 | 15/21 | 19/21 | 15/21 | 17/21 | Pass |
| Confirmation run 2 | 6 | 15/21 | 19/21 | 15/21 | 17/21 | Pass |
| Holdout run 1 | 6 | 8/8 | 8/8 | 8/8 | 8/8 | Pass |
| Holdout run 2 | 6 | 8/8 | 8/8 | 8/8 | 8/8 | Pass |
| Final integration, development | 1 fresh | 15/21 | 19/21 | 15/21 | 17/21 | Pass |
| Final integration, holdout | 1 fresh | 8/8 | 8/8 | 8/8 | 8/8 | Pass |

The same two targets improved in both confirmation runs: `real-development-blocktempo-19` and `macromicro-labor-15-64`. Each passed all 12 candidate attempts and failed all 12 shipping attempts. No baseline-passing target regressed. No scored answer was unstable, missing, skipped, or errored.

Two course-stage labels also improved, but their shared original excerpt still contains a wrong first target. The full-spacing gate therefore counts neither stage as a passing case. This is why label correctness reaches 19/21 while the full gate reaches 17/21.

## Per-target confirmation and holdout checks

Counts below combine both fresh runs: 12 scheduled attempts per target per prompt. The JSON gates retain each run separately. “Target” is individual-target spacing; “full” is combined excerpt spacing. A full case pass also requires the label and target checks.

### Development

| Target ID | Shipping labels | Candidate labels | Shipping target | Candidate target | Shipping full | Candidate full | Full case pass: shipping → candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `real-development-01` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-02` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-03` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-04` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-05` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-06` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-07` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-08` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-09` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-10` | 0/12 | 0/12 | 0/12 | 0/12 | 0/12 | 0/12 | fail → fail |
| `real-development-10-stage-1` | 0/12 | 12/12 | 0/12 | 12/12 | 0/12 | 0/12 | fail → fail |
| `real-development-10-stage-2` | 0/12 | 12/12 | 0/12 | 12/12 | 0/12 | 0/12 | fail → fail |
| `real-development-11` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-12` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-blocktempo-19` | 0/12 | 12/12 | 0/12 | 12/12 | 0/12 | 12/12 | fail → pass |
| `real-development-blocktempo-18` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-development-blocktempo-17` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `books-4-percent-ebook` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `macromicro-labor-15-64` | 0/12 | 12/12 | 0/12 | 12/12 | 0/12 | 12/12 | fail → pass |
| `macromicro-global-labor-25-54` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `macromicro-us-cds-5y` | 0/12 | 0/12 | 0/12 | 0/12 | 0/12 | 0/12 | fail → fail |

### Holdout

| Target ID | Shipping labels | Candidate labels | Shipping target | Candidate target | Shipping full | Candidate full | Full case pass: shipping → candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `real-holdout-01` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-02` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-03` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-04` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-05` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-06` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-07` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |
| `real-holdout-08` | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | pass → pass |

## Source verification and separation

| Role | Targets | Distinct sentence contexts | Original excerpts | Canonical pages | Publishers |
| --- | ---: | ---: | ---: | ---: | ---: |
| Development | 21 | 19 | 18 | 9 | 8 |
| Holdout | 8 | 8 | 8 | 6 | 6 |
| Combined | 29 | 27 | 26 | 15 | 13 |

Every source page was opened in the configured Chrome Beta profile with Pangu confirmed off before navigation. Fresh HTTP responses verified 22 of the original 27 targets. Books.com.tw and MacroMicro returned 403 responses; Navigate failed certificate verification. All three passed the required Chrome Beta fallback, including DOM text, source HTML, computed styles, and production input checks. Certificate verification was not bypassed.

The spacing audit found two unannotated eligible targets in the retained course paragraph. Both were added from its unchanged source text, with their exact UTF-16 offsets. Replay then verified all 29 inputs, rule outputs, target offsets, individual edits, combined edits, final DOM text, and the real authored-space exclusion before inference.

Canonical pages are disjoint across roles. XQ declares a canonical URL different from the requested URL; that mapping is retained. Duplicate DOM renderings remain in source evidence and count once. PTT occurs in both roles on separate pages. XQ supplies several return cases, Blocktempo supplies the article identifiers, and MacroMicro supplies age/tenor labels. These are finite-source checks, not universal accuracy estimates.

No candidate used prompt examples. Prior exposure was preserved. The two new course-stage records conservatively inherit their paragraph's exposure flags, rather than claiming separate historical measurements. All eight holdouts were evaluated in this round and are no longer never-inferred inputs for future work.

See [HTTP evidence](source-http/manifest.json), [live browser evidence](source-browser/), [production replay](production-replay.txt), and the [frozen protocol](protocol.json).

## Baseline, diagnostics, and candidate

The control was frozen at commit `9e552c29e8593cd4c70ec40a1c7a16f506dd2bcb`, with prompt version `v26-zh`. [Baseline hashes and bytes](baseline-lock.json) cover the prompt, detector, context extractor, model options, messages, edits, and relevant core code. No prior experiment prompts, answers, scores, or conclusions were retrieved from history, temporary reports, sessions, or memories.

The new baseline's six label failures were course stages, an article identifier, an age-group label, and a five-year tenor. [Isolated diagnostics](diagnostics/1-shipping.json) asked the model to interpret the unchanged text, locate the target, and explain its label. It often understood the positive age, tenor, or identifier but still treated an adjacent hyphen-digit pattern as a negative number. Those explanations are diagnostic clues, not independent gold labels.

The [candidate record](candidate-real-r1-semantic.json) froze the hypothesis, predicted effects, system bytes, and all development questions before screening. It adds a requirement to establish a below-zero meaning before choosing `signed-number`. It was the only candidate screened and the only candidate confirmed. No wording changes followed holdout feedback.

The candidate registry now stores the identical frozen system as a literal. This prevents the instruction from being appended twice after shipping changes. Its rendered system and question bytes match the evaluated candidate.

## Runtime and execution

Chrome Beta was `154.0.8037.17`; Node was `v24.18.1`. The installed Nano component was `nano_v3_gpu_component` version `2025.8.8.1141`, with model manifest `1.20260810.11`. Availability was `available`; a fresh session reported `temperature: 0` and `topK: 1`.

Each evaluation used corpus order and the recorded seed-1 shuffle, a fresh base session per prompt/order, and a fresh clone per target/attempt. Calls ran serially. The second confirmation and holdout runs reversed prompt order. All four holdout artifacts were saved before inspection. Classification used production's language declarations and automatic schema handling unchanged.

There were 822 scored evaluation answers, five isolated diagnostic classifications, and 15 diagnostic follow-ups. Repeated answers are stability checks, not additional source cases. Raw answers, errors, timings, actual orders, prompts, and constraints remain in the phase directories.

## Shipping integration and recovery

The original installed extension pointed to another checkout. This round built and loaded the intended current checkout, verified all installed JavaScript modules against its generated files, and exercised `chrome.runtime.sendMessage` through the actual service-worker listener.

The first baseline integration completed. Candidate integration then timed out while Chrome awaited debugging consent, before sending any model request. Automatic approval review rejected the consent action; shipping was restored and the candidate extension disabled. After explicit user approval, the entire baseline/candidate integration comparison was repeated with fresh workers. The [failed artifact](integration-candidate.json) and [interim decision](decision.json) remain unchanged; the [final decision](final-decision.json) supersedes that interim state.

The successful retry made 29 fresh requests per variant and preserved all 23 baseline-passing cases plus both stable improvements. Every returned label matched the frozen evaluation behavior. Individual edits, combined edits, and final DOM text used production code. Authored whitespace remained unchanged. Each variant's separate repeated real request hit the cache and was excluded from scores. See the [integration gate](integration-gate.json), [baseline retry](integration-retry-baseline.json), and [candidate retry](integration-retry-candidate.json).

The installed current-checkout extension now uses `v27-zh`. The original extension remains disabled. Machine-specific connection settings stay in ignored local configuration.

## Remaining failures and coverage gaps

- `real-development-10`: the first course-stage marker is still labeled `signed-number`.
- `macromicro-us-cds-5y`: the five-year tenor is still labeled `signed-number`.
- The two later course-stage targets have correct labels but fail combined excerpt spacing because the first course-stage target remains wrong.
- No confidently annotatable real `unsure` passage was found. Filenames were covered only by holdouts. Targeted searches did not produce another verified eligible development filename. No text was fabricated to fill these gaps.

## Verification and retained artifacts

The extension build, 44 focused runner/gate/shape tests, typecheck, and whitespace checks passed. Final verification corrected the mock example-page test to use its canonical source URL after fresh metadata added that mapping; the production gate and measured scores were unchanged.

Run `node scripts/prompt-experiments/hyphen-digit/results/20260911-round1/verify-lock.mjs --integrated` to verify the baseline archive, unchanged runtime files, frozen corpus/evidence, and exact qualified shipping prompt. [Artifact hashes](artifacts-sha256.json) retain the final evidence inventory.

Current API checks used the official [Chrome extension Prompt API documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api) and [Playwright CDP documentation](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp). Local production code determined the actual sampling, language, schema, and cache behavior.
