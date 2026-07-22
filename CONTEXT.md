# pangu.js

Automatic whitespace insertion between CJK and half-width characters, delivered as a text engine, a Node.js tool, a browser DOM processor, and a Chrome extension built on them.

## Language

**CJK**:
The class of Chinese, Japanese, and Korean characters that every spacing rule keys on.

**Half-width**:
Alphabetical letters, numerical digits, and symbols that trigger spacing when adjacent to CJK.
_Avoid_: ANS, alphanumeric

**Text spacing**:
Inserting whitespace between CJK and half-width characters within a single run of text.
_Avoid_: paranoid spacing

**Boundary spacing**:
Deciding whether and where whitespace goes at the boundary between adjacent rendered text runs on a page, including boundaries interrupted by markup or hidden content. Distinct from text spacing, which operates within one run.
_Avoid_: pair spacing, adjacent-node spacing

**Pangu element**:
A marker element injected to render a space at a boundary where neither adjacent text run may be modified.
_Avoid_: space element

## Paranoid Text Spacing Algorithm

The algorithm behind text spacing. Source of truth: `src/shared/index.ts`, exhaustive examples: the per-symbol files in `tests/shared/`.

**Symbol handling**:
A symbol between two half-width characters binds them into a joiner token and never gets spaces. A symbol in direct contact with CJK reads as an operator and gets spaces, unless an affix reading attaches it to its half-width side. `/` additionally follows slash reading and `|` follows pipe reading. The separator `_` never gets spaces.

**Joiner token**:
Half-width characters joined tight by any symbol (`A/B`, `26/30`, `vinta/hal-9000`, `S&P`, `Q&A`, `A+B`, `5+5`, `foo=bar&baz=1`, `A<B`, `HSIAO-MING`). Never split, and spaced from adjacent CJK as one unit. Slashes and pipes additionally follow slash reading and pipe reading.
_Avoid_: slash token, slash operand pair, &-token

**Slash reading**:
Decided per line, never across lines. A slash with half-width characters on both sides forms a joiner token. A line's only slash acts as an operator when CJK touches it. Repeated slashes on a line read as a file path or a list and stay unspaced.

**Pipe reading**:
Decided per line, never across lines. A pipe in direct CJK contact makes every pipe on the line a separator with spaces on both sides, covering concatenated page titles (`型號 | Disney+ 幫助中心 | TW`) and credit lines (`作詞 | 林夕`). A line whose pipes touch no CJK keeps them tight as joiner tokens (`條件是 x|y 的情況`, `ps aux|grep node`).

**Affix reading**:
A symbol that attaches to its half-width side at a CJK boundary instead of reading as an operator: `+` or `-` before digits as a sign (`打 +886`, `氣溫是 -5 度`), `-` before a lowercase flag (`參數要加 -m 的旗標`), `+` after a half-width run as a suffix (`Disney+ 上架`, `有 100+ 的選擇`), and single-letter grades (`A+`, `D-`). A capitalized word after a hyphen keeps the operator reading (`陳上進 - Vinta`).

**No CJK contact, no change**:
The invariant behind every symbol rule. Half-width text that touches no CJK is never modified. A symbol must touch CJK directly to read as an operator, so CJK elsewhere in the line or text never licenses spacing between half-width characters.

**Pattern preservation**:
Compound words (`state-of-the-art`, `GPT-5`, `claude-4-opus`), programming terms (`C++`, `A+`, `i++`, `D-`, `C#`, `F#`), arrow tokens (`=>`, `->`), glob patterns (`*.log`, `templates/*.html`), and file paths (`/usr/bin`, `src/main.py`, `C:\Users\`) keep their internal shape, even where an operator reading would otherwise apply.

**Punctuation**:
Half-width punctuation is never converted to full-width. Multiple consecutive punctuation marks are preserved.

**HTML**:
Tags are protected from spacing rules. Text inside attributes is processed.

## Agent Skill Overrides

**improve-codebase-architecture**: write the Architecture Review HTML report to `./tmp/architecture-review-<timestamp>.html` (repo root) instead of the OS temp directory, so it survives a reboot. `/tmp/` is already gitignored via `~/.gitignore_global`; no further ignore rule needed.

**handoff**: write handoff documents to `./tmp/handoff-<topic>.md` (repo root) instead of the OS temp directory, for the same reasons.
