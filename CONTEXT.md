# pangu.js

pangu.js inserts whitespace between CJK and ANS characters automatically. It ships as a text engine, a Node.js tool, a browser DOM processor, and a Chrome extension built on them.

## Language

**Space**:
The verb for inserting whitespace: pangu spaces CJK from ANS, and respaces a text node that a page re-render undid. Spaced and unspaced are the adjectives, and tight describes a shape that stays unspaced on purpose (`A/B`). Spacing is the noun and the modifier: spacing rules, boundary spacing. A space is also the character itself, and it counts: a pangu element holds one space. Public method names keep an older spacing prefix (`spacingText()`, `spacingPage()`), and those stay as they are.
_Avoid_: spacings (no plural), space out, spaced out, spacer, spacious

**CJK**:
The class of Chinese, Japanese, and Korean characters. Every spacing rule depends on this class.

**ANS**:
Alphabetical letters, numerical digits, and symbols. When an ANS character is adjacent to CJK, it triggers spacing. The name lists its three parts, parallel to CJK. `A`, `N`, and `S` also name the sub-classes in code and in shapes.

**Text spacing**:
Inserting whitespace between CJK and ANS characters inside one string. On a page that string is one text node's data; for the string API it is the whole input.
_Avoid_: paranoid spacing

**Boundary spacing**:
Deciding whether whitespace goes between two adjacent text nodes on a page, and where it goes. `CJK<b>A</b>` gets the space at the start of the `A` node. `CJK<a>A</a>` gets the space at the end of the `CJK` node, because a link, underline, or strike-through would render a space that is added inside it. `<a>A</a><a>CJK</a>` gets a pangu element between the links. In three cases, nothing is added: whitespace or a block edge already separates the nodes, an ignored tag such as `<code>` sits between them, or one node is hidden.
_Avoid_: pair spacing, adjacent-node spacing

**Settle**:
A text node settles when nothing will rewrite it again in this batch. Text spacing runs first, then boundary spacing rewrites tails of nodes it already visited, so a node is spaced before it is settled. Pangu hands settled nodes to the host at the batch tail, never per node.
_Avoid_: finished, done, final

**Pangu element**:
An inline `<pangu>` element that holds one space. Pangu inserts it between two text nodes that both sit in a link, underline, or strike-through, because a space that is added inside either node would render as part of that node (`<a>A</a><pangu> </pangu><a>CJK</a>`). Pangu never inserts it inside a grid or flex container, because there the element would become a layout item.
_Avoid_: space element, marker element

**Native text-autospace**:
The gap that the browser renders between CJK and ANS letters or digits through the `text-autospace` CSS property. It is visual only: no character is inserted. The gap is narrower than a real space. The gap ignores symbols. The browser suppresses the gap wherever a real space already exists. So native text-autospace combines with text spacing and boundary spacing without adding a second gap.
_Avoid_: native autospacing, text autospace, CSS spacing, autospace mode, text-autospace (bare, in prose)

**Late fix**:
A correction to the rules output. It is applied after the rules run, and something other than the rules decides it, such as a classifier. A late fix only inserts or removes spaces. It never rewrites the author's characters. When no classifier is present, the rules output is kept. A late fix goes through the same scheduling path as text spacing, never as a separate write, so on a hidden page it waits with everything else. Today, the only late fix removes the space that the rules inserted at a candidate that is read as a signed number (`CJK - N` becomes `CJK -N`).
_Avoid_: un-insert (in prose), model fix

**Page re-render**:
The page writes its own data over a text node that pangu already spaced. The page does this in one of two ways: it sets the `Text` node's data again, or it removes the node and inserts a fresh one. For example, the page has `CJKA`. Pangu spaces it to `CJK A`. Then the page writes `CJKA` into the same node again, or replaces the node with one that holds `CJKA`. The page did not intend to remove the space. It only rendered its own data again, and its data never had the space. From pangu's view, the write undid its work. Common causes: a second render pass in React or Vue, a script that sets `textContent` from a variable, or a live region that refreshes on a timer. Pangu detects a page re-render by comparing the new data against the last data that pangu wrote to that node. Pangu then re-spaces the node inside the observer callback, before the browser paints. If the subtree is too large to re-space before paint, the node queues like other dynamic content.
_Avoid_: revert, external rewrite, overwrite

## Paranoid Text Spacing Algorithm

The algorithm behind text spacing. It has two stages. First, the rules decide every space. Second, AI spacing corrects the rules output at the few ambiguous shapes the rules cannot read. AI spacing is the Chrome extension's opt-in second stage. The npm package ships the rules only. The shapes below are generic: `CJK` is any CJK character, `A` is any letter, `N` is any digit, and symbols are literal.

### Rule-based Spacing

Source of truth: `src/shared/index.ts`. Exhaustive examples: the per-symbol files in `tests/shared/`.

**Symbol handling**:
A symbol between two ANS characters binds them into a joiner token, and the symbol never gets spaces. A symbol in direct contact with CJK reads as an operator and gets spaces, unless an affix reading attaches it to its ANS side. `/` also follows slash reading. `|` follows pipe reading. `+` follows plus reading. The separator `_` never gets spaces.

**Joiner token**:
ANS characters that any symbol joins tight (`A/B`, `26/30`, `vinta/hal-9000`, `S&P`, `Q&A`, `A+B`, `5+5`, `foo=bar&baz=1`, `A<B`, `HSIAO-MING`). A joiner token is never split. It is spaced from adjacent CJK as one unit. Slashes, pipes, and plus signs also follow slash reading, pipe reading, and plus reading.
_Avoid_: slash token, slash operand pair, &-token

**Slash reading**:
Decided per line, never across lines. A slash with ANS characters on both sides forms a joiner token. If a line has only one slash and that slash is in direct contact with CJK, the slash acts as an operator. If a line has repeated slashes, they read as a file path or a list and stay unspaced.

**Pipe reading**:
Decided per line, never across lines. If one pipe is in direct contact with CJK, every pipe on the line becomes a separator with spaces on both sides. This covers concatenated page titles (`CJK | A+ CJK | A`) and credit lines (`CJK | CJK`). If no pipe on the line is in direct contact with CJK, the pipes stay tight as joiner tokens (`CJK A|A CJK`, `ps aux|grep node`).

**Plus reading**:
Decided per line, never across lines. If one plus is in direct contact with CJK, every undecided plus on the line becomes a separator with spaces on both sides. This covers bundle plans (`A CJK + A`). A plus is already decided in three cases: it is adjacent to a space, an affix reading attaches it (`A+ CJK`, `CJK +N`), or it sits inside a preserved pattern (`C++`). If no plus on the line is in direct contact with CJK, the pluses stay tight as joiner tokens (`CJK A+A CJK`, `CJK N+N CJK`).

**Affix reading**:
A symbol that attaches to its ANS side at a CJK boundary instead of reading as an operator. Four cases: `+` before digits as a sign (`CJK +N`), `-` before a lowercase flag (`CJK -m CJK`), `+` after ANS characters as a suffix (`A+ CJK`, `CJK N+ CJK`), and single-letter grades (`A+`, `D-`). A hyphen before digits is not an affix: `CJK-N` reads as an operator (`N CJK - N CJK`, `CJK - N CJK`); see ADR 0015. A capitalized word after a hyphen keeps the operator reading (`CJK - Vinta`).

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
_Avoid_: tag-in-prose, prose tag

### AI Spacing

Source of truth: `docs/ai-spacing.md`. The decision to build it is ADR 0016.

**AI spacing**:
The extension's opt-in path. It sends each candidate to a classifier and applies the label as a late fix. It is never required: when the model is absent, off, or slow, the rules output is kept.
_Avoid_: model layer, hyphen-sign model layer

**Symbol sense disambiguation**:
Deciding which reading a symbol carries from the context around it, not from the symbol alone. It is the natural language processing (NLP) task of the same name. Slash, pipe, plus, and affix reading do it with heuristics. AI spacing does it with a classifier. Use this term to relate pangu to outside work. Name the specific reading when you describe the algorithm.
_Avoid_: symbol WSD, symbol disambiguation

**Ambiguous shape**:
A shape where the rules cannot derive the symbol's reading, so a classifier decides it. An ambiguous shape defines three things: what to flag, the menu of labels, and the fix for each label. Today, the only ambiguous shape is the hyphen sign: a hyphen-minus tight between CJK and a digit, which is read as a signed number or as a range or separator.
_Avoid_: symbol class, ambiguity, shape (bare, for this sense)

**Candidate**:
One occurrence of an ambiguous shape, flagged on the text before spacing. It carries the sentence around it for the classifier, and the position of the symbol after the rules ran.
_Avoid_: hyphen-sign candidate (as a term), span, ambiguous span, model span

**Classifier**:
The component that reads one candidate and answers with one label from a fixed menu. It never answers with text, so it can never rewrite an author's characters.
_Avoid_: LLM, AI (for the component)

**Label**:
The classifier's answer for one candidate. It is one of the fixed menu for its ambiguous shape: today, signed number, range or separator, or unsure.
_Avoid_: verdict (the rules' word), answer
