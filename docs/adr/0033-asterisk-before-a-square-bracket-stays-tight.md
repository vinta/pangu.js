# An asterisk before a square bracket stays tight

[ADR 0032](0032-hyphen-between-brackets-reads-per-line.md) let `CJK_OPERATOR_ANS` take an opening bracket on its right, so `CJK-(A)` reads `CJK - (A)`, and it noted that the same holds for `*`. That split bracket globs: `刪掉*[0-9].log的檔案` became `刪掉 * [0-9].log 的檔案`, while v10.2.0 printed `刪掉 *[0-9].log 的檔案`. The first fix, 88e50a85, skipped `*[...]` only when a file extension followed the bracket, so `*[0-9][0-9].log` and `*[0-9]*.log` still split.

The decision:

1. **An asterisk directly before `[` never reads as an operator after CJK.** `刪掉*[0-9].log的檔案` reads `刪掉 *[0-9].log 的檔案`: the asterisk still gets its space from the CJK on its left and stays tight against the bracket.
2. **Everything else keeps ADR 0032's reading.** `時薪*(平日時數+假日時數)` still reads `時薪 * (平日時數 + 假日時數)`, and `=`, `-`, and `&` before `[` are unchanged.

Alternatives rejected:

- **Skip `*[...]` only before a file extension** (88e50a85). It needs a lookahead through the bracket content, and it still split the globs above.
- **Widen a glob rule instead.** There is none: `*.log` survives only because `.` is not in `CJK_OPERATOR_ANS`'s right-hand class.

## Consequences

- The 4 `*[` rows that 88e50a85 added retire as rare cases: `時薪*[平日時數+假日時數]`, `係數*[2+3]`, `係數*[abc]`, and `係數*[[0-9].log]`. Square-bracket multiplication after CJK reads `時薪 *[平日時數 + 假日時數]` again, as in v10.2.0.
- Released behavior is unchanged: v10.2.0 already kept `*[` tight after CJK, so the changelog has no line for it.
- Glossary: pattern preservation lists `*[0-9].log` with the other glob patterns.
