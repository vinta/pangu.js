# A hyphen in CJK contact turns every hyphen between brackets on its line into a separator

Data series titles chain their parts with hyphens: `全球-名目國內生產毛額[GDP]-(NSA,美元,IMF 預估)`. The first hyphen touches CJK and read as an operator. The second sits between `]` and `(`, and no rule puts an opening bracket on the right of an operator, so the title came out half-spaced: `全球 - 名目國內生產毛額 [GDP]-(NSA, 美元, IMF 預估)`.

The decision gives `-` a per-line reading, following pipe reading ([ADR 0004](0004-pipe-reads-per-line-on-cjk-contact.md)) and plus reading ([ADR 0019](0019-plus-after-a-word-reads-as-a-separator.md)):

1. A hyphen in direct contact with CJK flips every hyphen between a closing bracket and an opening bracket on its line: `全球 - 名目國內生產毛額 [GDP] - (NSA, 美元, IMF 預估)`.
2. Only a hyphen between brackets flips. No word connector sits there, so [ADR 0003](0003-symbols-between-half-width-are-tokens.md)'s joiner tokens (`HSIAO-MING`, `USB-C`, `GPT-5`) are untouched.
3. A line with no hyphen in direct contact with CJK keeps the hyphen tight (`arr[i]-(x+1)`), even when CJK appears elsewhere on the line.
4. Hyphen reading runs before the operator rules, which would otherwise space the CJK contact away before it is tested.

Alternatives rejected:

- **Widen `ANS_OPERATOR_CJK` to accept an opening bracket before the CJK.** It fixes `]-(年增率` and misses `]-(NSA,`, where the bracket content starts with ANS.
- **Space the hyphen when either bracket group touches CJK.** It also fixes a title with no other hyphen, but it needs a lookbehind through the bracket content, the action at a distance ADR 0004 declined.
- **An ambiguous shape for AI spacing.** The line's first hyphen already decides the reading, so there is nothing for a classifier to choose, and npm consumers would get nothing.

## Consequences

- `毛額[GDP]-(NSA)` alone stays tight: no hyphen on the line touches CJK. Real titles open with `CJK-CJK`, so the flip fires there.
- A line that mixes a hyphen in CJK contact with a bracketed formula spaces the formula too (`f(x)-(y)` reads `f (x) - (y)`). No real text with this shape was found.
- Only `-` gets this reading. `*`, `=`, and `&` between brackets stay tight.
- Fixed right after: `CJK-(A)` read `CJK -(A)`, spaced on one side only. `CJK_OPERATOR_ANS` now takes an opening bracket on its right, the mirror of the closing bracket `ANS_OPERATOR_CJK` takes on its left, so it reads `CJK - (A)`. The same holds for `*`, `=`, and `&`.
- **Hyphen reading** returns to `CONTEXT.md` with a new sense. ADR 0002 folded the old contact-gated sense into symbol handling, where it stays.
