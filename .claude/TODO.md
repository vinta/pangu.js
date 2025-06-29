# Development Progress

## Project Overview

pangu.js is a mature text spacing library that automatically inserts whitespace between CJK and half-width characters, with zero runtime dependencies. The project includes both a JavaScript library (npm package) and a Chrome extension (Manifest V3).

## Completed

### New Features

- [x] Blacklist/whitelist with Chrome match pattern validation (files: service-worker.ts, options.ts, popup.ts)
- [x] Chrome's `excludeMatches` API for efficient blacklist handling (files: service-worker.ts)
- [x] "Blacklist this" button in popup (files: popup.ts, popup.html)

### Regex Pattern Fixes

- [x] Fixed `AN_LEFT_BRACKET` for function calls like `a.getB()` (files: shared/index.ts)
- [x] Fixed pipe character `|` handling (#194) (files: shared/index.ts)
- [x] Fixed filesystem paths with special chars (#209, #218, #219) (files: shared/index.ts)
- [x] Fixed HTML tag spacing (#164) (files: shared/index.ts)
- [x] Fixed input field auto-spacing (#158) (files: browser/pangu.ts)
- [x] Fixed slash pattern conflicts (files: shared/index.ts)
- [x] Improved filesystem path pattern (files: shared/index.ts)
- [x] Fixed HTML comment spacing to handle `<!--content-->` properly (files: shared/index.ts)
  - Updated `FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET` pattern to support compound brackets
  - Ensures no spaces after `<!--` or before `-->`
- [x] Major algorithm update: Paranoid Text Spacing v6 (files: shared/index.ts)
  - Special handling for all bracket types: `()` `[]` `{}` `<>`
  - Improved slash `/` pattern handling

### Test Updates (2025-06-29)

- [x] Reorganized test file structure with clearer categorization (files: tests/shared/index.test.ts)
- [x] Updated test expectations to match new spacing rules
- [x] Added comprehensive test cases for operators, separators, and special symbols

## In Progress

### Current Focus: Implement Updated Spacing Rules

- [ ] Operator Rules Update
  - What's done: Analyzed test changes, identified missing operators
  - What's left: Add `< >` and `^` to operator regex patterns in shared/index.ts
  - Impact: Lines 66-67, 77-81 need updates

- [ ] Context-Aware Slash (`/`) Handling
  - What's done: Identified dual behavior requirement
  - What's left: Implement count-based logic (single = operator, multiple = separator)
  - Implementation: Need new regex patterns and logic around line 70

- [ ] Enhanced Hyphen (`-`) Handling
  - What's done: Identified compound word patterns (state-of-the-art)
  - What's left: Add detection for hyphenated compounds vs operators
  - Implementation: New pattern to detect compound words

- [ ] Special Programming Terms
  - What's done: Some cases handled (C++, A+)
  - What's left: Ensure consistent handling for all programming terms
  - Cases: `C++`, `i++`, `A+`, `D-`, `C#`, `F#`

- [ ] File Path Improvements
  - What's done: Basic Unix path detection exists
  - What's left: Better handling for dots in filenames, Windows paths
  - Implementation: Enhance FILESYSTEM_PATH pattern

- [ ] Separator Rules
  - What's done: Identified `_` and `|` should never get spaces
  - What's left: Ensure these are excluded from spacing rules
  - Implementation: May need to add protection patterns

## Upcoming Tasks

### High Priority

- [ ] Complete implementation of updated spacing rules based on test expectations
- [ ] Run all tests to ensure no regressions
- [ ] Add CSS `text-autospace` instructions in options page (Reason: Native browser feature is faster)

### Medium Priority

- [ ] Fix issue #201 - Spaces between image-separated text
- [ ] Fix issue #173 - Full-width quotes spacing (「」『』)
- [ ] Fix issue #169 - YouTube title persistence
- [ ] Fix issue #207 - Bilibili upload page layout breaking

### Low Priority

- [ ] Fix issue #216 - Markdown syntax protection
- [ ] Fix issue #161 - Comprehensive Markdown support

## Technical Decisions & Notes

- **Decision**: Reorganized test expectations to clarify operator vs separator rules | **Rationale**: Test file was growing unwieldy and inconsistent
- **Important**: All operators (`=`, `+`, `-`, `*`, `/`, `<`, `>`, `&`, `^`) should ALWAYS add spaces when CJK is present
- **Important**: All separators (`_`, `|`) should NEVER add spaces regardless of context
- **Context-Aware**: Slash `/` has dual behavior - single occurrence as operator, multiple as separator
- **Dependencies**: Zero runtime dependencies maintained

## Implementation Context (2025-06-29)

### Current State
- Version 6.1.0 with Paranoid Text Spacing algorithm
- 106 test cases covering various Unicode blocks
- Test file reorganized with clearer categorization
- Expected results updated for consistency

### Key File Locations
- Core logic: `src/shared/index.ts` (lines 35-99 contain regex patterns)
- Test expectations: `tests/shared/index.test.ts`
- Operator patterns: Lines 66-67, 77-81 in shared/index.ts
- Slash handling: Around line 70 in shared/index.ts

### Pattern Analysis Completed
- Identified missing operators: `^` needs to be added to operator regex
- Confirmed separators `_` and `|` are handled correctly
- Context-aware `/` handling needed for operator vs separator behavior
- Special programming terms (C++, A+, etc.) pattern enhancement needed

## Known Issues & Limitations

- [x] Investigated adjacent sibling spacing (YouTube hashtags) (files: tests/browser/pangu.playwright.ts)
  - What's done: Multiple approach attempts (sibling checking, post-processing, XPath mods)
  - Result: Fundamental XPath algorithm limitation

## Survey

- Survey `createTreeWalker()`
  - https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
- Survey `requestIdleCallback()`
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
