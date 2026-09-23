# An `<i>` element keeps its boundary spaces outside

v10.2.0 treated every `<i>` as a separator, like an image, so `該研究發表於<i>Nature</i>期刊` got no spaces while the same title in `<em>` did. e8334246 spaced `<i>` like `<em>`, with the space inside. A space inside an icon changes the text the icon font draws from: `<i class="material-icons"> public</i>`. 117d4236 moved the space outside with rules only `<i>` used. They marked the boundary space-sensitive after the boundary node had already climbed past the `<i>` to its `<td>`, so a `<pangu>` landed between table cells and widened the table.

The decision:

1. **`<i>` joins the space-sensitive tags**, next to links, underline, and strike-through. `該研究發表於<i>Nature</i>期刊` reads `該研究發表於 <i>Nature</i> 期刊`, and `公開<i class="material-icons">public</i>發佈` keeps the icon's text intact.
2. **An `<i>` with no text between two text nodes still separates them.** `公開<i class="fa fa-globe"></i>Public` stays tight.
3. **No visible space goes before a hidden node.** `<i>` now shares the link path, so the hidden check covers the next node for every space-sensitive tag: `中文<i hidden>English</i>中文` and `中文<a hidden>English</a>中文` stay as written.

Alternatives rejected:

- **Space `<i>` like `<em>`** (e8334246). The space lands inside the icon and changes what it draws.
- **Keep 117d4236's rules and skip `<pangu>` in table containers**, like grid and flex. Prototyped: tables pass, but a `<pangu>` still lands inside `<ul>`.
- **Add table cells and list items to `blockTags`.** Prototyped: it misses CSS tables built from `<span>`, and it changes every released cell and list-item boundary.

## Consequences

- Icons drawn from text get spaces outside: `公開 <i class="material-icons">public</i> 發佈`. v10.2.0 kept them tight.
- `<i>` shares a limitation links already have: `<i>中文</i><span><a>English</a></span>` gets no space, because the `<pangu>` would be the first child of `<span>` and is removed. The 2 italic rows that pinned a `<pangu>` in this shape retire as rare cases.
- `<em>` still takes the space inside (`該研究發表於<em> Nature</em> 期刊`).
- A hidden link no longer gets a visible space before it.
- Glossary: boundary spacing and pangu element list `<i>` next to links, underline, and strike-through, and the separator "an icon" narrows to an icon with no text.
