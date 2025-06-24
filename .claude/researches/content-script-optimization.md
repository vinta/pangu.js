# Content Script Memory Optimization

## Current State Analysis

### File Structure
- `vendors/pangu/pangu.umd.js` (18KB uncompressed, 4.2KB gzipped) - Main pangu library
- `dist/content-script.js` (712B uncompressed, 350B gzipped) - Thin wrapper
- **Total**: ~18.7KB uncompressed, ~4.5KB gzipped

### Memory Issues
1. **Always Loaded**: Both files injected on every matching page, regardless of CJK content
2. **Persistent Memory**: Library stays in memory for page lifetime
3. **Continuous Monitoring**: MutationObserver runs indefinitely, even without CJK
4. **Unused Code**: Bundle includes methods never used by content script:
   - `spacingNode()`
   - `spacingElementById()`
   - `spacingElementByClassName()`
   - `spacingElementByTagName()`
   - `spacingPageTitle()`
   - `spacingPageBody()`

## Optimization Strategies

### 1. Lazy Loading with CJK Detection (Highest Impact)

```javascript
// Minimal content-script.js (~500 bytes)
async function initPangu() {
  // Quick CJK detection first
  if (!document.title.match(/[\u2e80-\u9fff]/) && 
      !document.body.textContent.substring(0, 1000).match(/[\u2e80-\u9fff]/)) {
    console.log('No CJK content detected, skipping pangu.js load');
    return;
  }
  
  // Load pangu.js only when needed
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('vendors/pangu/pangu.umd.js');
  script.onload = () => {
    window.pangu.autoSpacingPage();
  };
  document.head.appendChild(script);
}

initPangu();
```

**Benefits**: 
- Saves ~18KB per non-CJK page
- Reduces memory usage on ~90% of Western websites

### 2. Create Minimal Bundle

Build a custom bundle with only required functionality:

```javascript
// pangu-minimal.js
export class PanguMinimal {
  constructor() {
    // Include only essential regex patterns
    this.convertToFullwidthPattern = /.../ // Only patterns actually used
  }
  
  // Only include these methods:
  spacingText(text) { /* ... */ }
  spacingPage() { /* ... */ }
  autoSpacingPage() { /* ... */ }
  
  // Remove all other methods
}
```

**Benefits**:
- Estimated 30-40% size reduction
- Faster parsing and initialization

### 3. Smart MutationObserver Management

```javascript
class MemoryOptimizedPangu extends BrowserPangu {
  private observer?: MutationObserver;
  private inactivityTimer?: number;
  private mutationCount = 0;
  
  autoSpacingPage() {
    super.autoSpacingPage();
    this.startInactivityTimer();
  }
  
  private startInactivityTimer() {
    // Stop observing after 30 seconds of no mutations
    this.inactivityTimer = setTimeout(() => {
      this.observer?.disconnect();
      console.log('Pangu: Stopped observing due to inactivity');
    }, 30000);
  }
  
  private onMutation() {
    this.mutationCount++;
    
    // Reset timer on activity
    clearTimeout(this.inactivityTimer);
    this.startInactivityTimer();
    
    // Stop after processing many mutations (likely infinite loop)
    if (this.mutationCount > 1000) {
      this.observer?.disconnect();
      console.log('Pangu: Stopped observing due to excessive mutations');
    }
  }
}
```

### 4. Dynamic Script Injection via Service Worker

```javascript
// content-script-detector.js (1KB) - Always loaded
function checkAndRequestPangu() {
  const quickCheck = document.body.textContent.substring(0, 1000);
  if (/[\u2e80-\u9fff]/.test(quickCheck)) {
    chrome.runtime.sendMessage({ action: 'injectPangu' });
  }
}

// Only check once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndRequestPangu);
} else {
  checkAndRequestPangu();
}

// service-worker.js
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'injectPangu') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['vendors/pangu/pangu.umd.js', 'content-script-init.js']
    });
  }
});
```

### 5. Progressive Enhancement

```javascript
// Load different bundles based on page complexity
async function loadPanguProgressive() {
  const textNodeCount = document.evaluate(
    '//text()', document, null, 
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
  ).snapshotLength;
  
  if (textNodeCount < 100) {
    // Load minimal version for simple pages
    await loadScript('pangu-minimal.js');
  } else if (textNodeCount < 1000) {
    // Load standard version
    await loadScript('pangu-standard.js');
  } else {
    // Load optimized version with batching for complex pages
    await loadScript('pangu-heavy.js');
  }
}
```

### 6. Memory Cleanup on Page Unload

```javascript
// Ensure cleanup on page navigation
window.addEventListener('pagehide', () => {
  if (window.pangu?.observer) {
    window.pangu.observer.disconnect();
  }
  window.pangu = null;
}, { once: true });
```

## Implementation Priority

1. **High Priority**: Lazy loading with CJK detection
   - Biggest impact, easiest to implement
   - Saves memory on majority of non-CJK pages

2. **Medium Priority**: Create minimal bundle
   - Requires build process changes
   - Good long-term optimization

3. **Medium Priority**: Smart MutationObserver management
   - Prevents runaway memory usage
   - Improves performance on dynamic pages

4. **Low Priority**: Progressive enhancement
   - Complex to implement
   - Benefits only specific use cases

## Expected Results

Implementing lazy loading alone would:
- Reduce memory usage by ~18KB on non-CJK pages
- Eliminate unnecessary CPU usage from MutationObserver
- Improve extension performance metrics
- Maintain full functionality for CJK pages

Combined optimizations could achieve:
- 50-70% memory reduction on non-CJK pages  
- 30-40% reduction even on CJK pages
- Better performance on low-end devices
- Improved battery life on mobile devices