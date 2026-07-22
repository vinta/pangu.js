# A protected word list pins CJK brand suffixes, and a plus in contact flips its line's unsettled pluses

ADR 0003 left CJK brand suffixes open as a FIXME: `公視+上架` wants the suffix reading (`公視+ 上架`) while `前面+後面` wants the operator reading, and the two are structurally identical, so no shape rule can split them — it predicted a lexicon would be needed. Real-world bundle plans sharpened the problem: `HiNet光世代+MOD影劇館+(300M/300M)` chains products with pluses where most read as separators but one belongs to the brand `影劇館+`, and the affix shape rule misread `MOD+影劇館+` as a `MOD+` suffix.

The decision adds two mechanisms on top of the affix shape rule:

1. A protected word list of literal strings, exactly `公視+` and `影劇館+`. A protected word is never modified inside, is spaced from its neighbors as one unit, and a symbol in direct contact with it reads as an operator, never as an affix (`MOD+影劇館+` reads `MOD + 影劇館+`, not a `MOD+` suffix). Protection runs before the affix readings. Open-class shapes stay out of the list: `Disney+`, `Apple TV+`, and `100+` keep the affix shape rule, `C++` keeps pattern preservation.
2. Plus reading, a sibling of pipe reading: a plus in direct contact with CJK or a protected word makes every unsettled plus on the line a separator with spaces on both sides. A plus is settled when it is already space-adjacent, attached by an affix reading, or inside a preserved pattern. A line with no such contact keeps its pluses tight as joiner tokens (`A+B`, `5+5`). Decided per line, never across lines.

Alternatives rejected:

- Segment-content gating (flip a line's pluses when any plus-delimited segment contains CJK): breaks the `A+B`/`5+5` joiner tokens on mixed lines and reintroduces the action-at-a-distance text gating that ADR 0003 removed.
- A whitelist-only world (drop the affix shape rule and enumerate every brand): `Disney+`-style suffixes and quantity markers are an open class no list can enumerate. The list earns its keep only where shape cannot decide.

## Consequences

- Closes the CJK-brand-suffix FIXME from ADR 0003. Year ranges stay open, the last of its three.
- On a flipped line a half-width joiner flips too: `x+y` gets spaces when another plus on its line touches CJK or a protected word, the same per-line tradeoff pipe reading accepted.
- A protected word wins everywhere, including bundle contexts where its plus semantically reads as a separator: `MOD 影劇館+ (300M/300M)` keeps the plus attached to the brand.
- Slash reading is untouched: repeated slashes stay tight and a protected word sits flush against a following slash (`影劇館+/全選/自選 20`).
- The list is maintained by hand and starts at exactly two entries. Growing it is a per-entry judgement, not a policy change.
- The machinery only supports entries made of CJK and `+`: only `+` is masked, entries are re-exposed to the general rules after restore, and overlapping entries are not ordered. A word needing any other preserved symbol or shape (`同學-`, `AC/DC`, `ANTHROP\C`, mixed-script internals like `MOD影劇館+` as one entry) is unsupported today. Generalize the masking and ordering when a real entry earns it, and the new entry's red test is the signal.
