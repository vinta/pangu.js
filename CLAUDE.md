# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pangu.js is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability.

**Version**: 5.0.0  
**Language**: TypeScript (recently migrated from JavaScript)  
**Zero Runtime Dependencies**: Pure TypeScript/JavaScript implementation

**Main build targets:**
1. Chrome extension (Manifest V3) - Automatically adds spacing to web pages
2. npm package - JavaScript library for Node.js and browser use (ESM/CommonJS/UMD)

## Common Development Commands

### Building
```bash
npm run build              # Build all targets (shared, browser, node)
npm run build:shared       # Build shared/core module
npm run build:browser      # Build browser bundles (ESM + UMD)
npm run build:node         # Build Node.js modules (ESM + CommonJS)
npm run clean              # Clean all build artifacts
```

### Testing
```bash
npm test                   # Run all tests (vitest + playwright)
npm run test:shared        # Test core/shared logic
npm run test:browser       # Test browser code (uses Playwright)
npm run test:node          # Test Node.js-specific code
npm run test:watch         # Run vitest in watch mode
```

### Chrome Extension
```bash
npm run pack:chrome        # Package Chrome extension (Manifest V3)
npm run pack:firefox       # Package Firefox extension
npm run pack:chrome-simple # Quick pack using existing pangu.min.js
```

### Publishing
```bash
# npm package
npm publish               # Publish to npm registry

# Chrome extension
# Manual upload to Chrome Web Store after running npm run pack:chrome
```

## Code Architecture

### Directory Structure
```
src/
├── shared/              # Core text spacing logic (platform-agnostic)
│   └── index.ts        # Main Pangu class with regex patterns
├── browser/            # Browser-specific implementation
│   ├── pangu.ts       # BrowserPangu class with DOM manipulation
│   └── pangu.umd.ts   # UMD wrapper for browser builds
└── node/              # Node.js implementation
    ├── index.ts       # NodePangu class with file operations
    └── cli.ts         # Command-line interface
```

### Build Output Structure
```
dist/
├── shared/            # Core module (ESM)
├── browser/          # Browser builds
│   ├── pangu.js     # ESM bundle
│   └── pangu.umd.js # UMD bundle (window.pangu)
└── node/             # Node.js builds
    ├── index.js      # ESM module
    ├── index.cjs     # CommonJS module
    └── cli.js        # CLI executable
```

### Core API

**All Platforms:**
- `spacingText(text)` - Process text strings (main method)
- `spacing(text)` - Alias for spacingText() for backward compatibility

**Browser-specific:**
- `spacingNode(node)` - Process DOM nodes
- `spacingElementById(id)` - Process element by ID
- `spacingElementByClassName(className)` - Process elements by class
- `spacingElementByTagName(tagName)` - Process elements by tag
- `spacingPageTitle()` - Process page title
- `spacingPageBody()` - Process page body
- `spacingPage()` - Process entire page
- `autoSpacingPage()` - Auto-spacing with MutationObserver

**Node.js-specific:**
- `spacingFile(path)` - Process files asynchronously
- `spacingFileSync(path)` - Process files synchronously

### Import/Export Patterns

```javascript
// Browser ESM
import { pangu, BrowserPangu } from 'pangu'
pangu.spacingText('你好world')

// Browser UMD (script tag)
window.pangu.spacingText('你好world')
window.pangu.BrowserPangu // Class constructor

// Node.js ESM
import { pangu, NodePangu } from 'pangu'
await pangu.spacingFile('input.txt')

// Node.js CommonJS
const { pangu, NodePangu } = require('pangu')
pangu.spacingFileSync('input.txt')
```

### Build System
- **Build Tool**: Vite 6.x with TypeScript
- **TypeScript**: Configured with separate tsconfig files for browser/node
- **Output Formats**: ESM, CommonJS, and UMD
- **Source Maps**: Generated for all builds
- **Type Definitions**: Auto-generated .d.ts files

### Testing Strategy
- **Unit Tests**: Vitest for shared/node code
- **Browser Tests**: Playwright for cross-browser testing
- **Test Fixtures**: Located in `tests/_fixtures/`
- **Coverage**: 106 tests covering various Unicode blocks

### Chrome Extension
- **Manifest Version**: V3 (modern Chrome extension format)
- **Location**: `browser_extensions/chrome/`
- **Built File**: Gets copied to `browser_extensions/chrome/vendors/pangu/pangu.min.js`
- **UI Framework**: Angular.js 1.2.9 (legacy, planned for removal)

## Development Guidelines

### TypeScript Migration
- Currently using moderate strictness (`noImplicitAny: false`)
- Gradually migrating to full strict mode
- Use type annotations for new code
- Preserve existing JavaScript patterns during migration

### Unicode Support
The library supports comprehensive CJK character ranges:
- CJK Radicals and Kangxi Radicals
- Hiragana, Katakana, Bopomofo
- CJK Unified Ideographs (all extensions)
- Half-width and full-width forms

### Code Style
- Follow existing patterns in the codebase
- Use ESLint with Airbnb style guide
- Maintain zero runtime dependencies
- Keep regex patterns readable with comments

## Git Commit Guidelines

When Claude Code creates commits in this repository, always include co-authorship:

```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Future Improvements (from TODO.md)
- Complete TypeScript strict mode migration
- Remove Angular.js from Chrome extension (200KB+ reduction)
- Set up GitHub Actions CI/CD
- Upgrade to ESLint 9 with TypeScript support
- Modernize Chrome extension UI with vanilla JS or lightweight framework