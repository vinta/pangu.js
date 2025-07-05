import { Pangu } from '../shared';
import { DomWalker } from './dom-walker';
import { VisibilityDetector } from './visibility-detector';

// Ultra-simplified version focusing on core functionality
export class BrowserPangu extends Pangu {
  private observer: MutationObserver | null = null;
  public readonly visibilityDetector = new VisibilityDetector();

  // ============ ASYNC METHODS (Promise-based) ============
  
  async spacingPage(): Promise<void> {
    // Process title and body asynchronously
    await Promise.all([
      this.spacingNodeAsync(document.querySelector('head > title')),
      this.spacingNodeAsync(document.body)
    ]);
  }

  async spacingNodeAsync(node: Node | null): Promise<void> {
    if (!node) return;
    
    const textNodes = DomWalker.collectTextNodes(node, true);
    
    // Always use idle callbacks for async version
    for (let i = 0; i < textNodes.length; i += 40) {
      await this.waitForIdle();
      this.processTextNodes(textNodes.slice(i, i + 40));
    }
  }

  // ============ SYNC METHODS (Immediate) ============

  spacingPageSync(): void {
    const title = document.querySelector('head > title');
    if (title) this.spacingNodeSync(title);
    this.spacingNodeSync(document.body);
  }

  spacingNodeSync(node: Node): void {
    const textNodes = DomWalker.collectTextNodes(node, true);
    this.processTextNodes(textNodes);
  }

  // ============ AUTO-SPACING ============

  startAutoSpacing(): void {
    // Initial spacing (async)
    this.spacingPage();
    
    // Watch for changes
    this.observer = new MutationObserver(() => {
      // Always async for dynamic content
      this.spacingPage();
    });
    
    this.observer.observe(document.documentElement, {
      characterData: true,
      childList: true,
      subtree: true
    });
  }

  stopAutoSpacing(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  // ============ CORE LOGIC (Shared) ============

  private processTextNodes(nodes: Node[]): void {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      if (!(node instanceof Text) || !node.data.trim()) continue;
      
      // Remove leading space after hidden elements
      if (this.shouldRemoveLeadingSpace(node)) {
        node.data = node.data.trimStart();
      }
      
      // Apply spacing rules
      node.data = this.spacingText(node.data);
      
      // Add space between adjacent nodes if needed
      if (i > 0) {
        this.addSpaceBetweenIfNeeded(nodes[i - 1], node);
      }
    }
  }

  private shouldRemoveLeadingSpace(node: Text): boolean {
    return this.visibilityDetector.config.enabled &&
           node.data.startsWith(' ') &&
           this.visibilityDetector.shouldSkipSpacingBeforeNode(node);
  }

  private addSpaceBetweenIfNeeded(prev: Node, current: Node): void {
    if (!(prev instanceof Text) || !(current instanceof Text)) return;
    
    // Check if space already exists
    if (prev.data.endsWith(' ') || current.data.startsWith(' ')) return;
    
    // Test if space is needed
    const test = prev.data.slice(-1) + current.data[0];
    const spaced = this.spacingText(test);
    
    if (test !== spaced && !this.visibilityDetector.shouldSkipSpacingBeforeNode(current)) {
      current.data = ' ' + current.data;
    }
  }

  private async waitForIdle(): Promise<void> {
    return new Promise(resolve => {
      requestIdleCallback(() => resolve(), { timeout: 5000 });
    });
  }
}

// Example usage:
export const pangu = new BrowserPangu();

// Async (non-blocking)
await pangu.spacingPage();

// Sync (immediate) 
pangu.spacingPageSync();

// Auto-spacing (uses async internally)
pangu.startAutoSpacing();