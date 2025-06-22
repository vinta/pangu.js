# TODO List

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

### Code Refactoring (Completed December 24, 2024)

- [x] Refactor utils-chrome.ts to class-based ExtensionManager
  - Converted interface to proper class structure
  - Improved encapsulation and type safety
- [x] Rename ExtensionManager to Utils and utils-chrome.ts to utils.ts
  - Simplified naming convention
  - Updated all imports and references
- [x] Rename ExtensionSettings interface to Settings
  - More concise naming throughout codebase
- [x] Fix TypeScript type errors
  - Fixed service-worker.ts type issues (Partial<Settings>, unknown types)
  - Fixed utils.ts initialization with DEFAULT_SETTINGS
  - Removed unused keepAlive function
- [x] Improve code separation of concerns
  - Moved playSound() out of toggleAutoSpacing()
  - Better modularity in utils.ts
- [x] UI/UX improvements
  - Fixed footer separator margins consistency
  - Added !important to margin utility classes
  - Removed custom footer link styling
- [x] Code quality improvements
  - Added ESLint array formatting rules
  - Fixed TypeScript strict mode compliance
  - Renamed settingsCache to cachedSettings

### Service Worker Improvements (Completed December 21, 2024)

- [x] Fix duplicate script ID error in Chrome extension service worker
  - Added proper script existence checking before registration
  - Improved error handling for expected scenarios
  - Replaced `<all_urls>` with explicit `http://*/*, https://*/*` patterns
- [x] Simplify content script registration
  - Removed unnecessary SCRIPT_ID filtering
  - Extract duplicated unregister logic into `unregisterAllContentScripts()` function
  - Reduced bundle size from 5.22 kB to 4.97 kB
- [x] Improve service worker initialization
  - Simplified `initializeSettings()` with cleaner Object.entries iteration
  - Removed nested try-catch blocks for better error flow
  - Added proper TypeScript type assertions

### Match Pattern Implementation (Completed December 21, 2024)

- [x] Implement new blacklist/whitelist settings with valid match patterns
  - Added `blacklist` and `whitelist` settings that require valid match patterns
  - Deprecated `blacklists` and `whitelists` (maintained for backward compatibility)
  - Use Chrome's `excludeMatches` API for efficient blacklist handling
- [x] Add match pattern validation in options page
  - Created `isValidMatchPattern()` function with regex validation
  - Added helpful error messages for invalid patterns
  - Added documentation link to Chrome match patterns guide
- [x] Update service worker to use excludeMatches
  - Blacklists now use `excludeMatches` instead of content script filtering
  - Whitelists use patterns directly as `matches`
  - More efficient as Chrome handles filtering at API level

### Deprecated Properties Removal (Completed December 22, 2024)

- [x] Remove deprecated blacklists/whitelists properties completely
  - Removed from Settings interface in types.ts
  - Removed from DEFAULT_SETTINGS in utils.ts
  - Removed all legacy handling logic from service-worker.ts
  - Simplified popup.ts status checking
  - Cleaned up options.ts to only use new properties
  - Updated zh_TW localization messages
  - Deleted unnecessary i18n-keys.md documentation
- [x] Fix options page errors
  - Fixed chrome.storage.sync access in options.ts and popup.ts
  - Added proper fallback for undefined URL arrays
  - Fixed forEach ESLint warnings with for...of loops
  - Fixed TypeScript type errors in utils.ts
- [x] Replace spacing_rule with filter_mode
  - Created new filter_mode setting key for cleaner separation
  - Updated all references throughout the codebase
  - Updated HTML, CSS, and i18n messages
  - No migration logic needed - clean break from old data

### Chrome Extension UI/UX Improvements (Completed December 22, 2024)

- [x] Clean up popup.ts code
  - Removed unused settings variable in updateStatus()
  - Renamed hideMessageDelaySeconds to hideMessageDelayMs
  - Added i18n support for success message "空格之神降臨"
  - Fixed ESLint errors
- [x] Rename auto-spacing toggle to spacing mode toggle
  - Updated variable names, element IDs, and function names
  - Improved code clarity and consistency
- [x] Simplify popup.ts structure
  - Replaced options link event listener with direct href
  - Merged multiple executeScript calls into single call
  - Moved script injection to catch block for cleaner flow
  - Removed explicit return type annotations
- [x] Improve error handling and user feedback
  - Consolidated sound effects into showError() and showSuccess()
  - Made error/success methods async for proper sound playback
  - Renamed i18n keys for consistency
- [x] Increase font sizes in popup for better readability
  - Title: base → lg (16px → 18px)
  - All other text: sm → base (14px → 16px)
  - Improved button padding

### i18n Completeness (Completed December 22, 2024)

- [x] Add i18n support for all missing UI strings
  - Added 12 new translation keys for buttons, placeholders, errors
  - Updated options.ts to use chrome.i18n.getMessage()
  - Added data-i18n attributes to HTML elements
  - Skipped i18n for universal terms (GitHub, Copyleft, version prefix)
- [x] Simplify options.ts code structure
  - Removed redundant setI18nText() method
  - Replaced saveSettings() wrapper with direct chrome.storage.sync.set()
  - Improved code organization

## 🚧 In Progress

## 📋 Next Steps

### Medium Priority - Code Quality

- [ ] Add proper Chrome API error handling
  - Check whether url is valid match pattern before register content script
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
