# Code Simplification Comparison

## Before: Complex Configuration-Based Branching

```typescript
// User doesn't know if this is sync or async
pangu.spacingPage(); 

// Complex internal logic with 4+ execution paths
private spacingTextNodesInQueue(textNodes: Node[], onComplete?: () => void) {
  if (this.visibilityDetector.config.enabled) {
    if (this.taskScheduler.config.enabled) {
      this.taskScheduler.queue.add(() => {
        this.spacingTextNodes(textNodes);
      });
      if (onComplete) {
        this.taskScheduler.queue.setOnComplete(onComplete);
      }
    } else {
      this.spacingTextNodes(textNodes);
      onComplete?.();
    }
    return;
  }
  
  const task = (chunkedTextNodes: Node[]) => this.spacingTextNodes(chunkedTextNodes);
  this.taskScheduler.processInChunks(textNodes, task, onComplete);
}
```

## After: Clear Async/Sync Separation

```typescript
// Async version - always uses requestIdleCallback
await pangu.spacingPage();

// Sync version - always immediate
pangu.spacingPageSync();

// Simple async implementation
async spacingNode(contextNode: Node): Promise<void> {
  const textNodes = DomWalker.collectTextNodes(contextNode, true);
  
  if (this.visibilityDetector.config.enabled) {
    // Process all nodes in one batch to maintain context
    await requestIdleCallbackPromise();
    this.spacingTextNodes(textNodes);
  } else {
    // Process in chunks
    await processInChunksAsync(textNodes, (chunk) => this.spacingTextNodes(chunk));
  }
}

// Simple sync implementation
spacingNodeSync(contextNode: Node): void {
  const textNodes = DomWalker.collectTextNodes(contextNode, true);
  this.spacingTextNodes(textNodes);
}
```

## Benefits

1. **API Clarity**: Methods clearly indicate sync vs async behavior
2. **Reduced Complexity**: No more nested if/else branches
3. **Better Types**: TypeScript knows exactly what each method returns
4. **Simpler Testing**: Test sync and async paths independently
5. **No Configuration**: Remove `taskScheduler.config.enabled` entirely

## Usage Examples

### Async Usage (Non-blocking)
```typescript
// For initial page load
await pangu.autoSpacingPage();

// For manual triggering with UI feedback
button.onclick = async () => {
  button.disabled = true;
  try {
    await pangu.spacingPage();
    showSuccess();
  } catch (error) {
    showError(error);
  } finally {
    button.disabled = false;
  }
};
```

### Sync Usage (Immediate)
```typescript
// For small content updates
pangu.spacingNodeSync(commentElement);

// For real-time typing
input.oninput = () => {
  pangu.spacingNodeSync(input);
};
```

## Migration Path

1. **Remove TaskScheduler config**: No more `taskScheduler.config.enabled`
2. **Replace callbacks with Promises**: Modern async/await patterns
3. **Simplify MutationObserver**: Always use async for dynamic content
4. **Clear method naming**: `Sync` suffix for synchronous methods

## Code Reduction

- **Removed**: Complex configuration logic, callback management
- **Simplified**: Task queue to basic Promise-based queue
- **Eliminated**: Multiple execution paths through same method
- **Total lines saved**: ~100+ lines of branching logic