import { Pangu } from '../shared';
import { DomWalker } from './dom-walker';
import { VisibilityDetector } from './visibility-detector';

export interface AutoSpacingPageConfig {
  pageDelayMs?: number;
  nodeDelayMs?: number;
  nodeMaxWaitMs?: number;
}

// Simple Promise-based idle callback wrapper
function requestIdleCallbackPromise(timeout = 5000): Promise<IdleDeadline> {
  return new Promise((resolve) => {
    requestIdleCallback(resolve, { timeout });
  });
}

// Process array in chunks with idle callbacks
async function processInChunksAsync<T>(
  items: T[],
  processor: (chunk: T[]) => void,
  chunkSize = 40
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const deadline = await requestIdleCallbackPromise();
    
    // Process while we have time
    if (deadline.timeRemaining() > 0) {
      processor(chunk);
    } else {
      // If no time left, still process but yield to browser
      await new Promise(resolve => setTimeout(resolve, 0));
      processor(chunk);
    }
  }
}

export class BrowserPangu extends Pangu {
  private autoSpacingObserver: MutationObserver | null = null;
  public readonly visibilityDetector = new VisibilityDetector();

  // ============ ASYNC METHODS ============
  
  async autoSpacingPage({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacingPageConfig = {}): Promise<void> {
    if (!(document.body instanceof Node)) {
      return;
    }

    // Wait for videos to load
    await this.waitForVideosToLoadAsync(pageDelayMs);
    
    // Initial spacing
    await this.spacingPage();
    
    // Setup observer for future changes
    this.setupAutoSpacingObserver(nodeDelayMs, nodeMaxWaitMs);
  }

  async spacingPage(): Promise<void> {
    // Page title
    const title = document.querySelector('head > title');
    if (title) {
      await this.spacingNode(title);
    }

    // Page body
    await this.spacingNode(document.body);
  }

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

  // ============ SYNC METHODS ============

  autoSpacingPageSync({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacingPageConfig = {}): void {
    if (!(document.body instanceof Node)) {
      return;
    }

    // Wait for videos synchronously (blocking)
    setTimeout(() => {
      this.spacingPageSync();
      this.setupAutoSpacingObserver(nodeDelayMs, nodeMaxWaitMs);
    }, pageDelayMs);
  }

  spacingPageSync(): void {
    // Page title
    const title = document.querySelector('head > title');
    if (title) {
      this.spacingNodeSync(title);
    }

    // Page body
    this.spacingNodeSync(document.body);
  }

  spacingNodeSync(contextNode: Node): void {
    const textNodes = DomWalker.collectTextNodes(contextNode, true);
    this.spacingTextNodes(textNodes);
  }

  // ============ SHARED METHODS ============

  stopAutoSpacing(): void {
    if (this.autoSpacingObserver) {
      this.autoSpacingObserver.disconnect();
      this.autoSpacingObserver = null;
    }
  }

  isElementVisuallyHidden(element: Element): boolean {
    return this.visibilityDetector.isElementVisuallyHidden(element);
  }

  // ============ PRIVATE METHODS ============

  private spacingTextNodes(textNodes: Node[]): void {
    let currentTextNode: Node | null;
    let nextTextNode: Node | null = null;

    for (let i = 0; i < textNodes.length; i++) {
      currentTextNode = textNodes[i];
      if (!currentTextNode) {
        continue;
      }

      if (DomWalker.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }

      if (currentTextNode instanceof Text) {
        // Check for leading space after hidden element
        if (this.visibilityDetector.config.enabled && 
            currentTextNode.data.startsWith(' ') && 
            this.visibilityDetector.shouldSkipSpacingBeforeNode(currentTextNode)) {
          currentTextNode.data = currentTextNode.data.substring(1);
        }
        
        // Apply spacing
        const newText = this.spacingText(currentTextNode.data);
        if (currentTextNode.data !== newText) {
          currentTextNode.data = newText;
        }
      }

      // Handle spacing between adjacent nodes
      if (nextTextNode && currentTextNode instanceof Text && nextTextNode instanceof Text) {
        const needsSpace = this.checkNeedsSpaceBetween(currentTextNode, nextTextNode);
        
        if (needsSpace && !nextTextNode.data.startsWith(' ')) {
          if (!this.visibilityDetector.shouldSkipSpacingBeforeNode(nextTextNode)) {
            nextTextNode.data = ` ${nextTextNode.data}`;
          }
        }
      }

      nextTextNode = currentTextNode;
    }
  }

  private checkNeedsSpaceBetween(current: Text, next: Text): boolean {
    // Skip if already has space
    if (current.data.endsWith(' ') || next.data.startsWith(' ')) {
      return false;
    }

    // Test if spacing is needed
    const testText = current.data.slice(-1) + next.data.slice(0, 1);
    const spacedText = this.spacingText(testText);
    
    return testText !== spacedText;
  }

  private async waitForVideosToLoadAsync(delayMs: number): Promise<void> {
    const videos = Array.from(document.getElementsByTagName('video'));
    
    if (videos.length === 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return;
    }

    // Wait for all videos
    const videoPromises = videos.map(video => {
      if (video.readyState >= 3) {
        return Promise.resolve();
      }
      return new Promise<void>(resolve => {
        video.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    });

    // Race between videos loading and timeout
    await Promise.race([
      Promise.all(videoPromises),
      new Promise(resolve => setTimeout(resolve, delayMs + 5000))
    ]);
    
    // Additional delay after videos load
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  private setupAutoSpacingObserver(nodeDelayMs: number, nodeMaxWaitMs: number): void {
    if (this.autoSpacingObserver) {
      this.autoSpacingObserver.disconnect();
    }

    let timeoutId: number | null = null;
    let startTime: number | null = null;

    const processChanges = () => {
      // Always use async processing for dynamic content
      this.spacingPage().catch(console.error);
    };

    const debouncedProcess = () => {
      const now = Date.now();
      
      if (!startTime) {
        startTime = now;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Force processing if we've waited too long
      if (now - startTime >= nodeMaxWaitMs) {
        processChanges();
        startTime = null;
      } else {
        timeoutId = window.setTimeout(() => {
          processChanges();
          startTime = null;
        }, nodeDelayMs);
      }
    };

    this.autoSpacingObserver = new MutationObserver((mutations) => {
      // Simple check: any relevant change triggers processing
      const hasRelevantChange = mutations.some(mutation => {
        if (mutation.type === 'characterData') return true;
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) return true;
        return false;
      });

      if (hasRelevantChange) {
        debouncedProcess();
      }
    });

    // Observe both head (for title) and body
    this.autoSpacingObserver.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true
    });

    this.autoSpacingObserver.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true
    });
  }
}

export const pangu = new BrowserPangu();
export default pangu;