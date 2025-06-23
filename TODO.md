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

### Settings Cleanup

- [x] Remove deprecated blacklists/whitelists properties
- [x] Replace spacing_rule with filter_mode for cleaner separation

### UI/UX Improvements

- [x] Increase font sizes in popup for better readability
- [x] Improve error handling with consolidated showError() and showSuccess() methods
- [x] Add "沒有東西" empty state message for blacklist/whitelist
- [x] Fix whitelist validation bug in service worker

### i18n Improvements

- [x] Add i18n support for all UI strings (12 new translation keys)
- [x] Implement data-i18n attributes for automatic translation

## In Progress

- [ ] None currently

## Next Steps

### Medium Priority - Code Quality

- [ ] Improve Chrome API error handling with retry logic
- [ ] Create optimized content script bundle to reduce memory footprint
- [ ] Update declarativeContent for action button state

### Low Priority - Future Enhancements

- [ ] Update extension icons for high DPI displays
- [ ] Add `optional_host_permissions` for user control
- [ ] Progressive enhancement for older Chrome versions
- [ ] Implement tree-shaking optimizations
- [ ] Consider monorepo structure
- [ ] Add changelog generation with standard-version
- [ ] Publish to JSR (JavaScript Registry)
