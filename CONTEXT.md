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

The algorithm behind text spacing. Source of truth: `src/shared/index.ts`, exhaustive examples: `tests/shared/index.test.ts`.

**Symbol handling**:
Operators (`=` `+` `-` `*` `/` `<` `>` `&` `^`) get spaces when CJK is adjacent. Separators (`_` `|`) never do.

**Joiner token**:
Half-width characters joined tight by a slash or ampersand (`A/B`, `26/30`, `vinta/hal-9000`, `S&P`, `Q&A`). Never split, and spaced from adjacent CJK as one unit. Ampersands need no per-line reading; slashes follow slash reading.
_Avoid_: slash token, slash operand pair, &-token

**Slash reading**:
Decided per line, never across lines. A slash with half-width characters on both sides forms a joiner token. A line's only slash acts as an operator when CJK touches it. Repeated slashes on a line read as a file path or a list and stay unspaced.

**No CJK contact, no change**:
The invariant behind every symbol rule. A run of half-width text that touches no CJK is never modified, no matter what appears elsewhere in the line or text.

**Pattern preservation**:
Compound words (`state-of-the-art`, `GPT-5`, `claude-4-opus`), programming terms (`C++`, `A+`, `i++`, `D-`, `C#`, `F#`), and file paths (`/usr/bin`, `src/main.py`, `C:\Users\`) keep their internal shape. A letter grade before CJK becomes `A+ `, not `A + `.

**Punctuation**:
Half-width punctuation is never converted to full-width. Multiple consecutive punctuation marks are preserved.

**HTML**:
Tags are protected from spacing rules. Text inside attributes is processed.

## Agent Skill Overrides

**improve-codebase-architecture**: write the Architecture Review HTML report to `./tmp/architecture-review-<timestamp>.html` (repo root) instead of the OS temp directory, so it survives a reboot. `/tmp/` is already gitignored via `~/.gitignore_global`; no further ignore rule needed.
