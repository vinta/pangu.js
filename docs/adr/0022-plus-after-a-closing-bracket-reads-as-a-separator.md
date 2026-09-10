# A plus after a closing bracket reads as a separator

**The package/extension suffix difference below is superseded by [ADR 0024](0024-name-suffixes-belong-to-core-spacing.md). The closing-bracket separator policy stays.**

Plus reading keeps a plus tight on the side that touches common Chinese full-width punctuation, even when another plus flips the line. The reason is a name: in `Disney+（迪士尼）` or `影劇館+」` the plus is a suffix that the extension's name-suffix list restores per ADR 0019, and a space before an opening full-width bracket or quote would split the name from its gloss.

A real bundle plan broke the shape: `HiNet光世代+MOD+自選餐(全選)+「影劇館+」`. The third plus sits between `)` and `「`. A closing bracket carries no name, so nothing on its left can be a suffix, and yet the full-width rule kept the plus tight: `HiNet 光世代 + MOD + 自選餐 (全選)+「影劇館+」`.

The decision:

1. **On a line with two or more solitary pluses, a plus after a closing bracket is a separator before an opening full-width bracket or quote.** `RIGHT_BRACKET_PLUS_FULL_WIDTH_LEFT_BRACKET` matches `)` `]` `}` on the left and `（` `「` `『` `【` `《` on the right, after plus reading has run.
2. **The space goes on the bracket side only.** The full-width opener still takes none: `自選餐 (全選) +「影劇館 +」`. The `影劇館+」` half stays the name-suffix list's job.
3. **A line with one solitary plus keeps it tight.** One plus is no bundle plan, so `自選餐(全選)+「影劇館」` is unchanged. `SOLITARY_PLUS` counts the pluses that are not part of a `++` run.

Alternatives rejected:

- **Drop the full-width exception and let plus reading space every plus.** A word before an opening full-width bracket may be a name, so on a bundle line `公視+（公共電視）` would become `公視 + （公共電視）` and `影劇館+」` would become `影劇館 + 」`, a space before a closing quote that no reading wants.
- **Space both sides of the plus.** Puts a space before a full-width opener, which no rule does: `中文（英文）` stays tight.

## Consequences

- `HiNet光世代+MOD+自選餐(全選)+「影劇館+」` renders as `HiNet 光世代 + MOD + 自選餐 (全選) +「影劇館 +」` in the package. The extension restores `影劇館+」`.
- `自選餐(全選)+「影劇館」` stays tight and is left as a FIXME in the plus test file. Deciding it needs the sentence, not the line.
- The glossary's plus reading entry records both halves: the full-width side stays tight, and the closing-bracket case on a bundle line.
- pangu.py follows in its own repo.
