# Name suffixes belong to core spacing

Move the existing name-suffix list into core. Its outputs belong to every pangu consumer: `Disney+上架` becomes `Disney+ 上架`, and `血型是AB-的人` becomes `血型是 AB- 的人`. The AI toggle controls model-dependent corrections only. Keeping the list in the extension with a separate toggle filter would preserve a package difference we no longer want.

The accepted names, symbols, and punctuation stay as [ADR 0019](0019-plus-after-a-word-reads-as-a-separator.md) defined them. Only rules-inserted spaces are removed. Author-written gaps stay, unlisted names keep the default reading, and other separators on the same line stay spaced.

The shared correction compares text before and after spacing while backticks and tags are hidden. Attribute values use their own recursive spacing pass. Browser boundary spacing keeps whole ASCII words before signs and restores CJK or multiword names against the full node. This preserves the same suffix policy when a name ends at a text-node boundary.

This supersedes the extension ownership in [ADR 0018](0018-cjk-brand-suffixes-return-as-an-extension-late-fix.md) and ADR 0019. The placeholder family and mask rules removed by [ADR 0013](0013-protected-word-list-removed.md) do not return. Core tests assert the final outputs directly; the extension retains model classification and late writes.
