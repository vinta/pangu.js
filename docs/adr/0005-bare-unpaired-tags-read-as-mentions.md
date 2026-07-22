# A bare unpaired non-void tag reads as a tag mention, not markup

ADR 0003 left tags in prose open as a FIXME: `寫一個<div>的標籤` wants spacing while `文字<br>換行` must stay untouched. The engine protected every tag-shaped match behind a placeholder invisible to all spacing rules, so a tag mentioned in prose stayed cramped against CJK (`在這裡插入一個<div>標籤`), and generic type parameters that happen to be tag-shaped (`型別是List<String>的容器`) were cramped the same way. A usage inventory showed the two populations differ in shape, not just intent: real markup passed through the text engine comes paired (`<p>文字</p>`), carries attributes (`<a href="#">`), or is a void element that renders on its own (`<br>`, `<hr />`). A tag mentioned in prose is a bare name in one pair of angle brackets with no counterpart.

The decision splits tag-shaped matches into two readings:

1. A match is a tag mention when all three hold: it is a bare tag with no attributes (a trailing self-closing slash still counts as bare), its name is not an HTML void element, and no closing tag with the same name appears anywhere in the text (case-insensitive). A mention reads as one unit, never split internally, spaced at direct CJK contact on either side (`在這裡插入一個 <div> 標籤`, `型別是 List<String> 的容器`, `這裡放 <Spinner /> 元件`).
2. Every other tag-shaped match is markup and keeps the existing protection: paired tags (`<p>用<code>標記程式碼</p>` spaces only the unpaired `<code>`), void elements (`文字<br>換行`, `文字<br />換行`), and tags with attributes (`<button disabled>送出表單</button>`). Attribute values are still spaced.

Alternatives rejected:

- Treating every CJK-flanked tag as a mention: breaks inline markup like `<div>測試<span>內容</span>結束</div>`, where `<span>` sits between CJK but is paired markup.
- A tag-name lexicon (div/span/code read as mentions, br/hr as markup): generic type parameters (`<String>`, `<u8>`, `<iostream>`) are not HTML names at all, and any fixed list misreads custom elements in both directions. The void-element list is the only lexicon worth keeping because it is closed by spec.
- Pairing decided per line like slash and pipe reading: markup routinely opens and closes across lines, and the browser layer feeds the engine per text node anyway, so whole-text pairing is both safer and effectively local.

## Consequences

- Closes the tag-in-prose FIXME from ADR 0003. Its other two readings (CJK brand suffixes, year ranges) stay open.
- Between half-width characters a mention degenerates to joiner-token behavior (`條件是 a<b>c 的情況`), consistent with ADR 0003, because a mention only gets spaces at direct CJK contact.
- A markup fragment whose closing tag lives in a different chunk reads as a mention and gets spaced (`<div>中文` alone becomes `<div> 中文`). Raw markup piped through the text engine in pieces was already a known casualty class, see ADR 0004. Accepted cost.
- A lone closing tag in prose (`記得加上</div>結尾`) keeps the markup reading and stays cramped. Too rare to earn a rule, and closing-tag syntax is a strong markup signal.
- Self-closing syntax by itself is not a markup signal: a bare JSX-style tag reads as a mention (`這裡放 <Spinner /> 元件`), and only the void-element list keeps `<br />` and `<hr />` on the markup reading.
