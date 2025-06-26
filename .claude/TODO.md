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
- [x] Fixed pipe character `|` handling - removed from operator patterns (#194)
- [x] Fixed filesystem path patterns to support special characters like `@`, `+`, dots (#209, #218, #219)
  - Enhanced pattern to match paths like `/node_modules/@babel/core`
- [x] Fixed HTML tag spacing - tags no longer get spaces inside them (#164)
  - Implemented placeholder system to protect HTML tags during processing
  - Attribute values still get processed for spacing
- [x] Fixed input field auto-spacing (#158)
  - Added `input` to `ignoredTags` regex in browser implementation
  - Prevents spacing in form fields, login/registration forms
- [x] Fixed slash pattern conflict with filesystem paths
  - Removed `/` from `CJK_ANS` pattern to prevent spacing in patterns like `陳上進/vinta`
  - Made filesystem path pattern more specific to avoid false matches
- [x] Improved filesystem path pattern to be less aggressive
  - Changed from matching any `/something` to only known system directories
  - Removed the `FIX_NAME_SLASH` workaround as it's no longer needed
  - Pattern now only matches paths starting with system dirs like `/home`, `/usr`, `/etc`, or `/node_modules`

## In Progress

- [ ] None currently active

## Next Steps

### High Priority - Unfixed Issues

- [ ] Fix issue #173 - Full-width curved quotes shouldn't have spaces
  - Full-width quotation marks (「」『』) are being incorrectly spaced
  - These are punctuation marks in CJK languages and shouldn't be separated

### Medium Priority - Unfixed Issues

- [ ] Fix issue #201 - Spaces inserted between image-separated text
  - When images are used as separators, unwanted spaces are added
- [ ] Fix issue #207 - Breaking Bilibili upload page layout
  - Auto-spacing interferes with specific website functionality
  - May need site-specific rules or better element detection

### Low Priority - Unfixed Issues

- [ ] Fix issue #169 - YouTube title persistence bug
  - Changes to YouTube titles don't persist
  - May be related to YouTube's dynamic content updates
- [ ] Fix issue #216 - Add support for skipping Markdown syntax
  - Markdown formatting (like `**bold**`, `_italic_`) gets broken by spacing
  - Need to protect Markdown syntax during processing
- [ ] Fix issue #161 - Markdown syntax support
  - Similar to #216, need comprehensive Markdown protection

### Feature Enhancements

- [ ] Generate different size icons from `icon_1500.svg`
- [ ] Add a button for "把這個網址加到黑名單" in popup page
  - Which only add `https://example.com/*` instead of the entire url
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
