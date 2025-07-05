# Development Progress

## Completed

### Paranoid Text Spacing Algorithm v6

- [x] **Context-Aware Symbol Handling**
  - Operators (`=` `+` `-` `*` `/` `<` `>` `&` `^`): ALWAYS add spaces when CJK is present
  - Separators (`_` `|`): NEVER add spaces regardless of context
  - Dual-behavior slash `/`: Single occurrence = operator, multiple = separator
- [x] **Smart Pattern Recognition**
  - Compound words: `state-of-the-art`, `GPT-5`, `claude-4-opus` preserved
  - Programming terms: `C++`, `A+`, `i++`, `D-`, `C#`, `F#` handled correctly
  - File paths: Unix (`/usr/bin`, `src/main.py`) and Windows (`C:\Users\`) protected
  - Special brackets: `()` `[]` `{}` `<>` with content-aware spacing
- [x] Function call spacing: `a.getB()` no longer becomes `a.getB ()`
- [x] HTML tag attributes: Proper spacing around `=` in attributes
- [x] Input field auto-spacing: Fixed to prevent breaking form functionality (#158)
- [x] Pipe character `|`: Now correctly treated as separator (#194)
- [x] Filesystem paths: Special characters in paths preserved (#209, #218, #219)

### Paranoid Text Spacing Algorithm v7

- [x] Migrated from `XPath` to `TreeWalker` API
- [x] `MutationObserver` with idle processing for dynamic content
- [x] CSS visibility check for hidden elements (sr-only, visually-hidden)

## In Progress

No task in progress

## Upcoming Tasks

### Medium Priority

- [ ] Fix issue #155 - DO NOT spacing URL
  - `https://xxxxx/不要加空格.html`
  - `https://%E5%A6%82`
- [ ] Fix issue #201 - Spaces between image-separated text
- [ ] Fix issue #173 - Full-width quotes spacing, `「」` and `『』`
- [ ] Fix issue #169 - YouTube title persistence
- [ ] Fix issue #207 - Bilibili upload page layout breaking

### Low Priority

- [ ] Add CSS `text-autospace` instructions in options page (Reason: Native browser feature is faster)
- [ ] Handle HTML comment spacing: `<!-- content -->`
- [ ] Fix issue #161 #216 - Comprehensive Markdown support
