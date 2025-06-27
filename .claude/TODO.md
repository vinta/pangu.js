# Development Progress

## Project Overview

pangu.js is a mature text spacing library that automatically inserts whitespace between CJK and half-width characters, with zero runtime dependencies. The project includes both a JavaScript library (npm package) and a Chrome extension (Manifest V3).

## Completed

### New Features

- [x] Blacklist/whitelist with Chrome match pattern validation (files: service-worker.ts, options.ts, popup.ts)
- [x] Chrome's `excludeMatches` API for efficient blacklist handling (files: service-worker.ts)
- [x] "Blacklist this" button in popup (files: popup.ts, popup.html)

### Regex Pattern Fixes

- [x] Fixed `AN_LEFT_BRACKET` for function calls like `a.getB()` (files: shared/index.ts)
- [x] Fixed pipe character `|` handling (#194) (files: shared/index.ts)
- [x] Fixed filesystem paths with special chars (#209, #218, #219) (files: shared/index.ts)
- [x] Fixed HTML tag spacing (#164) (files: shared/index.ts)
- [x] Fixed input field auto-spacing (#158) (files: browser/pangu.ts)
- [x] Fixed slash pattern conflicts (files: shared/index.ts)
- [x] Improved filesystem path pattern (files: shared/index.ts)
- [x] Fixed HTML comment spacing to handle `<!--content-->` properly (files: shared/index.ts)
  - Updated `FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET` pattern to support compound brackets
  - Ensures no spaces after `<!--` or before `-->`
- [x] Major algorithm update: Paranoid Text Spacing v6 (files: shared/index.ts)
  - Special handling for all bracket types: `()` `[]` `{}` `<>`
  - Improved slash `/` pattern handling

## In Progress

- [ ] None

## Upcoming Tasks

### High Priority

- [ ] Add CSS `text-autospace` instructions in options page (Reason: Native browser feature is faster)

### Medium Priority

- [ ] Fix issue #201 - Spaces between image-separated text
- [ ] Fix issue #173 - Full-width quotes spacing (「」『』)
- [ ] Fix issue #169 - YouTube title persistence
- [ ] Fix issue #207 - Bilibili upload page layout breaking

### Low Priority

- [ ] Fix issue #216 - Markdown syntax protection
- [ ] Fix issue #161 - Comprehensive Markdown support

## Known Issues & Limitations

- [x] Investigated adjacent sibling spacing (YouTube hashtags) (files: tests/browser/pangu.playwright.ts)
  - What's done: Multiple approach attempts (sibling checking, post-processing, XPath mods)
  - Result: Fundamental XPath algorithm limitation
