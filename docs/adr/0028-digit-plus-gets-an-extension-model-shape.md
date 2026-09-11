# A digit-plus gets an extension model shape

[ADR 0019](0019-plus-after-a-word-reads-as-a-separator.md) left `Switch 2+瑪利歐賽車世界同捆組` unresolved because `Python 3+的版本` has the same shape. Add a `digit-plus` ambiguous shape under the extension's AI spacing toggle, using the classifier and late fixes from [ADR 0017](0017-ai-spacing-policy-stays-in-the-extension.md).

Use English classification instructions with sourced Chinese examples in `v18-en-real-examples`. It classifies the plus as `conjunction`, `lower-bound`, or `unsure`. Only `conjunction` inserts a space before the plus: `煮過頭 2+ 資料片超棒` becomes `煮過頭 2 + 資料片超棒`. Other labels, invalid answers, failed requests, an unavailable model, or disabled AI spacing retain core output.

The detector reuses core's `\b([0-9]+)(\+)([CJK])` pattern on original text within one node. The settled text must still have `digit+ CJK`, with exactly one ASCII space after the plus. Author-spaced forms and candidates split across nodes do not qualify. Decimals qualify through their final digit run; `商品數量2+` has no trailing CJK contact and sends no request.

The extracted model context must contain exactly one ASCII `+`, including any neighboring inline text. The existing reader bounds context to 120 UTF-16 units per side and stops at `。！？；`; commas do not split it. Two pluses in that context skip classification, including `++`. Separate sentence contexts remain eligible. The prompt receives the whole extracted sentence once; separate left/right fields are unnecessary for a single plus.

The prompt examples come from [PTT](https://www.ptt.cc/bbs/NSwitch/M.1610033538.A.1C4.html), [TVBS](https://health.tvbs.com.tw/nutrition/340731), and [50+](https://event.fiftyplus.com.tw/funyouth2023/market.html). They distinguish a game and its expansion, an age threshold, and a brand name. Brand-name pluses use `unsure`; this shape adds no product label or name detector. `S24+`, `DS224+`, and `S7+` fail the whole-digit boundary. Their existing separator output remains; the name-suffix policy in [ADR 0024](0024-name-suffixes-belong-to-core-spacing.md) is unchanged. Arithmetic, full-width `＋`, and Latin-only joins are outside this shape.

The shared package keeps its digit suffix and unresolved Switch test. Deterministic tests cover detection, exact prompt bytes, worker routing, fallback, inline context, and combined hyphen/plus late fixes. They do not establish model accuracy.
