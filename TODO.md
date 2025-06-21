# TODO List

**Last Updated:** December 21, 2024, 2:45 PM

## 🎯 Completed

### Chrome Extension Migration (Completed December 2024)
- [x] Chrome Extension Manifest V3 compatibility
- [x] Remove Angular.js from Chrome Extension (saved ~194KB)
  - Migrated popup.js and options.js to TypeScript
  - Removed jQuery 2.1.0 and angular-xeditable dependencies
  - Implemented native contenteditable for URL editing
- [x] Convert all Chrome Extension JS files to TypeScript
  - background.js → background.ts
  - content_script.js → content-script.ts
  - utils_chrome.js → utils-chrome.ts
- [x] Set up Vite build configuration for Chrome Extension
- [x] Add TypeScript types for Chrome Extension APIs (@types/chrome)
- [x] Implement modern i18n with data-i18n attributes
- [x] Add service worker keep-alive mechanism
- [x] Improve error handling for invalidated contexts

### Core Library Improvements
- [x] Migrate all source code to TypeScript
- [x] Replace Webpack/Babel with Vite
- [x] Replace Mocha/Chai/Karma with Vitest/Playwright
- [x] Add UMD build format support
- [x] Enable full TypeScript strict mode
- [x] Set up ESLint and Prettier
- [x] Create `publish-package` script for version management
- [x] Set up GitHub Actions CI/CD workflow
- [x] Refactor TypeScript configuration with separate tsconfig files

### Chrome Extension Optimization (Completed December 2024)
- [x] Replace `tabs` permission with `activeTab`
  - Removes "Read browsing history" warning
  - Already uses currentWindow: true in popup.ts
- [x] Implement dynamic content script registration
  - Uses chrome.scripting.registerContentScripts()
  - Only loads scripts based on user settings
  - Respects blacklist/whitelist rules at registration time
- [x] Optimize pangu.js loading with on-demand injection
  - Content scripts load dynamically based on settings
  - Manual spacing only injects scripts when needed
- [x] Rename files to Chrome's kebab-case convention
  - utils_chrome.ts → utils-chrome.ts
  - content_script.ts → content-script.ts

## 🚧 In Progress

## 📋 Next Steps

### Medium Priority - Code Quality
- [ ] Add proper Chrome API error handling
  - Implement retry logic for script injection
  - User-friendly error messages
- [ ] Create optimized content script bundle
  - Separate minimal bundle for content scripts
  - Reduce memory footprint
- [ ] Update declarativeContent for action button state

### Low Priority - Future Enhancements
- [ ] Update extension icons for high DPI displays
- [ ] Implement performance monitoring
- [ ] Add optional_host_permissions for user control
- [ ] Progressive enhancement for older Chrome versions
- [ ] Implement tree-shaking optimizations
- [ ] Consider monorepo structure
- [ ] Add changelog generation with standard-version
- [ ] Publish to JSR (JavaScript Registry)
