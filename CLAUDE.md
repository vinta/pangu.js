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
npm run watch              # Watch both library and extension files
npm run watch:lib          # Watch library files for changes
npm run watch:extension    # Watch extension files (uses nodemon)
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
├── shared/                    # Core text spacing logic (platform-agnostic)
│   └── index.ts               # Main Pangu class with regex patterns
├── browser/                   # Browser-specific implementation
│   ├── pangu.ts               # BrowserPangu class with DOM manipulation
│   ├── pangu.umd.ts           # UMD wrapper for browser builds
│   ├── dom-walker.ts          # DOM tree traversal utilities
│   ├── task-scheduler.ts      # Idle-time task scheduling
│   ├── visibility-detector.ts # CSS visibility detection
│   └── banner.txt             # Build banner text
└── node/                      # Node.js implementation
    ├── index.ts               # NodePangu class with file operations
    ├── index.cjs.ts           # CommonJS re-export wrapper
    └── cli.ts                 # Command-line interface
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

**All Platforms (Shared):**

- `spacingText(text)` - Process text strings (main method)
- `hasProperSpacing(text)` - Check if text already has proper spacing

**Node.js-specific (NodePangu):**

- `spacingFile(path)` - Process files asynchronously (returns Promise)
- `spacingFileSync(path)` - Process files synchronously

**Browser-specific (BrowserPangu):**

- `spacingPage()` - Process entire page (title + body)
- `spacingNode(node)` - Process specific DOM node and its descendants
- `autoSpacingPage(config?)` - Auto-spacing with MutationObserver
  - `config.pageDelayMs` - Delay before initial page spacing (default: 1000ms)
  - `config.nodeDelayMs` - Delay before spacing new nodes (default: 500ms)
  - `config.nodeMaxWaitMs` - Max wait time for node mutations (default: 2000ms)
- `stopAutoSpacingPage()` - Stop auto-spacing
- `isElementVisuallyHidden(element)` - Check if element is hidden by CSS
- `taskScheduler.config` - Task scheduling configuration (direct property access)
- `visibilityDetector.config` - Visibility detection configuration (direct property access)

### Build System

- **Build Tool**: Vite 6.x with TypeScript
- **TypeScript**: Configured with separate tsconfig files for browser/node
- **Output Formats**: ESM, CommonJS, and UMD
- **Source Maps**: Generated for all builds
- **Type Definitions**: Auto-generated .d.ts files with vite-plugin-dts
- **Watch Mode**: Concurrent watch for library and extension development

### Testing Strategy

- **Unit Tests**: Vitest 3.x for shared/node code
- **Browser Tests**: Playwright 1.53.x for cross-browser testing
- **Test Fixtures**: Located in `fixtures/`
- **Coverage**: 106 tests covering various Unicode blocks
- **Test Structure**: Separate test directories for shared, node, and browser code

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
- **Utils**: `utils/` - Shared utilities including type definitions

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
  enabled: boolean; // Default: true in VisibilityDetector, false in BrowserPangu
  commonHiddenPatterns: {
    clipRect: boolean; // clip: rect(1px, 1px, 1px, 1px)
    displayNone: boolean; // display: none
    visibilityHidden: boolean; // visibility: hidden
    opacityZero: boolean; // opacity: 0
    heightWidth1px: boolean; // height: 1px; width: 1px
  };
}
```

#### Task Scheduler Configuration

```typescript
interface TaskSchedulerConfig {
  enabled: boolean; // Whether to use task scheduling
  chunkSize: number; // Number of tasks to process per chunk
  timeout: number; // Timeout between chunks in milliseconds
}
```

## Development Guidelines

### Code Style

- Follow existing patterns in the codebase
- ESLint 9.x with unicorn/prefer-node-protocol enabled
- Prettier 3.x with @trivago/prettier-plugin-sort-imports
- Maintain zero runtime dependencies
- Keep regex patterns readable with comments
- Always use `node:` prefix for Node.js built-in modules

### Implementation Details

- Core spacing logic: `src/shared/index.ts`
- Core test cases: `tests/shared/index.test.ts`
- Browser DOM processing: Uses TreeWalker API for 5.5x performance improvement
- Idle processing: Uses requestIdleCallback() for non-blocking operations
- Visibility detection: Detects CSS-hidden elements to avoid unnecessary spacing
- Task scheduling: `src/browser/task-scheduler.ts` - Manages task queue for async processing
- Visibility detector: `src/browser/visibility-detector.ts` - Checks element visibility

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
