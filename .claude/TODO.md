# Development Progress

## Project Overview

pangu.js is a mature text spacing library that automatically inserts whitespace between CJK and half-width characters, with zero runtime dependencies. The project includes both a JavaScript library (npm package) and a Chrome extension (Manifest V3).

## Completed

### New Features

- [x] Blacklist/whitelist with Chrome match pattern validation (files: service-worker.ts, options.ts, popup.ts)
- [x] Chrome's `excludeMatches` API for efficient blacklist handling (files: service-worker.ts)
- [x] "把這個網址加到黑名單" button in popup (files: popup.ts, popup.html)
  - Only adds domain pattern `https://example.com/*` instead of full URL
- [x] Dynamic title spacing for SPAs like YouTube (files: content-script.ts, browser/pangu.ts)
  - Observes both document.body and document.head mutations
  - Debounced re-spacing for title changes
  - Fixed title observer in `setupAutoSpacingPageObserver()`

### Optimization

- [x] Replace `tabs` with `activeTab` permission (files: manifest.json)
- [x] Dynamic content script registration (files: service-worker.ts)
- [x] On-demand pangu.js injection (files: service-worker.ts, content-script.ts)
- [x] Skip auto-spacing for non-CJK pages (files: content-script.ts)

### Regex Pattern Fixes

- [x] Fixed `AN_LEFT_BRACKET` for function calls like `a.getB()` (files: shared/index.ts)
  - Added negative lookbehind `(?<!\\.[A-Za-z0-9]*)`
- [x] Fixed pipe character `|` handling (#194) (files: shared/index.ts)
- [x] Fixed filesystem paths with special chars (#209, #218, #219) (files: shared/index.ts)
  - Supports paths like `/node_modules/@babel/core`
- [x] Fixed HTML tag spacing (#164) (files: shared/index.ts)
  - Placeholder system protects tags during processing
- [x] Fixed input field auto-spacing (#158) (files: browser/pangu.ts)
  - Added `input` to `ignoredTags` regex
- [x] Fixed slash pattern conflicts (files: shared/index.ts)
  - Removed `/` from `CJK_ANS` pattern
  - Made filesystem path pattern more specific
- [x] Improved filesystem path pattern (files: shared/index.ts)
  - Only matches system directories like `/home`, `/usr`, `/etc`, `/node_modules`

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

- [ ] Improve `autoSpacingPage()` performance for large DOM trees (Reason: User experience on heavy pages)
  - Reference: @.claude/researches/performance-optimization.md

### Medium Priority

- [ ] Fix extra space in Gmail table `<span> 3</span>`
- [ ] Fix issue #201 - Spaces between image-separated text
- [ ] Fix issue #173 - Full-width quotes spacing (「」『』)
- [ ] Fix issue #169 - YouTube title persistence
- [ ] Fix issue #207 - Bilibili upload page layout breaking
- [ ] Add CSS `text-autospace` instructions in options page (Reason: Native browser feature is faster)
  - Guide to `chrome://flags/#enable-experimental-web-platform-features`
  - Auto-detect and use when available
  - Explain performance benefits

### Low Priority

- [ ] Use Verified CRX uploads
- [ ] Implement tree-shaking optimizations
- [ ] Publish to JSR (JavaScript Registry)
- [ ] Fix issue #216 - Markdown syntax protection
- [ ] Fix issue #161 - Comprehensive Markdown support

## Technical Decisions & Notes

- **Decision**: Use placeholder system for HTML tags | **Rationale**: Prevents breaking tag structure while allowing attribute processing
- **Decision**: Dynamic content script injection | **Rationale**: Better performance, only loads when needed
- **Decision**: `activeTab` over `tabs` permission | **Rationale**: Reduces permission warnings, better privacy
- **Important**: XPath text node selection has fundamental limitations with adjacent siblings
- **Dependencies**: Zero runtime dependencies (design goal)

## Known Issues & Limitations

- Issue: Adjacent sibling elements don't get spaced | Impact: YouTube hashtags, inline elements
- Workaround: Use CSS margins or require architectural rewrite for proper fix
- Issue: Performance on very large DOM trees | Impact: Slow initial load on heavy pages
- Workaround: Skip auto-spacing option, manual trigger
