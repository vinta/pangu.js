# pangu.js

Automatic whitespace insertion between CJK and ANS characters, delivered as a text engine, a Node.js tool, a browser DOM processor, and a Chrome extension built on them.

## Language

**CJK**:
The class of Chinese, Japanese, and Korean characters that every spacing rule keys on.

**ANS**:
Alphabetical letters, numerical digits, and symbols that trigger spacing when adjacent to CJK. Named for its three parts, parallel to CJK; `A`, `N`, and `S` also name the sub-classes in code and shapes.

**Text run**:
One string of text spaced as a unit. On a page, the data of one `Text` node. The unit text spacing works within and boundary spacing works between.
_Avoid_: run (bare), text node (in prose), chunk, span

**Text spacing**:
Inserting whitespace between CJK and ANS characters within one text run.
_Avoid_: paranoid spacing

**Boundary spacing**:
Deciding whether and where whitespace goes at the boundary between adjacent rendered text runs on a page, including boundaries interrupted by markup or hidden content. Distinct from text spacing, which operates within one text run.
_Avoid_: pair spacing, adjacent-node spacing

**Pangu element**:
A marker element injected to render a space at a boundary where neither adjacent text run may be modified.
_Avoid_: space element

**Native autospacing**:
Visual-only spacing the browser renders where CJK meets ANS letters or digits, inserting no character, so copied text is unchanged. Narrower than a real space, blind to symbols, and skipped wherever a real space already exists, so it layers safely under text spacing and boundary spacing.
_Avoid_: CSS spacing, autospace mode, text-autospace (in prose)

**Symbol sense disambiguation**:
Deciding which reading a symbol carries from the context around it, rather than from the symbol alone. Borrowed from the established NLP task of the same name. Slash reading, pipe reading, plus reading, and affix reading are all heuristic implementations of it, so it names something the algorithm already does; the hyphen-sign model layer (`docs/hyphen-sign-model-layer.md`) does it explicitly for one shape. Use the term to relate pangu to outside work. When describing the algorithm itself, name the specific reading.
_Avoid_: symbol WSD, symbol disambiguation

**Hyphen-sign candidate**:
A hyphen-minus flagged on pre-spacing text as sitting tight between CJK and a digit, carrying the sentence around it for a classifier to read and the settled position of the space the rules inserted. The only shape the hyphen-sign model layer ever sees; everything else on a page stays rules-only.
_Avoid_: ambiguous span, model span

**Late fix**:
A correction to the rules output, applied after the rules pass and decided by something other than the rules, such as a classifier. Only ever inserts or removes spaces, never rewrites author characters, and with no classifier the rules output stands. Today's only late fix takes back out the space the rules inserted at a hyphen-sign candidate read as a signed number (`氣溫是 - 5` becomes `氣溫是 -5`).
_Avoid_: un-insert (in prose), model fix

## Paranoid Text Spacing Algorithm

The algorithm behind text spacing. Source of truth: `src/shared/index.ts`, exhaustive examples: the per-symbol files in `tests/shared/`. Shapes below are generic: `CJK` is any CJK character, `A` any letter, `N` any digit, symbols are literal.

**Symbol handling**:
A symbol between two ANS characters binds them into a joiner token and never gets spaces. A symbol in direct contact with CJK reads as an operator and gets spaces, unless an affix reading attaches it to its ANS side. `/` additionally follows slash reading, `|` follows pipe reading, and `+` follows plus reading. The separator `_` never gets spaces.

**Joiner token**:
ANS characters joined tight by any symbol (`A/B`, `26/30`, `vinta/hal-9000`, `S&P`, `Q&A`, `A+B`, `5+5`, `foo=bar&baz=1`, `A<B`, `HSIAO-MING`). Never split, and spaced from adjacent CJK as one unit. Slashes, pipes, and plus signs additionally follow slash reading, pipe reading, and plus reading.
_Avoid_: slash token, slash operand pair, &-token

**Slash reading**:
Decided per line, never across lines. A slash with ANS characters on both sides forms a joiner token. A line's only slash acts as an operator when CJK touches it. Repeated slashes on a line read as a file path or a list and stay unspaced.

**Pipe reading**:
Decided per line, never across lines. A pipe in direct CJK contact makes every pipe on the line a separator with spaces on both sides, covering concatenated page titles (`CJK | A+ CJK | A`) and credit lines (`CJK | CJK`). A line whose pipes touch no CJK keeps them tight as joiner tokens (`CJK A|A CJK`, `ps aux|grep node`).

**Plus reading**:
Decided per line, never across lines. A plus in direct contact with CJK makes every undecided plus on the line a separator with spaces on both sides, covering bundle plans (`A CJK + A`). A plus is decided when it is already space-adjacent, attached by an affix reading (`A+ CJK`, `CJK +N`), or inside a preserved pattern (`C++`). A line with no such contact keeps its pluses tight as joiner tokens (`CJK A+A CJK`, `CJK N+N CJK`).

**Affix reading**:
A symbol that attaches to its ANS side at a CJK boundary instead of reading as an operator: `+` before digits as a sign (`CJK +N`), `-` before a lowercase flag (`CJK -m CJK`), `+` after ANS characters as a suffix (`A+ CJK`, `CJK N+ CJK`), and single-letter grades (`A+`, `D-`). A hyphen before digits is not an affix: `CJK-N` reads as an operator (`N CJK - N CJK`, `CJK - N CJK`), see ADR 0015. A capitalized word after a hyphen keeps the operator reading (`CJK - Vinta`).

**No CJK contact, no change**:
The invariant behind every symbol rule. ANS text that touches no CJK is never modified. A symbol must touch CJK directly to read as an operator, so CJK elsewhere in the line or text never licenses spacing between ANS characters.

**Pattern preservation**:
Compound words (`state-of-the-art`, `GPT-5`, `claude-4-opus`), programming terms (`C++`, `A+`, `i++`, `D-`, `C#`, `F#`), arrow tokens (`=>`, `->`), glob patterns (`*.log`, `templates/*.html`), and file paths (`/usr/bin`, `src/main.py`, `C:\Users\`) keep their internal shape, even where an operator reading would otherwise apply.

**Punctuation**:
Half-width punctuation is not converted to full-width, with two exceptions: a colon in direct CJK contact right before a parenthesis becomes the full-width colon `\uFF1A`, and middle dots (`\u00B7` `\u2022` `\u2027`) normalize to the katakana middle dot `\u30FB`. Multiple consecutive punctuation marks are preserved. One or more of `!` `;` `,` `?` directly touching CJK on the right always gets a trailing space regardless of what precedes it (`(N CJK),CJK`, `N%,CJK`), so a stray space typed before the mark is rewritten rather than preserved.

**HTML**:
Tags are protected from spacing rules. Text inside attributes is processed. The exception is a tag mention, which is spaced.

**Tag mention**:
A bare tag with no attributes, a non-void name, and no closing counterpart anywhere in the text, self-closing or not (`CJK <div> CJK`, `CJK List<String> CJK`, `CJK <Spinner /> CJK`). Reads as one unit mentioned in prose rather than markup: spaced at direct CJK contact, tight against ANS characters. Paired tags, void elements (`<br>`, `<br />`), and tags with attributes stay protected markup.
_Avoid_: tag-in-prose, prose tag
