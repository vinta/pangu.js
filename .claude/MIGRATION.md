# XPath to TreeWalker + requestIdleCallback Migration Plan

## Overview

This document outlines a phased migration plan to improve pangu.js performance by:
1. Replacing XPath with TreeWalker API (5.5x performance improvement)
2. Integrating requestIdleCallback for non-blocking text processing

## Guiding Principles

- Each phase does ONE thing only
- Maintain ALL existing functionality
- Release after each successful phase
- Simple changes first, complex later
- No backward compatibility required

## Phase 1: Create TreeWalker Text Collection Helper

**Goal**: Build foundation with a simple helper function

**Changes**:
- Add `collectTextNodes()` helper method that uses TreeWalker
- Matches XPath's `normalize-space()` behavior
- Returns array of text nodes in document order

**Implementation**:
```typescript
private collectTextNodes(contextNode: Node, reverse = false): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(
    contextNode,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Replicate normalize-space() - skip whitespace-only nodes
        if (!/\S/.test(node.nodeValue || '')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  
  return reverse ? nodes.reverse() : nodes;
}
```

**Testing**: Unit tests for helper function only
**Release**: No release needed (internal helper)

## Phase 2: Migrate spacingNode() Method

**Goal**: Replace simplest XPath usage first

**Changes**:
- Update `spacingNode()` to use `collectTextNodes()`
- Currently uses: `.//text()[normalize-space(.)]`
- Maintain reverse processing order

**Before**:
```typescript
const xPathQuery = './/text()[normalize-space(.)]';
this.spacingNodeByXPath(xPathQuery, contextNode);
```

**After**:
```typescript
const textNodes = this.collectTextNodes(contextNode, true);
this.processTextNodes(textNodes);
```

**Testing**: Verify spacingNode() behaves identically
**Release**: Yes, after testing passes

## Phase 3: Extract Core Processing Logic

**Goal**: Separate node processing from node collection

**Changes**:
- Extract the for-loop logic from `spacingNodeByXPath` into `processTextNodes(nodes: Node[])`
- Make `spacingNodeByXPath` call the new method
- No behavior changes

**Benefits**:
- Reusable processing logic
- Easier testing
- Prepares for other methods

**Testing**: Existing tests should pass unchanged
**Release**: Yes, after verification

## Phase 4: Migrate Simple Element Methods

**Goal**: Convert methods with straightforward XPath queries

**Methods to migrate**:
1. `spacingElementByTagName()` - `//${tagName}//text()`
2. `spacingElementById()` - `id("${idName}")//text()`

**Implementation**:
```typescript
public spacingElementByTagName(tagName: string) {
  const elements = document.getElementsByTagName(tagName);
  for (const element of elements) {
    const textNodes = this.collectTextNodes(element, true);
    this.processTextNodes(textNodes);
  }
}
```

**Testing**: Test each method individually
**Release**: Yes, after each method works

## Phase 5: Migrate Complex Element Methods

**Goal**: Handle methods with complex XPath queries

**Methods to migrate**:
1. `spacingElementByClassName()` - Complex class matching
2. `spacingPageTitle()` - Specific path query
3. `spacingPageBody()` - Complex exclusion filters

**Challenges**:
- Tag exclusion logic (script, style, textarea)
- Maintain exact query behavior

**Testing**: Extensive testing with edge cases
**Release**: Yes, after thorough validation

## Phase 6: Remove XPath Infrastructure

**Goal**: Clean up obsolete code

**Changes**:
- Remove `spacingNodeByXPath()` method
- Update all remaining callers
- Remove XPath-related comments

**Testing**: Full regression test suite
**Release**: Yes, major version bump

## Phase 7: Add Performance Monitoring

**Goal**: Measure improvement and establish baseline

**Changes**:
- Add timing measurements for text processing
- Log performance metrics in development mode
- Create benchmarks for common scenarios

**Benefits**:
- Verify 5.5x improvement claim
- Baseline for requestIdleCallback phase

**Release**: Yes, with metrics disabled in production

## Phase 8: Prepare requestIdleCallback Foundation

**Goal**: Add necessary infrastructure without changing behavior

**Changes**:
- Add `requestIdleCallback` polyfill
- Create `IdleQueue` class for managing work items
- Add configuration for idle processing

**Implementation**:
```typescript
class IdleQueue {
  private queue: (() => void)[] = [];
  private isProcessing = false;
  
  add(work: () => void) {
    this.queue.push(work);
    this.scheduleProcessing();
  }
  
  private scheduleProcessing() {
    if (!this.isProcessing && this.queue.length > 0) {
      this.isProcessing = true;
      requestIdleCallback((deadline) => this.process(deadline));
    }
  }
  
  private process(deadline: IdleDeadline) {
    while (deadline.timeRemaining() > 0 && this.queue.length > 0) {
      const work = this.queue.shift();
      work?.();
    }
    
    this.isProcessing = false;
    if (this.queue.length > 0) {
      this.scheduleProcessing();
    }
  }
}
```

**Testing**: Unit tests for queue behavior
**Release**: No release needed (unused code)

## Phase 9: Integrate Idle Processing for Initial Page Load

**Goal**: Make initial spacing non-blocking

**Changes**:
- Modify `processTextNodes()` to support chunking
- Use requestIdleCallback for `spacingPage()`
- Add progress tracking

**Configuration**:
```typescript
interface IdleSpacingConfig {
  enabled: boolean;
  chunkSize: number;
  timeout: number;
}
```

**Testing**: Test on heavy pages (Wikipedia, MDN)
**Release**: Yes, with feature flag

## Phase 10: Extend Idle Processing to MutationObserver

**Goal**: Make dynamic content updates non-blocking

**Changes**:
- Update `setupAutoSpacingPageObserver()` to use idle queue
- Batch mutations for efficient processing
- Maintain debouncing behavior

**Benefits**:
- Smooth scrolling on infinite scroll sites
- Better performance on dynamic SPAs

**Testing**: Test on dynamic sites (Twitter, Facebook)
**Release**: Yes, final optimization complete

## Success Metrics

1. **Performance**: 5.5x faster text node traversal
2. **Responsiveness**: No UI freezing on heavy pages
3. **Compatibility**: All existing features work identically
4. **User Experience**: Progressive text spacing visible to users

## Rollback Plan

Each phase is independently revertible:
- Git tags for each release
- Feature flags where appropriate
- Performance metrics to detect regressions

## Timeline Estimate

- Phase 1-3: 1 week (foundation)
- Phase 4-6: 2 weeks (main migration)
- Phase 7-8: 1 week (monitoring & prep)
- Phase 9-10: 2 weeks (idle integration)

Total: ~6 weeks for complete migration with testing