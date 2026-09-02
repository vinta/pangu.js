# pangu.js

Automatic whitespace insertion between CJK and ANS characters, delivered as a text engine, a Node.js tool, a browser DOM processor, and a Chrome extension built on them.

## Language

**CJK**:
The class of Chinese, Japanese, and Korean characters that every spacing rule keys on.

**ANS**:
Alphabetical letters, numerical digits, and symbols that trigger spacing when adjacent to CJK. Named for its three parts, parallel to CJK; `A`, `N`, and `S` also name the sub-classes in code and shapes.

**Text run**:
One string the rules receive whole: on a page the data of one `Text` node, for the string API the entire input.
_Avoid_: run (bare), text node (in prose), chunk, span

**Text spacing**:
Inserting whitespace between CJK and ANS characters within one text run.
_Avoid_: paranoid spacing

**Boundary spacing**:
Deciding whether and where whitespace goes between two adjacent text runs on a page: `CJK<b>A</b>` gets the space at the start of the `A` run, `CJK<a>A</a>` at the end of the `CJK` run because a link, underline, or strike-through would render a space added inside it, and `<a>A</a><a>CJK</a>` gets a pangu element between the links. Nothing is added where whitespace or a block edge already separates the runs, across an ignored tag such as `<code>`, or against a hidden run.
_Avoid_: pair spacing, adjacent-node spacing

**Pangu element**:
An inline `<pangu>` element holding one space, inserted between two text runs that both sit in a link, underline, or strike-through, where a space added inside either run would render as part of it (`<a>A</a><pangu> </pangu><a>CJK</a>`). Never inserted inside a grid or flex container, where it would become a layout item.
_Avoid_: space element, marker element

**Native text-autospace**:
The gap the browser renders through the `text-autospace` CSS property between CJK and ANS letters or digits: visual only, no character inserted, narrower than a real space, blind to symbols, and suppressed wherever a real space already exists, so it layers under text spacing and boundary spacing without doubling up.
_Avoid_: native autospacing, text autospace, CSS spacing, autospace mode, text-autospace (bare, in prose)

**Late fix**:
A correction to the rules output, applied after the rules pass and decided by something other than the rules, such as a classifier. Only ever inserts or removes spaces, never rewrites author characters, and with no classifier the rules output stands. Today's only late fix takes back out the space the rules inserted at a candidate read as a signed number (`CJK - N` becomes `CJK -N`).
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

## AI Spacing

Spacing decided by a classifier where the rules cannot tell two readings apart. Source of truth: `docs/ai-spacing.md`; the decision to build it is ADR 0016.

**AI spacing**:
The extension's opt-in path that hands each candidate to a classifier and lands its label as a late fix. Never load-bearing: with the model absent, off, or slow, the rules output stands.
_Avoid_: model layer, hyphen-sign model layer

**Symbol sense disambiguation**:
Deciding which reading a symbol carries from the context around it rather than from the symbol alone; the NLP task of the same name. Slash, pipe, plus, and affix reading do it heuristically and AI spacing does it with a classifier, so use the term to relate pangu to outside work and name the specific reading when describing the algorithm.
_Avoid_: symbol WSD, symbol disambiguation

**Ambiguous shape**:
A shape where the rules cannot derive the symbol's reading, so a classifier decides it: what to flag, the menu of labels, and the fix per label. Today's only ambiguous shape is the hyphen sign, a hyphen-minus tight between CJK and a digit, read as a signed number or as a range or separator.
_Avoid_: symbol class, ambiguity, shape (bare, for this sense)

**Candidate**:
One occurrence of an ambiguous shape, flagged on pre-spacing text, carrying the sentence around it for the classifier and where the symbol sits after the rules ran.
_Avoid_: hyphen-sign candidate (as a term), span, ambiguous span, model span

**Classifier**:
The component that reads one candidate and answers with one label from a fixed menu, never with text, so it can never rewrite an author's characters.
_Avoid_: LLM, AI (for the component)

**Label**:
The classifier's answer for one candidate, one of the fixed menu for its ambiguous shape: today signed number, range or separator, or unsure.
_Avoid_: verdict (the rules' word), answer
