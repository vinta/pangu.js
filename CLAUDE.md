# CLAUDE.md

Extends: `@~/.claude/CLAUDE.md` (mandatory base instructions)

Everything in the base instructions MUST be followed strictly.

## Project Overview

pangu.js is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability.

**Language**: TypeScript (migrated from JavaScript)

**Dependencies**: Zero runtime dependencies

**Main build targets:**

1. Chrome extension (Manifest V3) - Automatically adds spacing to web pages
2. npm package - JavaScript library for Node.js and browser use (ESM/CommonJS/UMD)

## Common Development Commands

### Building

```bash
npm run build              # Build all targets (library + extension)
npm run build:lib          # Build library (shared, browser, node)
npm run build:extension    # Build Chrome extension TypeScript files
npm run clean              # Clean all build artifacts
```

### Testing

```bash
npm run test               # Run all tests (vitest + playwright)
npm run test:shared        # Test core/shared logic
npm run test:node          # Test Node.js-specific code
npm run test:browser       # Test browser code (uses Playwright)
```

### Linting

```bash
npm run lint               # Run ESLint on src/ and scripts/
npm run lint:fix           # Run ESLint with auto-fix
```

### Publishing & Packaging

```bash
# Version management
npm run publish-package 1.2.3   # Bump version, update docs, build, commit, and tag

# Extension packaging
npm run pack-extension          # Package both Chrome and Firefox extensions
npm run pack-extension:chrome   # Package Chrome extension only (.zip)
npm run pack-extension:firefox  # Package Firefox extension only (.xpi)
```

## Code Architecture

### Directory Structure

```
src/
├── shared/            # Core text spacing logic (platform-agnostic)
│   └── index.ts       # Main Pangu class with regex patterns
├── browser/           # Browser-specific implementation
│   ├── pangu.ts       # BrowserPangu class with DOM manipulation
│   └── pangu.umd.ts   # UMD wrapper for browser builds
└── node/              # Node.js implementation
    ├── index.ts       # NodePangu class with file operations
    └── cli.ts         # Command-line interface
```

### Build Output Structure

```
dist/                           # Library builds
├── shared/                     # Core module
│   ├── index.js                # ESM module
│   └── index.cjs               # CommonJS module
├── browser/                    # Browser builds
│   ├── pangu.js                # ESM bundle
│   └── pangu.umd.js            # UMD bundle (window.pangu)
└── node/                       # Node.js builds
    ├── index.js                # ESM module
    ├── index.cjs               # CommonJS module
    ├── cli.js                  # CLI executable (ESM)
    └── cli.cjs                 # CLI executable (CommonJS)
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

### Import Patterns

```javascript
// Browser ESM
import { pangu, BrowserPangu } from 'pangu';
pangu.spacingText('你好world');

// Browser UMD (script tag)
window.pangu.spacingText('你好world');
window.pangu.BrowserPangu; // Class constructor

// Node.js ESM
import { pangu, NodePangu } from 'pangu';
await pangu.spacingFile('input.txt');

// Node.js CommonJS
const { pangu, NodePangu } = require('pangu');
pangu.spacingFileSync('input.txt');
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
- **Source**: TypeScript files in `browser_extensions/chrome/src/`
- **Build Output**: `browser_extensions/chrome/dist/`
- **Build Command**: `npm run build:extension`
- **Permissions**: Uses `activeTab` instead of broad `tabs` permission
- **Content Scripts**: Dynamically registered based on user settings
- **Match Patterns**: Uses Chrome's match pattern format for blacklist/whitelist
- **UI Framework**: Pure TypeScript

### Chrome Extension Architecture

- **Service Worker**: `service-worker.ts` - Handles background tasks and content script registration
- **Content Script**: `content-script.ts` - Injected into web pages for auto-spacing
- **Popup**: `popup.ts` - Extension popup UI
- **Options**: `options.ts` - Settings page
- **Utils**: `utils/` - Shared utilities

#### Settings Structure

```typescript
interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click';
  spacing_rule: 'blacklist' | 'whitelist';
  blacklist: string[]; // Valid match patterns only
  whitelist: string[]; // Valid match patterns only
  is_mute_sound_effects: boolean;
}
```

#### Match Patterns

The extension uses Chrome's match pattern format for URL filtering:

- Format: `<scheme>://<host><path>`
- Example: `*://example.com/*`
- [Chrome Match Pattern Documentation](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns)

## Development Guidelines

### Code Style

- Follow existing patterns in the codebase
- ESLint with unicorn/prefer-node-protocol enabled
- Maintain zero runtime dependencies
- Keep regex patterns readable with comments
- Always use `node:` prefix for Node.js built-in modules

## Future Improvements

See @.claude/TODO.md for planned improvements and technical debt.
