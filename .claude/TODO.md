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
- [x] Optimize pangu.js loading with on-demand injection

### Match Pattern Implementation

- [x] Implement blacklist/whitelist with Chrome match pattern validation
- [x] Use Chrome's `excludeMatches` API for efficient blacklist handling
- [x] Add match pattern validation with helpful error messages

## In Progress

- [ ] None currently

## Next Steps

### High Priority - Features

- [ ] Generate different size icons from `icon_1500.svg`
- [ ] Add instructions in options page for enabling experimental CSS text-autospace
  - Guide users to `chrome://flags/#enable-experimental-web-platform-features`
  - Auto-detect and use CSS text-autospace when available
  - Provide clear benefits explanation (better performance, native spacing)
  - Show only to Chrome users (not relevant for Safari/Firefox)
- [ ] Add "之後不要在這個網頁召喚空格之神了" to popup actions or context menu
- [ ] Add `optional_host_permissions` for user control

### Medium Priority - Code Quality

- [ ] No need to perform spacing if there is no CJK in webpages
  - Though I'm not sure "detecting whether there is CJK" is quick enough as an earlier return
- [ ] Improve `autoSpacingPage()` performance, especially with a large DOM tree
  - See "Performance Optimization - Async Spacing Architecture" section below
- [ ] Improve Chrome API error handling with retry logic
- [ ] Create optimized content script bundle to reduce memory footprint
- [ ] Update declarativeContent for action button state

### Low Priority - Future Enhancements

- [ ] Use Verified CRX uploads
- [ ] Implement tree-shaking optimizations
- [ ] Publish to JSR (JavaScript Registry)

## Performance Optimization - Async Spacing Architecture

### Current Performance Issues

- **Synchronous DOM traversal**: `spacingPage()` blocks UI with XPath snapshot of entire DOM
- **No chunking**: Processes all text nodes in single blocking loop
- **Heavy regex operations**: ~20 regex patterns per text node on main thread
- **No early optimization**: Processes pages without CJK content
- **MutationObserver limitations**: Still uses synchronous `spacingNode()` for updates

### Proposed Solutions

#### 1. Text Processing in Service Worker

- Extract text from DOM in content script
- Send to service worker for regex processing (off main thread)
- Return processed text to content script for DOM updates
- **Benefit**: Heavy regex operations don't block UI

#### 2. Chunked Processing with requestIdleCallback

- Process DOM nodes in small batches during browser idle time
- Yield control back to browser between chunks
- **Benefit**: Maintains responsive UI during processing

#### 3. Web Workers for Text Processing

- Inject dedicated Web Worker from content script
- Pass text batches to worker for parallel processing
- **Benefit**: True parallel processing of text

#### 4. Intersection Observer for Viewport Processing

- Only process visible text initially
- Defer off-screen content until scrolled into view
- **Benefit**: Faster initial page load

#### 5. Offscreen Document API

- Use Chrome's Offscreen API for heavy DOM processing
- Process large batches without blocking visible tab
- **Benefit**: Complete isolation from user's browsing experience

### Recommended Architecture

Combine multiple approaches:

1. **Initial scan**: Use Intersection Observer for visible content only
2. **Background processing**: Send non-visible text to service worker in batches
3. **Incremental updates**: Use requestIdleCallback for processing queue
4. **Smart batching**: Group similar text patterns for efficient regex application
5. **Early CJK detection**: Skip processing for non-CJK pages

### Implementation Notes

- Service workers cannot directly access DOM (must use message passing)
- Content scripts have isolated DOM access but run on main thread
- Consider memory usage when batching large amounts of text
- Maintain compatibility with existing API while adding async options
