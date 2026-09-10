# pangu.js

pangu.js inserts whitespace between CJK and ANS characters automatically. It ships as a text engine, a Node.js tool, a browser DOM processor, and a Chrome extension built on them.

## Language

**Space**:
The verb for inserting whitespace: pangu spaces CJK from ANS, and respaces a text node that a page re-render undid. Spaced and unspaced are the adjectives, and tight describes a shape that stays unspaced on purpose (`A/B`). Spacing is the noun and the modifier: spacing rules, boundary spacing. A space is also the character itself, and it counts: a pangu element holds one space. Public method names take the verb (`spaceText()`, `spacePage()`); a predicate about the concept keeps the noun (`hasProperSpacing()`).
_Avoid_: spacings (no plural)

**CJK**:
The class of Chinese, Japanese, and Korean characters. Every spacing rule depends on this class.

**ANS**:
Alphabetical letters, numerical digits, and symbols. When an ANS character is adjacent to CJK, it triggers spacing. The name lists its three parts, parallel to CJK. `A`, `N`, and `S` also name the sub-classes in code and in shapes.

**Text spacing**:
Inserting whitespace between CJK and ANS characters inside one string. On a page that string is one text node's data; for the string API it is the whole input.

**Boundary spacing**:
Deciding whether whitespace goes between two adjacent text nodes on a page, and where it goes. `CJK<b>A</b>` gets the space at the start of the `A` node. `CJK<a>A</a>` gets the space at the end of the `CJK` node, because a link, underline, or strike-through would render a space that is added inside it. `<a>A</a><a>CJK</a>` gets a pangu element between the links. In three cases, nothing is added: whitespace or a block edge already separates the nodes, an ignored tag such as `<code>` sits between them, or one node is hidden.

**Decision**:
What the rules choose for one text node or one boundary before pangu writes anything. A boundary spacing decision says where the space goes: nowhere, at the start of the next text node, at the end of the current one, or in a pangu element between them. A text node decision says what the node needs first: trim its leading space, prepend a space, or apply text spacing. A decision is computed from facts alone, with no DOM access, so it runs in vitest. The classifier never makes a decision; it answers with a label.
_Avoid_: verdict

**Settle**:
A text node settles when nothing will rewrite it again in this batch. Text spacing runs first, then boundary spacing rewrites tails of nodes it already visited, so a node is spaced before it is settled. Pangu hands settled nodes to the host at the batch tail, never per node.
_Avoid_: finished, final, done

**Pangu element**:
An inline `<pangu>` element that holds one space. Pangu inserts it between two text nodes that both sit in a link, underline, or strike-through, because a space that is added inside either node would render as part of that node (`<a>A</a><pangu> </pangu><a>CJK</a>`). Pangu never inserts it inside a grid or flex container, because there the element would become a layout item.

**Native text-autospace**:
The gap that the browser renders between CJK and ANS letters or digits through the `text-autospace` CSS property. It is visual only: no character is inserted. The gap is narrower than a real space. The gap ignores symbols. The browser suppresses the gap wherever a real space already exists. So native text-autospace combines with text spacing and boundary spacing without adding a second gap.

**Late fix**:
A correction from the host after rule spacing. The extension chooses it from a classifier's label. A late fix only inserts or removes spaces. It never rewrites the author's characters. A late fix goes through the same scheduling path as text spacing, never as a separate write, so on a hidden page it waits with everything else. While a text node still holds a late fix, text spacing leaves it alone and only boundary spacing touches it; a page re-render of that node hands it back to the rules.

**Page re-render**:
The page writes its own data over a text node that pangu already spaced. The page does this in one of two ways: it sets the `Text` node's data again, or it removes the node and inserts a fresh one. For example, the page has `CJKA`. Pangu spaces it to `CJK A`. Then the page writes `CJKA` into the same node again, or replaces the node with one that holds `CJKA`. The page did not intend to remove the space. It only rendered its own data again, and its data never had the space. From pangu's view, the write undid its work. Common causes: a second render pass in React or Vue, a script that sets `textContent` from a variable, or a live region that refreshes on a timer. Pangu detects a page re-render by comparing the new data against the last data that pangu wrote to that node. Pangu then re-spaces the node inside the observer callback, before the browser paints. If the subtree is too large to re-space before paint, the node queues like other dynamic content.
_Avoid_: revert

## Chrome Extension

**Auto spacing mode**:
The mode that starts ongoing spacing on page load when URL filters allow it, including AI spacing when enabled. A URL change reapplies the filters: an excluded URL stops spacing, and text already spaced stays. On an excluded URL, the manual spacing button still starts ongoing spacing until the URL changes.

**Manual spacing mode**:
The mode that spaces nothing until the user clicks the manual spacing button. The click starts ongoing spacing for the current URL, ignoring URL filters and including AI spacing when enabled. A URL change or page reload ends it until the user clicks again.

**URL filters**:
The blacklist and whitelist that decide where auto spacing is allowed. They are hidden in manual spacing mode, but stay saved when you switch modes.

## Paranoid Text Spacing Algorithm

The algorithm behind text spacing. It has two stages. First, the rules decide every space. Second, AI spacing corrects the rules output at the few ambiguous shapes the rules cannot read. AI spacing is the Chrome extension's second stage. It is on by default, and the user can turn it off. The npm package ships the rules only. The shapes below are generic: `CJK` is any CJK character, `A` is any letter, `N` is any digit, and symbols are literal.

### Rule Spacing

**Symbol handling**:
A symbol between two ANS characters binds them into a joiner token, and the symbol never gets spaces. A symbol in direct contact with CJK reads as an operator and gets spaces, unless an affix reading attaches it to its ANS side. `|` follows pipe reading. `+` follows plus reading. The separators `_` and `/` never get spaces.

**Joiner token**:
ANS characters that any symbol joins tight (`A/B`, `26/30`, `vinta/hal-9000`, `S&P`, `Q&A`, `A+B`, `5+5`, `foo=bar&baz=1`, `A<B`, `HSIAO-MING`). A joiner token is never split. It is spaced from adjacent CJK as one unit. Pipes and plus signs also follow pipe reading and plus reading.

**Pipe reading**:
Decided per line, never across lines. If one pipe is in direct contact with CJK, every pipe on the line becomes a separator with spaces on both sides. This covers concatenated page titles (`CJK | A CJK | A`) and credit lines (`CJK | CJK`). If no pipe on the line is in direct contact with CJK, the pipes stay tight as joiner tokens (`CJK A|A CJK`, `ps aux|grep node`).

**Plus reading**:
Decided per line, never across lines. If one plus is in direct contact with CJK, every undecided plus on the line becomes a separator with spaces on both sides. This covers bundle plans (`A CJK + A`). A plus is already decided in three cases: it is adjacent to a space, an affix reading attaches it (`N+ CJK`, `CJK +N`), or it sits inside a preserved pattern (`C++`). By default, a plus after a word is a separator (`CJK+A+CJK` reads `CJK + A + CJK`, `A+CJK` reads `A + CJK`). Listed names follow name-suffix reading. Plus reading runs before the operator rules, so a `CJK+A` contact flips the line's joiners too. If no plus on the line is in direct contact with CJK, the pluses stay tight as joiner tokens (`CJK A+A CJK`, `CJK N+N CJK`). A plus touching full-width punctuation stays tight on that side. A plus after a closing bracket is a separator before an opening full-width bracket or quote, even when it is the line's only plus. Only the closing-bracket side gets a space. See ADR 0022.

**Affix reading**:
A symbol that attaches to its ANS side at a CJK boundary instead of reading as an operator. Four cases: `+` before digits as a sign (`CJK +N`), `-` before a lowercase flag (`CJK -m CJK`), `+` after a whole digit run as a suffix (`CJK N+ CJK`, never `AN+ CJK`), and single-letter grades (`A+`, `D-`). A plus after a word is not an affix: `A+CJK` reads as a separator (`A + CJK`); see plus reading and ADR 0019. A hyphen before digits is not an affix: `CJK-N` reads as an operator (`N CJK - N CJK`, `CJK - N CJK`); see ADR 0015. A capitalized word after a hyphen keeps the operator reading (`CJK - Vinta`).

**Superscript suffix**:
A Unicode superscript character, or a mark that renders raised (`™`, `℠`, `®`), that attaches to whatever is on its left, CJK or ANS, and is spaced from CJK on its right (`CJK² CJK`, `A² CJK`). It is not an affix reading, since it attaches to either side. `⁽` is not a suffix, so the space never lands inside a superscript parenthesis (`CJK⁽CJK⁾ CJK`). On a page, a `<sup>` element follows the same reading: no space before it, and the space after it goes outside the element. See ADR 0021.

**Name suffix**:
A `+` or `-` attached to a listed name, such as `Disney+`, `公視+`, or `AB-`. It stays tight where the author wrote it tight. Name suffixes belong to rule spacing in every consumer. See ADR 0024.

**No CJK contact, no change**:
The invariant behind every symbol rule. ANS text that has no contact with CJK is never modified. A symbol must be in direct contact with CJK to read as an operator. So CJK elsewhere in the line or text never allows spacing between ANS characters.

**Pattern preservation**:
Some tokens keep their internal shape, even where an operator reading would otherwise apply: compound words (`state-of-the-art`, `GPT-5`, `claude-4-opus`), programming terms (`C++`, `A+`, `i++`, `D-`, `C#`, `F#`), arrow tokens (`=>`, `->`), glob patterns (`*.log`, `templates/*.html`), and file paths (`/usr/bin`, `src/main.py`, `C:\Users\`).

**Punctuation**:
Half-width punctuation is not converted to full-width, with two exceptions. A colon that is in direct contact with CJK and sits right before a parenthesis becomes the full-width colon `\uFF1A`. Middle dots (`\u00B7` `\u2022` `\u2027`) normalize to the katakana middle dot `\u30FB`. Multiple consecutive punctuation marks are preserved. One or more of `!` `;` `,` `?` whose right side is in direct contact with CJK always get a trailing space, no matter what is on their left (`(N CJK),CJK`, `N%,CJK`). So a stray space that is typed before the mark is rewritten, not preserved.

**HTML**:
Tags are protected from spacing rules. Text inside attributes is processed. The exception is a tag mention, which is spaced.

**Tag mention**:
A bare tag with no attributes, a non-void name, and no closing counterpart anywhere in the text. It can be self-closing or not (`CJK <div> CJK`, `CJK List<String> CJK`, `CJK <Spinner /> CJK`). A tag mention reads as one unit that is mentioned in prose, not as markup: it is spaced where it is in direct contact with CJK, and tight against ANS characters. Paired tags, void elements (`<br>`, `<br />`), and tags with attributes stay protected markup.

**HTTP URL**:
An address that starts with `http://` or `https://`. It reads as one unit: nothing inside it is modified, and it is spaced from CJK on its left. It ends at whitespace, quotes, brackets, or CJK punctuation; CJK characters belong to it, so CJK prose written tight after it stays tight. Trailing half-width punctuation and an unbalanced closing parenthesis belong to the prose. A URL inside an attribute value is the same unit. See ADR 0026.

### AI Spacing

**AI spacing**:
The extension's second stage, on by default with a toggle to turn it off. A classifier resolves candidates, and its labels determine the late fixes. If the model cannot answer, the rules output stays.

**Symbol sense disambiguation**:
Deciding which reading a symbol carries from the context around it, not from the symbol alone. It is the natural language processing (NLP) task of the same name. The rules use shape heuristics and the name-suffix list. AI spacing uses a classifier. Use this term to relate pangu to outside work. Name the specific reading when you describe the algorithm.

**Ambiguous shape**:
A shape where the rules cannot derive the symbol's reading, so a classifier decides it. It defines what to flag and which late fix each label allows.

**Candidate**:
One occurrence of an ambiguous shape, flagged on the text before spacing. It carries the sentence around it and the symbol's position in that sentence, which is all the classifier reads. On a page, the sentence is the inline text around the symbol as a reader sees it: it continues across inline elements, ends at a block edge, a `<br>`, or sentence-ending punctuation, steps past hidden and ignored elements, `<sup>`, and `<sub>`, and treats a newline the way the browser renders it.

**Settled candidate**:
A candidate bound to the text node it came from, with the symbol's index in the settled text, so a late fix edits only bytes the batch settled on.

**Classifier**:
The component that reads one candidate and answers with one label from a fixed menu. It never answers with text, so it can never rewrite an author's characters.

**Label**:
The classifier's answer for one candidate. It is one of the fixed menu for its ambiguous shape.
_Avoid_: decision (the rules' word)
