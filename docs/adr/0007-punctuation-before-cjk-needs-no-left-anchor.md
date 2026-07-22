# A !;,? run directly before CJK is spaced without a left anchor

Trailing-space rules for `!` `;` `,` `?` were left-anchored: a mark only got its space when a CJK character or a half-width letter/digit sat immediately before it. Real-world telecom copy broke the model: in `精采5G購機方案(30個月),月繳599元購機優惠(30個月)` the comma follows a right bracket, which matched neither anchor, so `,月` stayed glued while everything around it spaced. Adding a right-bracket anchor fixed that report but committed the engine to growing an anchor allowlist one character class at a time, with `%`, `$`, quotes, and full-width neighbors still falling through.

The decision drops the left anchor entirely:

1. A `!` `;` `,` or `?` run directly touching CJK on its right gets one trailing space, whatever sits on its left (`(30 個月), 月繳`, `50%, 以上`, `"你好", 她說`).
2. The right side still requires direct CJK contact, so joiner shapes stay tight: `1,000`, `f(a,b)`, `foo(),bar()`, and URLs never space (nothing CJK follows the mark).
3. `CJK_PUNCTUATION` remains for what the blanket rule does not cover: colon handling and punctuation before letters/digits (`前面,ABC`, `前面! abc`), both of which stay CJK-anchored.

The left anchor's only observable job was preserving the already-spaced shape `前面 ,後面`. That shape is a typo, not a formatting choice worth a contract, so its "DO NOT change if already spacing" tests are retired for the glued-right case across the four symbol test files. `前面 , 後面` and `前面, 後面` remain untouched because the mark no longer touches CJK directly.

Alternatives rejected:

- A third anchored rule per newly reported left neighbor (right brackets shipped briefly as c609ce1): each unvetted neighbor needs its own report and rule, and the rule set grows without converging.
- A `(?<=\S)` guard instead of no guard: passes the same suite and preserves the typo shape, but keeps a special case whose only beneficiary is input judged a typo.

## Consequences

- `前面 ,後面` becomes `前面 , 後面`: the stray space stays, the missing one is added. Retyping the typo correctly is the user's move, not pangu's.
- Left neighbors nobody vetted now space: `……,然後`, `。,你` and similar degenerate shapes get a trailing space after the mark. Accepted, the mark touches CJK so spacing is licensed.
- Colon and period keep their anchored rules and full-width conversion (`FIX_CJK_COLON_ANS`) is unaffected.
- `AN_PUNCTUATION_CJK` and `RIGHT_BRACKET_PUNCTUATION_CJK` are deleted, replaced by the single `PUNCTUATION_CJK` rule.
