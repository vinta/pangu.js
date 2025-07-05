# Research: Async/Sync Method Separation Analysis

## Date: 2025-01-05

## Research Question
Should pangu.js separate async and sync methods to simplify the codebase?

## Current Architecture Analysis

### The Problem
The current code has complex configuration-based behavior that creates multiple execution paths:

```typescript
// Current implementation has 4+ execution paths
if (this.visibilityDetector.config.enabled) {
  if (this.taskScheduler.config.enabled) {
    // Path 1: async with batch processing
    this.taskScheduler.queue.add(() => {
      this.spacingTextNodes(textNodes);
    });
  } else {
    // Path 2: sync with batch processing
    this.spacingTextNodes(textNodes);
    onComplete?.();
  }
} else {
  if (this.taskScheduler.config.enabled) {
    // Path 3: async with chunked processing
    this.taskScheduler.processInChunks(textNodes, task, onComplete);
  } else {
    // Path 4: sync with chunked processing
    processor(items);
    onComplete?.();
  }
}
```

### Call Flow Analysis
```
autoSpacingPage()
↓
spacingPage()
↓
spacingNode()
   - Collects text nodes via DomWalker.collectTextNodes()
   - Decision point: taskScheduler.config.enabled?
     ├─ YES → calls spacingTextNodesInQueue()
     └─ NO  → calls spacingTextNodes() directly (synchronous)
↓
spacingTextNodesInQueue() (only if taskScheduler enabled)
   - Decision point: visibilityDetector.config.enabled?
     ├─ YES → Process all nodes in one batch
     └─ NO → Process in chunks via taskScheduler.processInChunks()
↓
TaskQueue.add() → scheduleProcessing() → requestIdleCallback()
```

## Proposed Solution: Explicit Async/Sync Methods

### API Design
```typescript
// Async versions (non-blocking, use requestIdleCallback)
async spacingPage(): Promise<void>
async spacingNode(node: Node): Promise<void>
async autoSpacingPage(config?: AutoSpacingPageConfig): Promise<void>

// Sync versions (blocking, immediate processing)
spacingPageSync(): void
spacingNodeSync(node: Node): void
autoSpacingPageSync(config?: AutoSpacingPageConfig): void
```

### Benefits
1. **Remove ~250 lines of configuration logic**
2. **Eliminate complex branching conditions**
3. **Self-documenting API** - method name indicates behavior
4. **Better TypeScript support** - clear Promise vs void returns
5. **Simpler mental model** - no need to understand config interactions

### Implementation Examples

#### Minimal Core (~60 lines)
```typescript
class MinimalPangu {
  spacing(node: Node): void {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    
    while (walker.nextNode()) {
      if (walker.currentNode instanceof Text && walker.currentNode.data.trim()) {
        textNodes.push(walker.currentNode);
      }
    }
    
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      node.data = this.spacingText(node.data);
      
      if (i > 0 && this.needsSpaceBetween(textNodes[i-1], node)) {
        node.data = ' ' + node.data;
      }
    }
  }
}
```

#### Simplified Async Implementation
```typescript
async spacingNode(node: Node): Promise<void> {
  const textNodes = DomWalker.collectTextNodes(node, true);
  
  // Always use idle callbacks for async version
  for (let i = 0; i < textNodes.length; i += 40) {
    await waitForIdle();
    this.processTextNodes(textNodes.slice(i, i + 40));
  }
}

spacingNodeSync(node: Node): void {
  const textNodes = DomWalker.collectTextNodes(node, true);
  this.processTextNodes(textNodes);
}
```

## Final Recommendation

### Don't Do a Full Rewrite - Improve Existing Code

After careful analysis, I recommend **against** a full rewrite to async/sync separation because:

1. **Breaking changes are costly** - Would break every existing user's code
2. **Current approach has merit** - Configuration allows runtime behavior changes
3. **Complexity is manageable** - Can be improved without full rewrite

### Instead, Do These Improvements:

#### 1. Simplify Complex Branching (High Priority)
```typescript
private spacingTextNodesInQueue(textNodes: Node[], onComplete?: () => void) {
  // Sync path - simple and clear
  if (!this.taskScheduler.config.enabled) {
    this.spacingTextNodes(textNodes);
    onComplete?.();
    return;
  }
  
  // Async path - also clear
  const processAll = () => this.spacingTextNodes(textNodes);
  
  if (this.visibilityDetector.config.enabled) {
    // Batch processing for accuracy
    this.taskScheduler.queue.add(processAll);
  } else {
    // Chunked processing for performance
    this.taskScheduler.processInChunks(textNodes, this.spacingTextNodes);
  }
  
  if (onComplete) {
    this.taskScheduler.queue.setOnComplete(onComplete);
  }
}
```

#### 2. Extract Large Methods (High Priority)
Break down the 200+ line `spacingTextNodes` method into smaller, focused methods:
- `processTextNode(node: Node): void`
- `handleAdjacentNodes(current: Node, next: Node): void`
- `shouldRemoveLeadingSpace(node: Text): boolean`
- `needsSpaceBetween(prev: Text, next: Text): boolean`

#### 3. Add Convenience Methods (Low Priority)
```typescript
// For users who want explicit async control
public async spacingPageAsync(): Promise<void> {
  return new Promise((resolve) => {
    const wasEnabled = this.taskScheduler.config.enabled;
    this.taskScheduler.config.enabled = true;
    
    // Process with temporary async setting
    this.spacingPage();
    
    // Restore and resolve when complete
    this.taskScheduler.queue.setOnComplete(() => {
      this.taskScheduler.config.enabled = wasEnabled;
      resolve();
    });
  });
}
```

#### 4. Better Documentation
Add clear JSDoc comments explaining the configuration behavior:
```typescript
/**
 * Process page with text spacing
 * 
 * Behavior depends on taskScheduler.config.enabled:
 * - true (default): Non-blocking, uses requestIdleCallback
 * - false: Blocking, immediate processing
 */
public spacingPage() { ... }
```

## Conclusion

The exercise of designing async/sync separation revealed that:
1. The core spacing logic is actually quite simple (~60 lines)
2. Most complexity comes from configuration-based branching
3. The current architecture works but needs refactoring for clarity

**Recommendation**: Refactor for clarity while maintaining backward compatibility. The configuration-based approach is valid, just needs better implementation and documentation.

## Code Artifacts Created

1. `pangu-minimal.ts` - Shows core logic in ~60 lines
2. `pangu-simplified.ts` - Full implementation with async/sync separation
3. `pangu-ultra-simple.ts` - Simplified version focusing on clarity
4. `pangu-public-api.ts` - Complete public API design
5. `task-scheduler-simplified.ts` - Simplified task queue

These remain as reference implementations for future consideration.