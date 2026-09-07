# A plus after a word reads as a separator, and a name-suffix list restores listed names

ADR 0003 attached a plus to a preceding word as a suffix (`Disney+ 上架`), and ADR 0006 made a plus in CJK contact flip its line's undecided pluses into separators. The affix decides first, so in a telecom bundle plan the plus after a product code was never undecided: `HiNet光世代+MOD+影劇館+/全選` rendered as `HiNet 光世代 + MOD+ 影劇館 + /全選`, reading `MOD+` as a brand. ADR 0013 accepted that misread, and ADR 0018 closed the other bundle-plan FIXME with the extension's brand list while leaving this one open, since a list can remove a space but never turn a suffix into a separator.

The shape `A+CJK` carries two readings that no rule can split: a name suffix (`Disney+`, `AA+`, `AB+`) and a separator (`Switch+健身環`, `AI+製造`, `MOD+影劇館`). Names are a closed set the extension can list. Separators are open. So the rules take the open reading, and the list restores the closed one.

The decision:

1. **A plus after a word in CJK contact is a separator.** No affix decides it, so plus reading spaces it: `Switch + 健身環`, `AI + 製造`, `MOD + 影劇館 + 上架`, and `Disney + 上架` too. The word suffix of ADR 0003 rule 3 is dropped.
2. **The digit suffix needs a whole digit run.** `\b[0-9]+\+CJK` keeps `18+`, `100+`, `3.5+`, `Python 3+`, `iOS 17+`, and drops a digit that ends a word (`S24+`, `HDR10+`, `M2+`) to the separator reading.
3. **Plus reading runs before the operator rules.** Every plus in CJK contact is then decided by an affix or by plus reading, never by the operator rules, so `+` leaves the operator class. A `CJK+A` contact now flips the line's later joiners like a `CJK+CJK` contact already did: `HiNet 光世代 + MOD + Wi-Fi 全屋通`, `陳上進 + Vinta + Mollie`. The glossary promised this; the operator rule ran first and hid the contact. Four of the measured cases change, all `CJK+A` lines with a later joiner.
4. **The extension's name-suffix list restores four closed sets.** Product names (`Disney+`, `Apple TV+`, `iCloud+`, `CATCHPLAY+`, `Paramount+`, `discovery+`, `ESPN+`, `Fitness+`, `PS+`, `公視+`, `影劇館+`), product tiers (`Pro+`), credit ratings (`AA`, `BBB`, `BB`, `CCC`, each with or without Taiwan Ratings' `tw` prefix, and `twA`, `twB`), and blood types (`AB`, `Rh`, `RhD`). Ratings and blood types take `+` or `-`, since the same scale has both forms and the rules already read `AB-的人` as an operator (ADR 0003): the list restores `AB- 的人` with no rule change. A Latin entry carries a left boundary so a longer word never matches; a CJK entry keeps none, since `MOD影劇館+` must match. Single letters (`A+`, `O-`) stay out: the grade rule keeps them, and a listed letter would turn a flipped joiner `A + B` into `A+ B`.

Alternatives rejected:

- **Count contacts.** Keep the word suffix on a line with one plus in CJK contact and drop it on a line with two or more. This reached the branch and was reversed before release. Its one advantage: `Disney+ 上架` right in the npm package with no list. Its costs: every two-item combo misreads (`Switch+ 健身環`, `AI+ 製造`, `MOD+ 寬頻`), and it needs a per-line contact count, a solitary-plus regex, and a suffix rule that applies only sometimes.
- **Count every solitary plus on the line, not only the contacts.** Reads an enumeration as a bundle (`Netflix、Disney + 、Apple TV + 等`) and still keeps `Switch+ 健身環`.
- **Flip in the extension only.** Keeps the package unchanged but needs an insert-direction edit and a second contract, and the package would still misread every bundle plan and two-item combo.

## Consequences

- npm package and pangu.py: `Disney + 上架`, `Apple TV + 上架`, `Disney + で配信`, `Netflix、Disney + 、Apple TV + 等`. The extension restores listed names, under the AI spacing toggle (default on). The test expectations pin the package output, with the extension pair commented below each.
- Everywhere: unlisted suffixes read as separators (`4G + 網路`, `5G + 時代`, `Canal + 出品`, `Google + 關站了`), and so do `Galaxy S24 + 上市` and `HDR10 + 支援`. One list entry each if reported.
- Minus forms stay operators in the package, unchanged from before (`AB - 的人`, `AA - 評等`). Only the extension restores them.
- A flipped joiner on a listed line is not restored: `Disney+ 上架了 A + B`.
- Open: a digit token before the plus keeps the digit suffix (`Switch 2+ 瑪利歐賽車`) because `Python 3+ 的版本` has the same shape. Only the sentence decides. A model needs its own corpus and measurement per ADR 0016.
- Pre-existing, untouched: `Disney+(迪士尼)` stays tight, and `PLUS_CJK_CONTACT` still counts a `++` run as contact (`我會寫C++的程式，A+B` flips `A+B`).
- Both bundle-plan FIXMEs, from ADR 0006 and ADR 0018, close: `HiNet 光世代 + MOD + 影劇館 + /全選` in the package, `影劇館+/全選` in the extension.
- ADR 0003's word suffix and its `Vinta+陳上進` consequence are reversed: `Vinta + 陳上進`. ADR 0006's "whitelist-only world" is adopted for names, and the digit suffix stays a rule. ADR 0018's list widens beyond `CJK+` and beyond `+`.
- pangu.py follows in its own repo: `AN_PLUS_CJK` becomes the digit-only rule, and plus reading moves before the operator rules with `+` out of the operator classes.
