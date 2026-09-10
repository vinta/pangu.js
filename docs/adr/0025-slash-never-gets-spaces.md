# A slash never gets spaces

ADR 0003 rule 2 made a slash in direct CJK contact an operator (`公里 / 小時`), and rule 4 kept slash reading: decided per line, one slash in CJK contact reads as an operator, two or more read as a file path or a list and stay tight. The count made the same contact read two ways: `我/你` became `我 / 你` while `我/你/他` stayed tight, and a line with a URL elsewhere on it flipped its own slash. Joiner tokens (`A/B`) and lists were already tight, and the separator `_` is tight everywhere. Vinta asked whether `/` should follow `_`.

The decision:

1. **A slash in direct CJK contact never gets spaces.** `前面/後面`, `陳上進/Mollie`, `Mollie/陳上進`, and `公里/小時` stay tight, on every line, whatever the line's slash count. The three slash operator rules and the per-line count are deleted.
2. **The path rules stay.** `在/home目錄` still reads `在 /home 目錄` and `清理build/temp/目錄` still reads `清理 build/temp/ 目錄`. No shape rule can replace the directory list: `在/home` and `陳上進/vinta` share a shape.
3. **Already-spaced text is untouched.** `前面 / 後面` and `陳上進 / Mollie / 貓咪` stay as written.

Alternatives rejected:

- **Keep the per-line count.** It is the thing that made one contact read two ways, and it made hashtag spacing depend on it too.
- **An affix reading that attaches `/` to its ANS side.** `陳上進/Mollie` would read `陳上進 /Mollie`, a space no reader wants.
- **Drop the path rules too, so no rule touches `/`.** Prototyped as `v1`: 27 path rows lose their space on one side (`在/tmp 下`), an asymmetry that reads worse than either tight or spaced.

## Consequences

- Six test rows flip to tight: `前面/後面`, `Mollie/陳上進`, `陳上進/Mollie`, `速度是 60 公里/小時`, `我/你`, `歡迎光臨/再見`. The per-line block in the slash test is gone; its inputs live in the separator block.
- A `<wbr>` that splits a slash across text nodes now leaves both nodes tight; the browser test keeps the shape.
- A URL that ends with `/` in its own text node followed by CJK is no longer corrupted: on HEAD the junction window read the URL tail as a slash contact and wrote a space into the URL (`https://vinta.ws/code /`). It gets no boundary space either.
- Generated shapes read tight: `甲方和/或乙方`, `100 元/人`, `3 次/週`, `蘋果/Apple`.
- `respaceCurrentTail()` keeps its job for pipe reading, plus reading, and the hyphen operator, which still write a space into the tail.
- Glossary: the slash reading entry is deleted, and `/` joins `_` as a separator.
