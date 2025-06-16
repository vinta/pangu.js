# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pangu.js is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability.

**Main build targets:**
1. Chrome extension (Manifest V3) - Automatically adds spacing to web pages
2. npm package - JavaScript library for Node.js and browser use

## Common Development Commands

### Building the npm Package
```bash
npm run build         # Build all targets (shared, browser, node)
npm run build:browser # Build browser bundle for npm (dist/browser/pangu.js)
npm run build:node    # Build Node.js module for npm (dist/node/index.js)
```

### Building the Chrome Extension
```bash
# Using existing pangu.min.js (no npm install needed):
npm run pack:chrome-simple     # Creates browser_extensions/paranoid-auto-spacing.zip

# Or if you want to rebuild everything:
npm run build:browser          # Build the browser bundle
npm run pack:chrome-modern     # Package Chrome extension
```

### Testing
```bash
npm test              # Run all tests (vitest + playwright)
npm run test:shared   # Test core/shared logic
npm run test:browser  # Test browser-specific code (uses Playwright)
npm run test:node     # Test Node.js-specific code
```

### Development Watch Mode
```bash
npm run test:watch    # Run vitest in watch mode
```

### Publishing
```bash
# npm package
npm publish          # Publish to npm registry

# Chrome extension
# Manual upload to Chrome Web Store after running npm run pack:chrome
```

### Linting
```bash
npx eslint src/       # Lint source code (uses Airbnb style guide)
npx eslint test/      # Lint test code
```

## Code Architecture

### Key Files for Main Build Targets

**Chrome Extension:**
- `browser_extensions/chrome/` - Extension source (manifest, popup, content scripts)
- `src/browser/pangu.js` - Browser library that gets bundled for the extension
- Built file copied to: `browser_extensions/chrome/vendors/pangu/pangu.min.js`

**npm Package:**
- `dist/browser/pangu.js` - Browser entry point (UMD bundle)
- `dist/node/index.js` - Node.js entry point (CommonJS)
- `package.json` - Defines `main` (Node.js) and `browser` fields

### Directory Structure
- `src/shared/` - Core text spacing logic (platform-agnostic)
- `src/browser/` - Browser-specific implementation with DOM manipulation
- `src/node/` - Node.js implementation with file processing and CLI
- `dist/` - Built output (generated, not in source control)
- `browser_extensions/` - Browser extension source code
- `tests/` - Test files mirroring src structure

### Core API
The main functionality is exposed through these methods:
- `spacing(text)` - Process text strings (all platforms)
- `spacingFile(path)` - Process files asynchronously (Node.js only)
- `spacingElement*()` - Process DOM elements (Browser only)
- `autoSpacingPage()` - Auto-spacing with MutationObserver (Browser only)

### Build System
- Babel for ES6+ transpilation
- Webpack for browser bundling (UMD module)
- No runtime dependencies (zero-dependency library)
- Terser for minification of browser builds

### Testing Strategy
- Vitest for unit tests (shared/node)
- Playwright for browser testing
- Test fixtures in `tests/_fixtures/` containing HTML and text samples
- Tests are organized by platform (shared/browser/node)