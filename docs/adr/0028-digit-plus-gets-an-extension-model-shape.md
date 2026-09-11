# A digit-plus gets an extension model shape

[ADR 0019](0019-plus-after-a-word-reads-as-a-separator.md) left `Switch 2+瑪利歐賽車世界同捆組` unresolved because `Python 3+的版本` has the same shape. Add a `digit-plus` ambiguous shape under the extension's AI spacing toggle, using the classifier and late fixes from [ADR 0017](0017-ai-spacing-policy-stays-in-the-extension.md).

Keep the measured `v1-zh` prompt unchanged. It classifies the plus as `conjunction`, `lower-bound`, or `unsure`. Only `conjunction` inserts a space before the plus: `Switch 2+ 瑪利歐賽車世界同捆組` becomes `Switch 2 + 瑪利歐賽車世界同捆組`. Other labels, invalid answers, failed requests, an unavailable model, or disabled AI spacing retain core output.

The detector reuses core's `\b([0-9]+)(\+)([CJK])` pattern on original text within one node. The settled text must still have `digit+ CJK`, with exactly one ASCII space after the plus. Author-spaced forms and candidates split across nodes do not qualify. Decimals qualify through their final digit run; `商品數量2+` has no trailing CJK contact and sends no request.

The extracted model context must contain exactly one ASCII `+`, including any neighboring inline text. The existing reader bounds context to 120 UTF-16 units per side and stops at `。！？；`; commas do not split it. Two pluses in that context skip classification, including `++`. Separate sentence contexts remain eligible. The prompt's ordinal and left/right fields stay because the shorter single-plus prompt measured worse.

Product-aware prompts broke the original Switch bundle example, so this shape adds no product labels or name detector. `S24+`, `DS224+`, and `S7+` fail the whole-digit boundary. Their existing separator output remains; the name-suffix policy in [ADR 0024](0024-name-suffixes-belong-to-core-spacing.md) is unchanged. Arithmetic, full-width `＋`, and Latin-only joins are outside this shape.

The shared package keeps its digit suffix and unresolved Switch test. Deterministic tests cover detection, exact prompt bytes, worker routing, fallback, inline context, and combined hyphen/plus late fixes. They do not establish model accuracy.
