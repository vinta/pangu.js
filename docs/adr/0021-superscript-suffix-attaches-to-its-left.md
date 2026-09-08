# A superscript suffix attaches to its left

Unicode superscript characters had no reading of their own. `¹` `²` `³` sit in the Latin-1 Supplement, so they read as ordinary ANS and got spaces on both sides: `甲²乙` rendered as `甲 ² 乙`. The Superscripts and Subscripts block (`⁰` `⁴`-`⁹` `ⁱ` `ⁿ` `⁺` `⁻` `⁼` `⁽` `⁾`) was in no character class at all, so nothing fired: a real promotion line, `新申請MOD+自選餐(全選)/影劇館⁺加碼`, kept `影劇館⁺加碼` glued while everything around it spaced.

A superscript is typography, not a symbol between two operands. It belongs to the word before it, whatever script that word is in: `m²`, `E=mc²`, `影劇館⁺`, a footnote mark after a sentence. The reader never wants a space in front of it.

The decision:

1. **A superscript suffix attaches to its left, CJK or ANS.** `CJK_ANS` refuses to space before one, and `ANS_BEFORE_CJK` includes the class so the CJK after it still gets its space: `甲² 乙`, `影劇館⁺ 加碼`, `面積 10m² 左右`, `E=mc² 的公式`.
2. **`⁽` is not a suffix.** It opens a superscript parenthesis, so the space after the run lands after `⁾`, never inside: `甲⁽註⁾ 乙`.
3. **On a page, a `<sup>` element follows the same reading.** Boundary spacing adds no space before a `<sup>`, and the space after it goes outside the element, even when the superscript text sits in a link: `影劇館<sup>+</sup> 中文`, `中文<sup><a>1</a></sup> 中文`. Text inside the element is still spaced (`<sup>中文 <a>1</a></sup>`), and an author's space around it is kept.

The reading lives in the rules, not in the extension, so the npm package and pangu.py get it too, and it does not depend on the AI spacing toggle.

Alternatives rejected:

- **Leave superscripts as ordinary ANS.** The rules output for `甲 ² 乙` puts a space where no typesetter would, and the promotion line stays a report.
- **Restore the attachment in the extension as a late fix.** A late fix only removes a space the rules added, so `影劇館⁺加碼` would still need a rule to get the space after it, and the package would still render `甲 ² 乙`.

## Consequences

- `甲²乙`, `甲³乙`, and `甲¹乙` change from `甲 ² 乙` to `甲² 乙`. Nothing in the suite had pinned the old output.
- A superscript run before CJK now gets a space after it where it got none before: `影劇館⁺ 加碼`, `甲⁽註⁾ 乙`.
- An author's space before a superscript is kept (`甲 ² 乙` stays), since the rules only insert.
- `SUPERSCRIPT_SUFFIXES` is the code identifier; the glossary term is superscript suffix.
- pangu.py follows in its own repo.
