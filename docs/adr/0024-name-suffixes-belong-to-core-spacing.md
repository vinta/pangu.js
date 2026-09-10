# Name suffixes belong to core spacing

Move the existing name-suffix list into core. Its outputs belong to every pangu consumer: `Disney+上架` becomes `Disney+ 上架`, and `血型是AB-的人` becomes `血型是 AB- 的人`. The AI toggle controls model-dependent corrections only. Keeping the list in the extension with a separate toggle filter would preserve a package difference we no longer want.

The accepted names, symbols, and punctuation stay as [ADR 0019](0019-plus-after-a-word-reads-as-a-separator.md) defined them. The rules preserve listed suffixes directly. Author-written gaps stay, unlisted names keep the default reading, and other separators on the same line stay spaced.

Apply name-suffix reading inside the existing plus, operator, and CJK/ANS rules. This avoids adding spaces only to remove them in another pass. Name matching reads the current line prefix through existing compound placeholders, so `non-Disney+` and `foo-Apple TV+` keep their suffixes. The working line stays protected. Keep the rule order because pipes and file paths depend on it.

Browser boundary spacing keeps its existing windows and placement decisions. A listed suffix at the end of the full node skips interior tail respacing, so a truncated window cannot split it again.

This supersedes the extension ownership in [ADR 0018](0018-cjk-brand-suffixes-return-as-an-extension-late-fix.md) and ADR 0019. The placeholder family and mask rules removed by [ADR 0013](0013-protected-word-list-removed.md) do not return. Core tests assert the final outputs directly; the extension retains model classification and late writes.
