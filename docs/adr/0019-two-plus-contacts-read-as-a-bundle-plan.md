# Two or more pluses in CJK contact read the line as a bundle plan

ADR 0003 attached a plus to a preceding word as a suffix (`Disney+ 上架`), and ADR 0006 made a plus in CJK contact flip its line's undecided pluses into separators. The affix decides first, so in a telecom bundle plan the plus after a product code was never undecided: `HiNet光世代+MOD+影劇館+/全選` rendered as `HiNet 光世代 + MOD+ 影劇館 + /全選`, reading `MOD+` as a brand. ADR 0013 accepted that misread, and ADR 0018 closed the other bundle-plan FIXME with the extension's brand list while leaving this one open, since a list can remove a space but never turn a suffix into a separator.

What separates the two readings is not the plus but how many pluses on the line touch CJK. A brand mention has one: `Disney+ 上架`, and `Netflix、Disney+、Apple TV+ 等` too, because the enumeration pluses touch punctuation, not CJK. A bundle plan has two or more: `光世代+MOD+影劇館+/`, `Switch OLED+健身環+保護貼`.

The decision:

1. **Plus reading counts contacts.** Per line, after the digit, sign, and grade affixes have decided their pluses and before the operator rules, the rules count solitary pluses in direct CJK contact. A `++` run never counts.
2. **The word suffix reads only on a one-contact line.** With two or more contacts the line is a bundle plan: `LETTER_PLUS_CJK` does not apply, the plus after the word stays undecided, and plus reading makes it a separator like the others. `MOD+影劇館+上架` renders as `MOD + 影劇館 + 上架`.
3. **The digit suffix is unconditional.** `18+`, `100+`, `S24+` stay attached on every line: `這裡有18+的內容，還有100+的選擇` is prose, not a bundle.
4. **The extension list gains Latin entries.** `Disney+`, `Apple TV+`, `iCloud+`, `CATCHPLAY+`, `Paramount+`, `discovery+`, and `ESPN+` join `公視+` and `影劇館+`. On a one-contact line the rules already keep them and the list finds nothing to fix. On a bundle line (`Disney+和Apple TV+都`, `公視+、Disney+、Apple TV+等`) the rules space them as separators and the list restores the suffix. A Latin entry carries a left boundary so a longer word never matches; the CJK entries keep none, since `MOD影劇館+` must match.

Alternatives rejected, measured on the same 35 cases:

- **Count every solitary plus on the line, not only the contacts.** Also fixes `A+A+CJK` bundles (`iPad + Apple Pencil + 保護套`), but reads an enumeration as a bundle: `Netflix、Disney+、Apple TV+等` renders as `Netflix、Disney + 、Apple TV + 等`, a common news shape that is right today, and a joiner on a brand line flips (`Disney + 上架了 A + B`).
- **Drop the word suffix and move every Latin brand to the list.** Also fixes two-item bundles (`Switch + 健身環`, `AI + 製造`), but every single Latin brand regresses in the npm package and in pangu.py (`Disney + 上架`), unlisted brands regress in the extension (`AA + 評等`, `Rh + 的人`), and `Disney+` moves under the AI spacing toggle.
- **Flip in the extension only.** Keeps the package unchanged but needs an insert-direction edit and a second contract to document, and the package would still misread the reported bundle plan.

## Consequences

- The bundle-plan FIXME from ADR 0006 closes: the rules render `HiNet 光世代 + MOD + 影劇館 + /全選/...`, and the extension list tightens `影劇館+/全選`.
- Two Latin brands joined by a CJK connector read as separators in the package: `Disney+和Apple TV+都上架了` renders as `Disney + 和 Apple TV + 都上架了`. The extension restores both. The test expectation pins the package output.
- An `A+A+CJK` bundle still reads its last plus as a suffix (`iPad+Apple Pencil+ 保護套`): its first plus is a joiner token with no CJK contact, so the count stays at one.
- ADR 0003's suffix rule and ADR 0006's "settled when attached by an affix reading" hold on one-contact lines only. ADR 0018's second consequence is closed, and its point 4 widens the list to Latin entries.
- `PLUS_CJK_CONTACT`, the flip test, still counts a `++` run as contact (`我會寫C++的程式，A+B` flips `A+B`). Only the bundle count excludes it. Left as is.
