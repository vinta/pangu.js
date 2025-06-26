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

### Testing & Investigation

- [x] Investigated adjacent sibling spacing (YouTube hashtags) (files: tests/browser/pangu.playwright.ts)
  - What's done: Multiple approach attempts (sibling checking, post-processing, XPath mods)
  - Result: Fundamental XPath algorithm limitation
  - Test skipped at line 195 with documentation

## In Progress

### Current Focus

- [ ] Fix spacing between span and link elements (YouTube hashtag case)
  - What's done: Investigation complete, limitation documented
  - What's left: Architectural changes needed for proper fix
  - Blockers: Current XPath-based approach can't handle adjacent siblings
  - Workaround: Use CSS margins/padding for visual spacing

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

- Issue: Adjacent sibling elements don't get spaced | Impact: YouTube hashtags, inline elements
- Workaround: Use CSS margins or require architectural rewrite for proper fix
- Issue: Performance on very large DOM trees | Impact: Slow initial load on heavy pages
- Workaround: Skip auto-spacing option, manual trigger
