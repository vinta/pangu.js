# CJK brand suffixes return as a two-entry late fix in the extension

[ADR 0013](0013-protected-word-list-removed.md) removed the protected word list, so `公視+` and `影劇館+` read as operators (`公視 + 上架`). Its condition for bringing a lexicon back was that it earn its keep against the machinery it needs. [ADR 0016](0016-hyphen-before-digit-gets-a-model-layer.md) deferred brand suffixes to a model layer, with each shape earning its own decision on its own measurements.

The measurements happened on `feature/prompt-experiments` between 2026-09-04 and 2026-09-06. Six prompt families for Gemini Nano, on a 45-target development set, top out at 33 correct with `v4-zh-product-zh`. The classifier reads every listed brand correctly and also reads the leading plus of a bundle plan as part of a name in 6 of 10 plans, which removes a correct space. Label renaming, span choice, a forced sub-judgement, a substitution test, and a known-name instruction all leave that residue. Its follow-up explanations and the literature on small instruction-tuned models agree on the cause: it answers from what it believes a plan title looks like, not from the criterion. The two brands the classifier was meant to recognise are the same two entries ADR 0013 removed.

The decision:

1. **A list, not a model, decides the plus after `公視` and `影劇館`.** The Chrome extension carries the two names. On the unspaced text it flags a listed name tight against a plus, and where the settled text shows the rules-inserted space before that plus, a late fix removes it. The space after the plus also goes when the author's next character is a slash, a closing bracket or quote, or pause and end punctuation, so `影劇館+/全選` and `公視+，` come out tight while `公視+ 上架` and `公視+ (免費平台)` keep the boundary.
2. **It is an ambiguous shape whose classifier lives on the page.** The shape reuses the hyphen sign's pipeline: candidates, labels, edits composed per text node, and core's compare-and-set write. Its classifier is the list itself, so the batch never reaches the service worker and the model is never loaded for it. It sits under the AI spacing toggle with the hyphen sign: off means no second stage at all, one story for the setting. When the worker cannot answer, only the model shapes go quiet for that page; the list keeps running, which matters because most Chrome installs have no model.
3. **The npm package stays as ADR 0013 left it.** The placeholder pass, private-use characters, and mask rules that made a two-entry list too expensive inside the rules do not return. The extension pays a regex over the unspaced text and one or two edits per match.
4. **The plus shape does not get a model.** The experiment branch stays as the record. A third `CJK+` brand, if a user reports one, is one more list entry, cheaper and safer than a classifier that is right on 21 of 24 names and wrong on 9 of 21 separators.

Consequences:

- `公視+上架了新片` renders as `公視+ 上架了新片` in the extension and as `公視 + 上架了新片` in the npm package. The FIXME in `symbol-plus-sign.test.ts` stays for the package.
- The first bundle-plan FIXME passes in the extension. The second still needs `MOD+影劇館+` read as `MOD + 影劇館+`, which means turning a plus before a listed brand into a separator; that edit is not made, as ADR 0013 accepted.
- Author-written spaces are never removed: a candidate exists only where the unspaced text had the brand tight against the plus, and the second edit checks the author's next character, not the settled one.
- The glossary stays generic: it describes ambiguous shapes, classifiers, and labels without naming this one. The shape, its list, and its `brand-suffix` label live in the code and this ADR.
