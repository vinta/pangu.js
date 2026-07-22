# Symbols between half-width characters are tokens, never operators

ADR 0002 made `-` contact-gated while `=` `+` `*` `<` `>` stayed text-gated, meaning they got spaces between half-width characters whenever the text contained CJK anywhere. A usage inventory of real-world symbol readings showed that split was wrong twice over. First, the dominant readings between half-width characters are token-like across the board: query strings (`foo=bar&baz=1`), inline math typed tight (`5+5`, `A<B`), comparisons, and codes. Second, text-gated spacing never actually worked. Compound-word and joiner-token placeholders shield neighboring operators from the between-half-width rules, so mixed formulas came out as arbitrary mixes like `X * 5+Y/10 = 123` depending on which substring happened to be protected first.

The decision generalizes ADR 0002's hyphen rule to every symbol:

1. A symbol with half-width characters on both sides binds them into one token, never split, spaced from adjacent CJK as a unit (`A+B`, `5+5`, `A*B`, `a=1`, `A<B`, `A-B`, `A/B`, `S&P`).
2. A symbol in direct contact with CJK reads as an operator and gets spaces (`你 + 我`, `前面 - 後面`, `溫度 > 30`, `公里 / 小時`).
3. Affix readings override the operator reading at a CJK boundary: `+` and `-` attach to following digits as signs (`打 +886`, `氣溫是 -5 度`), `-` attaches to a following lowercase flag (`參數要加 -m 的旗標`), and single-letter grades keep attaching (`成績是 A+ 的等級`). A capitalized word after a hyphen keeps the operator reading (`陳上進 - Vinta`).
4. Pattern preservation and slash reading are unchanged (`C++`, `*.log`, `=>`, `->`, file paths, dates).

Alternatives rejected:

- Keep text-gating and fix the placeholder shielding so spaced math works reliably: more code for an output nobody types by hand, and formulas containing `-` or `/` would stay half-tight forever.
- Exempt only `=` to fix query strings: leaves a four-symbol formula with three typographic treatments.
- Attach `*` to a preceding digit as a rating (`這是 5* 的飯店`): too rare to earn a rule, the operator reading is fine.

## Consequences

- Replaces ADR 0002. The hyphen outcome survives as a special case of rule 1.
- Inline math in CJK prose stays tight. Authors who want `5 + 5` write the spaces themselves, and already-spaced text is never collapsed.
- Sign attachment trades away year ranges and CJK-adjacent arithmetic: `2016年-2018年` renders with `-2018` attached, and `庫存-2件` reads as a signed delta (`庫存 -2 件`). Accepted cost, though the year range reading stays open as a FIXME.
- "No CJK contact, no change" becomes symbol-level for every symbol: CJK elsewhere in the text never licenses spacing between half-width characters.
- The per-symbol test files pin the model (the `+` `*` `=` `<` `>` files follow the ampersand operator/token template). Three readings stay open as FIXMEs: brand suffixes (`Disney+上架`) versus word-plus-CJK operators (`Vinta+陳上進`), tags mentioned in prose (`寫一個<div>的標籤`) versus real markup (`文字<br>換行`), and year ranges (`2016年-2018年` as `2016 年 - 2018 年`).
