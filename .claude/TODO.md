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

- [ ] Provide a less aggressive approach: `text-autospace` in CSS
  - https://developer.chrome.com/blog/css-i18n-features
  - https://github.com/sparanoid/chinese-copywriting-guidelines/issues/211

### Medium Priority - Code Quality

- [ ] Generate different size icons from `icon_1500.svg`
- [ ] Improve Chrome API error handling with retry logic
- [ ] Create optimized content script bundle to reduce memory footprint
- [ ] Update declarativeContent for action button state

### Low Priority - Future Enhancements

- [ ] Add "之後不要在這個網頁召喚空格之神了" to popup actions or context menu
- [ ] Add `optional_host_permissions` for user control
- [ ] Use Verified CRX uploads
- [ ] Implement tree-shaking optimizations
- [ ] Publish to JSR (JavaScript Registry)
