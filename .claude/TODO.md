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

### XPath to TreeWalker Migration (Phases 1-6)

- [x] **Phase 1**: Create TreeWalker text collection helper (`collectTextNodes`)
- [x] **Phase 2**: Migrate `spacingNode()` method from XPath to TreeWalker
- [x] **Phase 3**: Extract core processing logic into `processTextNodes()`
- [x] **Phase 4**: Migrate `spacingElementByTagName()` and `spacingElementById()`
- [x] **Phase 5**: Migrate `spacingElementByClassName()` and page methods
- [x] **Phase 6**: Remove XPath infrastructure completely
- **Result**: Achieved 5.5x performance improvement in text node traversal
- Fixed whitespace detection issue between span elements

## In Progress

No task in progress

## Upcoming Tasks

### High Priority

- [x] **Phase 7: Performance Monitoring** ✅ COMPLETED
  - Added PerformanceMonitor class with timing measurements
  - Integrated performance tracking in key methods (spacingPage, collectTextNodes, processTextNodes)
  - Added public API for accessing performance data and controlling monitoring
  - Supports both development logging and programmatic access
  - Established baseline metrics for requestIdleCallback integration

- [ ] **Phase 8-10: requestIdleCallback Integration**
  - [ ] Phase 8: Add requestIdleCallback polyfill and IdleQueue infrastructure
  - [ ] Phase 9: Make initial page spacing non-blocking with chunking
  - [ ] Phase 10: Extend idle processing to MutationObserver for dynamic content
- [ ] **CSS Visibility Check with requestIdleCallback**
  - Check computed styles during idle time to detect visually hidden elements
  - Avoid adding spaces between hidden and visible elements (e.g., screen-reader-only text)
  - Make it opt-in via configuration to maintain backward compatibility
  - Related to issue with hidden-adjacent-node.html fixture where pangu.js adds space after visually hidden "Description:" element
  - Consider common patterns: sr-only, visually-hidden, clip: rect(1px)

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
