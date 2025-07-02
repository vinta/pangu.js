# CLAUDE.md

Extends: @~/.claude/CLAUDE.md (mandatory base instructions)

Everything in the base instructions MUST be followed strictly.

## Project Overview

`pangu.js` is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability.

- Language: TypeScript (migrated from JavaScript)
- Dependencies: Zero runtime dependencies
- Build targets:
  1. npm package - JavaScript library for Node.js and browser use (ESM/CommonJS/UMD)
  2. Chrome extension (Manifest V3) - Automatically adds spacing to web pages

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
npm run pack-extension          # Package browser extensions
npm run pack-extension:chrome   # Package Chrome extension only (.zip)
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
- `hasProperSpacing(text)` - Check if text already has proper spacing

**Browser-specific:**

- `spacingNode(node)` - Process DOM nodes
- `spacingElementById(id)` - Process element by ID
- `spacingElementByClassName(className)` - Process elements by class
- `spacingElementByTagName(tagName)` - Process elements by tag
- `spacingPageTitle()` - Process page title
- `spacingPageBody()` - Process page body
- `spacingPage()` - Process entire page
- `autoSpacingPage(config?)` - Auto-spacing with MutationObserver
- `stopAutoSpacingPage()` - Stop auto-spacing
- `updateIdleSpacingConfig(config)` - Configure idle processing behavior
- `getIdleSpacingConfig()` - Get current idle processing config
- `updateVisibilityCheckConfig(config)` - Configure visibility checking
- `getVisibilityCheckConfig()` - Get current visibility check config
- `isElementVisuallyHidden(element)` - Check if element is hidden by CSS

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
- **Test Fixtures**: Located in `fixtures/`
- **Coverage**: 106 tests covering various Unicode blocks

### Chrome Extension

- **Manifest Version**: V3 (modern Chrome extension format)
- **Location**: `browser-extensions/chrome/`
- **Source**: TypeScript files in `browser-extensions/chrome/src/`
- **Build Output**: `browser-extensions/chrome/dist/`
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
  blacklist: string[];
  whitelist: string[];
  is_mute_sound_effects: boolean;
}
```

#### Idle Processing Configuration

```typescript
interface IdleSpacingConfig {
  enabled: boolean; // Default: true
  chunkSize: number; // Default: 40 (text nodes per cycle)
  timeout: number; // Default: 2000ms
}
```

#### Visibility Check Configuration

```typescript
interface VisibilityCheckConfig {
  enabled: boolean; // Default: false
  commonHiddenPatterns: {
    clipRect: boolean; // clip: rect(1px, 1px, 1px, 1px)
    displayNone: boolean; // display: none
    visibilityHidden: boolean; // visibility: hidden
    opacityZero: boolean; // opacity: 0
    heightWidth1px: boolean; // height: 1px; width: 1px
  };
}
```

## Development Guidelines

### Code Style

- Follow existing patterns in the codebase
- ESLint with unicorn/prefer-node-protocol enabled
- Maintain zero runtime dependencies
- Keep regex patterns readable with comments
- Always use `node:` prefix for Node.js built-in modules

### Implementation Details

- Core spacing logic: `src/shared/index.ts`
- Core test cases: `tests/shared/index.test.ts`
- Browser DOM processing: Uses TreeWalker API for 5.5x performance improvement
- Idle processing: Uses requestIdleCallback() for non-blocking operations
- Visibility detection: Detects CSS-hidden elements to avoid unnecessary spacing

### Performance Optimizations v7

- **TreeWalker Migration**: Replaced XPath with TreeWalker API for ~5.5x performance gain
- **Idle Processing**: Heavy operations use requestIdleCallback() to prevent blocking
- **Visibility Checks**: Skip spacing for CSS-hidden elements (disabled by default)
- **Debounced MutationObserver**: Batches DOM mutations for efficient processing

### Paranoid Text Spacing Algorithm v7

**Core Features:**

- **Context-Aware Symbol Handling**:

  - Operators (`= + - * / < > & ^`): Always add spaces when CJK is present
  - Separators (`_ |`): Never add spaces regardless of context
  - Dual-behavior slash `/`: Single occurrence = operator (add spaces), multiple = file path separator (no spaces)

- **Smart Pattern Recognition**:

  - Preserves compound words: `state-of-the-art`, `GPT-5`, `claude-4-opus`
  - Handles programming terms correctly: `C++`, `A+`, `i++`, `D-`, `C#`, `F#`
  - Protects file paths: Unix (`/usr/bin`, `src/main.py`) and Windows (`C:\Users\`)
  - Special handling for grades: `A+` before CJK becomes `A+ ` not `A + `

- **Improved Punctuation**:

  - No longer converts half-width punctuation to full-width
  - Smart handling of quotes, brackets, and special characters
  - Preserves multiple consecutive punctuation marks

- **HTML Support**:

  - Processes text within HTML attributes while preserving tag structure
  - Protects HTML tags from being altered by spacing rules

- **Performance Enhancements**:
  - 5.5x faster with TreeWalker API replacing XPath
  - Non-blocking processing with requestIdleCallback()
  - CSS visibility detection to skip hidden elements

## Future Improvements

See @.claude/TODO.md for planned improvements and technical debt.
