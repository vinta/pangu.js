# A pipe in CJK contact turns every pipe on its line into a spaced separator

Pipes never got spaces under the old separator model, regardless of context. That left concatenated page titles unreadable (`支援的 Apple TV 型號|Disney+ 幫助中心|TW`), the exact shape the Chrome extension meets in every `<title>` it processes, and credit lines like `作詞|林夕` stayed cramped. A usage inventory showed the tight readings worth protecting are code and data shapes typed between half-width characters (`ps aux|grep node`, `string|number`, `(cat|dog)`, `a||b`), which never put a pipe in direct contact with CJK.

The decision extends ADR 0003's model to `|` with a per-line reading, following the slash precedent:

1. A pipe in direct contact with CJK reads as a separator, and it flips every pipe on its line: a mixed list like `Mollie|Vinta|貓咪` spaces all its pipes (`Mollie | Vinta | 貓咪`), not just the one touching CJK.
2. A line whose pipes touch no CJK keeps them tight as joiner tokens (`條件是 x|y 的情況`, `得到一個 A||B 的結果`), even when CJK appears elsewhere on the line.
3. Decided per line, never across lines.

Alternatives rejected:

- Per-pipe contact instead of per-line: leaves mixed separator lists half-spaced (`Mollie|Vinta | 貓咪`), but the pipes on such a line are one list and should read uniformly.
- Gating on whether the line already contains a space: fails the same mixed lists, which are typed without spaces, and reintroduces the action-at-a-distance gating that ADR 0003 removed.

## Consequences

- The "separators never get spaces" rule in CONTEXT.md now covers only `_`. `|` gets its own pipe reading entry.
- Markdown table rows and wiki links that put CJK against a pipe get spaced (`[[頁面|顯示文字]]` breaks). Raw markup piped through the text engine was already a known casualty class, see the tag-in-prose FIXME in ADR 0003. Accepted cost.
- Only a pipe with content on both sides is spaced, so line-edge pipes such as the outer delimiters of a markdown table row stay untouched.
