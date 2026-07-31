# The protected word list is removed, CJK brand suffixes read as operators

ADR 0006 added a protected word list of exactly two entries, `公視+` and `影劇館+`, to pin the suffix reading (`公視+ 上架`) that no shape rule can distinguish from the operator reading (`前面+後面`). The machinery cost was out of proportion to those two words: a dedicated placeholder pass with its own private-use characters (U+E020/U+E021 atom edges, U+E022 masked plus), a special edge in `PLUS_CJK_CONTACT`, two mask-restoration rules ordered against the general spacing rules, and a documented list of shapes the masking cannot support.

The decision deletes the list and its machinery entirely. A CJK brand suffix now reads as an operator like any other plus in CJK contact: `公視+上架` becomes `公視 + 上架`, `MOD影劇館+上架` becomes `MOD 影劇館 + 上架`. The affix shape rules are untouched, so `Disney+`, `Apple TV+`, `100+`, and `18+` keep the suffix reading, and `C++` stays pattern-preserved. Plus reading — the other half of ADR 0006 — survives unchanged, minus its protected-word contact edge.

Alternatives rejected:

- Keeping the list at two entries: the per-entry judgement ADR 0006 prescribed was applied to the entries it shipped with, and neither earns the machinery. Nobody reported the operator reading of `公視+` as a bug; the entries came from one telecom bundle-plan FIXME that remains open either way.
- Generalizing the machinery (ordering, arbitrary symbols) to attract more entries: that inverts the cost argument — the problem is that a lexicon this small should not own a placeholder pass at all.

## Consequences

- ADR 0003's CJK-brand-suffix FIXME reopens, now deliberately: the suffix reading for CJK brands is unsupported until a lexicon earns its keep with real reports. The bundle-plan FIXME tests in `symbol-plus-sign.test.ts` keep the aspirational `影劇館+` outputs as a record of what that would need to produce.
- `MOD+影劇館+` loses its protection-driven reading (`MOD + 影劇館+`): the first plus now reads as an `AN_PLUS_CJK` affix again, the misread ADR 0006 set out to fix. Accepted — it was only ever observed inside the same unresolved bundle-plan FIXME.
- The U+E020–U+E022 private-use characters, `PROTECTED_WORDS`, `PROTECTED_WORDS_PATTERN`, and both mask rules are deleted; `PLUS_CJK_CONTACT` returns to plain CJK contact.
- The "Protected word" glossary entry leaves CONTEXT.md.
