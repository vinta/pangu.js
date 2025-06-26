# TODO List

## Completed

### Major Migrations

- [x] Chrome Extension Manifest V3 compatibility
- [x] Remove Angular.js from Chrome Extension (saved ~194KB)
- [x] Convert all Chrome Extension JS files to TypeScript
- [x] Migrate all source code to TypeScript with strict mode
- [x] Replace Webpack/Babel with Vite
- [x] Replace Mocha/Chai/Karma with Vitest/Playwright

### Chrome Extension Optimization

- [x] Replace `tabs` permission with `activeTab` (removes "Read browsing history" warning)
- [x] Implement dynamic content script registration with chrome.scripting API
- [x] Optimize `pangu.js` loading with on-demand injection
- [x] Skip auto spacing if there is no CJK content in webpages

### Match Pattern Implementation

- [x] Implement blacklist/whitelist with Chrome match pattern validation
- [x] Use Chrome's `excludeMatches` API for efficient blacklist handling
- [x] Add match pattern validation with helpful error messages

### Regex Pattern Fixes

- [x] Fixed `AN_LEFT_BRACKET` pattern to prevent adding spaces in function calls like `a.getB()`
  - Added negative lookbehind `(?<!\\.[A-Za-z0-9]*)` to exclude patterns after dots

## In Progress

- [ ] Fix `FIX_SLASH_AS` pattern (src/shared/index.ts:63)
  - Currently failing test: `/home和/root是Linux中的頂級目錄` produces `/home 和 / root` instead of `/home 和 /root`
  - Need to distinguish between filesystem paths and text separators
  - Multiple attempts made with lookahead/lookbehind patterns

## Next Steps

### High Priority

- [ ] Generate different size icons from `icon_1500.svg`
- [ ] Add a button for "Add this url to blacklist" in popup page or context menu

### Medium Priority

- [ ] Improve `autoSpacingPage()` performance, especially with a large DOM tree
  - See @.claude/researches/performance-optimization.md
- [ ] Add instructions in options page for enabling experimental CSS `text-autospace`
  - Guide users to `chrome://flags/#enable-experimental-web-platform-features`
  - Auto-detect and use CSS text-autospace when available
  - Provide clear benefits explanation (better performance, native spacing)

### Low Priority - Future Enhancements

- [ ] Use Verified CRX uploads
- [ ] Implement tree-shaking optimizations
- [ ] Publish to JSR (JavaScript Registry)
