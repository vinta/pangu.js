import { Pangu } from '../shared';

export interface AutoSpacingPageConfig {
  pageDelayMs?: number;
  nodeDelayMs?: number;
  nodeMaxWaitMs?: number;
}

export interface PerformanceStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  total: number;
}

export interface PerformanceReport {
  [key: string]: PerformanceStats;
}

export interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

export interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}

export interface IdleSpacingConfig {
  enabled: boolean;
  chunkSize: number;
  timeout: number;
}

export interface VisibilityCheckConfig {
  enabled: boolean;
  checkDuringIdle: boolean;
  commonHiddenPatterns: {
    clipRect: boolean;
    displayNone: boolean;
    visibilityHidden: boolean;
    opacityZero: boolean;
    heightWidth1px: boolean;
  };
}

export interface IdleSpacingCallbacks {
  onComplete?: () => void;
  onProgress?: (processed: number, total: number) => void;
}

class IdleQueue {
  private queue: (() => void)[] = [];
  private isProcessing = false;
  private requestIdleCallback: (callback: IdleRequestCallback, options?: { timeout?: number }) => number;
  private totalItems = 0;
  private processedItems = 0;
  private callbacks: IdleSpacingCallbacks = {};

  constructor() {
    // Simple fallback for Safari and other browsers without requestIdleCallback
    if (typeof window.requestIdleCallback === 'function') {
      this.requestIdleCallback = window.requestIdleCallback.bind(window);
    } else {
      // Fallback using setTimeout for browsers without requestIdleCallback (Safari)
      this.requestIdleCallback = (callback: IdleRequestCallback, _options?: { timeout?: number }) => {
        const start = performance.now();
        return window.setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining() {
              // Simulate ~16ms budget (60fps frame)
              return Math.max(0, 16 - (performance.now() - start));
            }
          });
        }, 0);
      };
    }
  }

  add(work: () => void): void {
    this.queue.push(work);
    this.totalItems++;
    this.scheduleProcessing();
  }

  clear(): void {
    this.queue.length = 0;
    this.totalItems = 0;
    this.processedItems = 0;
    this.callbacks = {};
  }

  setCallbacks(callbacks: IdleSpacingCallbacks): void {
    this.callbacks = callbacks;
  }

  get length(): number {
    return this.queue.length;
  }

  get progress(): { processed: number; total: number; percentage: number } {
    return {
      processed: this.processedItems,
      total: this.totalItems,
      percentage: this.totalItems > 0 ? (this.processedItems / this.totalItems) * 100 : 0
    };
  }

  private scheduleProcessing(): void {
    if (!this.isProcessing && this.queue.length > 0) {
      this.isProcessing = true;
      this.requestIdleCallback((deadline) => this.process(deadline), { timeout: 5000 });
    }
  }

  private process(deadline: IdleDeadline): void {
    while (deadline.timeRemaining() > 0 && this.queue.length > 0) {
      const work = this.queue.shift();
      work?.();
      this.processedItems++;
      
      // Call progress callback if provided
      this.callbacks.onProgress?.(this.processedItems, this.totalItems);
    }

    this.isProcessing = false;
    
    if (this.queue.length > 0) {
      this.scheduleProcessing();
    } else if (this.processedItems === this.totalItems && this.totalItems > 0) {
      // All work completed, call completion callback
      this.callbacks.onComplete?.();
      // Reset counters for next batch
      this.totalItems = 0;
      this.processedItems = 0;
    }
  }
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private enabled: boolean;

  constructor(enabled = false) {
    this.enabled = enabled;
  }

  measure<T>(label: string, fn: () => T): T {
    if (!this.enabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    return result;
  }

  getStats(label: string): PerformanceStats | null {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) {
      return null;
    }

    const total = times.reduce((a, b) => a + b, 0);
    return {
      count: times.length,
      avg: total / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total
    };
  }

  getAllStats(): PerformanceReport {
    const report: PerformanceReport = {};
    for (const [label] of this.metrics) {
      const stats = this.getStats(label);
      if (stats) {
        report[label] = stats;
      }
    }
    return report;
  }

  reset(): void {
    this.metrics.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  logResults(): void {
    if (!this.enabled) {
      return;
    }

    const report = this.getAllStats();
    if (Object.keys(report).length === 0) {
      return;
    }

    console.group('🚀 Pangu.js Performance Report');
    console.table(report);
    console.groupEnd();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function once<T extends (...args: any[]) => any>(func: T) {
  let executed = false;
  return function (...args: Parameters<T>) {
    if (executed) {
      return undefined;
    }
    executed = true;
    return func(...args);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, delay: number, mustRunDelay: number = Infinity) {
  let timer: number | null = null;
  let startTime: number | null = null;

  return function (...args: Parameters<T>) {
    const currentTime = Date.now();

    if (timer) {
      clearTimeout(timer);
    }

    if (!startTime) {
      startTime = currentTime;
    }

    if (currentTime - startTime >= mustRunDelay) {
      func(...args);
      startTime = currentTime;
    } else {
      timer = window.setTimeout(() => {
        func(...args);
      }, delay);
    }
  };
}

export class BrowserPangu extends Pangu {
  public isAutoSpacingPageExecuted: boolean;
  protected autoSpacingPageObserver: MutationObserver | null;
  protected performanceMonitor: PerformanceMonitor;
  protected idleQueue: IdleQueue;
  protected idleSpacingConfig: IdleSpacingConfig;
  protected visibilityCheckConfig: VisibilityCheckConfig;

  public blockTags: RegExp;
  public ignoredTags: RegExp;
  public presentationalTags: RegExp;
  public spaceLikeTags: RegExp;
  public spaceSensitiveTags: RegExp;
  public ignoredClass: string;

  constructor() {
    super();

    this.isAutoSpacingPageExecuted = false;
    this.autoSpacingPageObserver = null;
    
    // Enable performance monitoring in development mode
    const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    this.performanceMonitor = new PerformanceMonitor(isDevelopment);

    // Initialize idle processing infrastructure
    this.idleQueue = new IdleQueue();
    this.idleSpacingConfig = {
      enabled: false, // Disabled by default for backward compatibility
      chunkSize: 10,  // Process 10 text nodes per idle cycle
      timeout: 5000   // 5 second timeout for idle processing
    };

    // Initialize visibility check configuration
    this.visibilityCheckConfig = {
      enabled: false, // Disabled by default for backward compatibility
      checkDuringIdle: true, // Use idle time for visibility checks
      commonHiddenPatterns: {
        clipRect: true,         // clip: rect(1px, 1px, 1px, 1px) patterns
        displayNone: true,      // display: none
        visibilityHidden: true, // visibility: hidden
        opacityZero: true,      // opacity: 0
        heightWidth1px: true    // height: 1px; width: 1px
      }
    };

    this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
    this.ignoredTags = /^(code|pre|script|style|textarea|iframe|input)$/i;
    this.presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i;
    this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
    this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
    this.ignoredClass = 'no-pangu-spacing';
  }

  public autoSpacingPage({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacingPageConfig = {}) {
    if (!(document.body instanceof Node)) {
      return;
    }

    if (this.isAutoSpacingPageExecuted) {
      return;
    }

    this.isAutoSpacingPageExecuted = true;

    // FIXME
    // Dirty hack for https://github.com/vinta/pangu.js/issues/117
    const spacingPageOnce = once(() => {
      this.spacingPage();
    });
    const videos = document.getElementsByTagName('video');
    if (videos.length === 0) {
      setTimeout(() => {
        spacingPageOnce();
      }, pageDelayMs);
    } else {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        if (video.readyState === 4) {
          setTimeout(() => {
            spacingPageOnce();
          }, 3000);
          break;
        }
        video.addEventListener('loadeddata', () => {
          setTimeout(() => {
            spacingPageOnce();
          }, 4000);
        });
      }
    }

    this.setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs);
  }

  public spacingPage() {
    this.performanceMonitor.measure('spacingPage', () => {
      this.spacingPageTitle();
      this.spacingPageBody();
    });
    this.performanceMonitor.logResults();
  }

  public spacingPageTitle() {
    this.performanceMonitor.measure('spacingPageTitle', () => {
      const titleElement = document.querySelector('head > title');
      if (titleElement) {
        this.spacingNode(titleElement);
      }
    });
  }

  public spacingPageBody() {
    this.performanceMonitor.measure('spacingPageBody', () => {
      // Process the entire body element
      // The collectTextNodes method already filters out:
      // 1. Whitespace-only text nodes
      // 2. Text inside ignored tags (script, style, textarea, etc.)
      // 3. Text inside contentEditable elements
      // 4. Text inside elements with no-pangu-spacing class
      this.spacingNode(document.body);
    });
  }

  public spacingNode(contextNode: Node) {
    // Use TreeWalker to collect all text nodes in the DOM tree
    // This handles cases like <div><span>中文</span>"<span>ABC</span></div> where the quote is a direct child of the div
    //
    // The collectTextNodes helper filters out text nodes that contain only whitespace,
    // ensuring we only process nodes with actual content
    //
    // Example HTML with CSS {white-space: pre-wrap}
    //   <div>
    //     "整天等"
    //     "EAS"
    //     "build"
    //   </div>
    //
    // This creates these text nodes:
    // 1. "整天等"     -> selected (has content)
    // 2. "\n  "      -> filtered out (whitespace only)
    // 3. "EAS"       -> selected (has content)
    // 4. "\n  "      -> filtered out (whitespace only)
    // 5. "build"     -> selected (has content)
    //
    // Without filtering whitespace, we'd process the whitespace nodes too, which would:
    // - Impact performance (processing many empty nodes)
    // - Add complexity (algorithm expects meaningful content)
    //
    // However, those filtered whitespace nodes still exist in the DOM and can render as spaces with CSS like {white-space: pre-wrap}.
    // The processTextNodes method includes logic to detect whitespace between selected text nodes.
    
    this.spacingNodeWithTreeWalker(contextNode);
  }

  public spacingElementById(idName: string) {
    const element = document.getElementById(idName);
    if (element) {
      this.spacingNode(element);
    }
  }

  public spacingElementByClassName(className: string) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
      this.spacingNode(elements[i]);
    }
  }

  public spacingElementByTagName(tagName: string) {
    const elements = document.getElementsByTagName(tagName);
    for (let i = 0; i < elements.length; i++) {
      this.spacingNode(elements[i]);
    }
  }


  public stopAutoSpacingPage() {
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }

    this.isAutoSpacingPageExecuted = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected isContentEditable(node: any) {
    return node.isContentEditable || (node.getAttribute && node.getAttribute('g_editable') === 'true');
  }

  protected isSpecificTag(node: Node, tagRegex: RegExp) {
    return node && node.nodeName && tagRegex.test(node.nodeName);
  }

  protected isInsideSpecificTag(node: Node, tagRegex: RegExp, checkCurrent = false) {
    let currentNode = node;
    if (checkCurrent) {
      if (this.isSpecificTag(currentNode, tagRegex)) {
        return true;
      }
    }
    while (currentNode.parentNode) {
      currentNode = currentNode.parentNode;
      if (this.isSpecificTag(currentNode, tagRegex)) {
        return true;
      }
    }
    return false;
  }

  protected hasIgnoredClass(node: Node) {
    // Check the node itself if it's an element
    if (node instanceof Element && node.classList.contains(this.ignoredClass)) {
      return true;
    }
    // Check the parent node (for text nodes)
    if (node.parentNode && node.parentNode instanceof Element && node.parentNode.classList.contains(this.ignoredClass)) {
      return true;
    }
    return false;
  }

  protected canIgnoreNode(node: Node) {
    let currentNode = node;
    if (currentNode && (this.isSpecificTag(currentNode, this.ignoredTags) || this.isContentEditable(currentNode) || this.hasIgnoredClass(currentNode))) {
      // We will skip processing any children of ignored elements, so don't need to check all ancestors
      return true;
    }
    while (currentNode.parentNode) {
      currentNode = currentNode.parentNode;
      if (currentNode && (this.isSpecificTag(currentNode, this.ignoredTags) || this.isContentEditable(currentNode))) {
        return true;
      }
    }
    return false;
  }


  protected isFirstTextChild(parentNode: Node, targetNode: Node) {
    const { childNodes } = parentNode;

    // 只判斷第一個含有 text 的 node
    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }

  protected isLastTextChild(parentNode: Node, targetNode: Node) {
    const { childNodes } = parentNode;

    // 只判斷倒數第一個含有 text 的 node
    for (let i = childNodes.length - 1; i > -1; i--) {
      const childNode = childNodes[i];
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }

  protected processTextNodes(textNodes: Node[]) {
    let currentTextNode: Node | null;
    let nextTextNode: Node | null = null;

    // Process nodes in the order provided
    for (let i = 0; i < textNodes.length; i++) {
      currentTextNode = textNodes[i];
      if (!currentTextNode) {
        continue;
      }

      // Skip nodes that should be ignored
      if (this.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }

      if (currentTextNode instanceof Text) {
        // Special handling for standalone quote nodes
        if (currentTextNode.data.length === 1 && /["\u201c\u201d]/.test(currentTextNode.data)) {
          // Check context to determine if space is needed before the quote
          if (currentTextNode.previousSibling) {
            const prevNode = currentTextNode.previousSibling;
            if (prevNode.nodeType === Node.ELEMENT_NODE && prevNode.textContent) {
              const lastChar = prevNode.textContent.slice(-1);
              // If previous element ends with CJK, add space before quote
              if (/[\u4e00-\u9fff]/.test(lastChar)) {
                currentTextNode.data = ` ${currentTextNode.data}`;
              }
            }
          }
        } else {
          // Normal text processing
          const newText = this.spacingText(currentTextNode.data);
          if (currentTextNode.data !== newText) {
            currentTextNode.data = newText;
          }
        }
      }

      // Handle nested tag text processing
      if (nextTextNode) {
        if (currentTextNode.nextSibling && this.spaceLikeTags.test(currentTextNode.nextSibling.nodeName)) {
          nextTextNode = currentTextNode;
          continue;
        }

        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }

        // Check if there's already proper spacing between nodes
        const currentEndsWithSpace = currentTextNode.data.endsWith(' ');
        const nextStartsWithSpace = nextTextNode.data.startsWith(' ');

        // Check if there's whitespace between the nodes
        let hasWhitespaceBetween = false;
        
        // We need to check at different levels of the DOM tree
        // First, find the highest ancestor that contains only the current text node
        let currentAncestor = currentTextNode as Node;
        while (currentAncestor.parentNode && 
               this.isLastTextChild(currentAncestor.parentNode, currentAncestor) &&
               !this.spaceSensitiveTags.test(currentAncestor.parentNode.nodeName)) {
          currentAncestor = currentAncestor.parentNode;
        }
        
        // Find the highest ancestor that contains only the next text node
        let nextAncestor = nextTextNode as Node;
        while (nextAncestor.parentNode && 
               this.isFirstTextChild(nextAncestor.parentNode, nextAncestor) &&
               !this.spaceSensitiveTags.test(nextAncestor.parentNode.nodeName)) {
          nextAncestor = nextAncestor.parentNode;
        }
        
        // Check for whitespace between these ancestors
        let nodeBetween = currentAncestor.nextSibling;
        while (nodeBetween && nodeBetween !== nextAncestor) {
          if (nodeBetween.nodeType === Node.TEXT_NODE && nodeBetween.textContent && /\s/.test(nodeBetween.textContent)) {
            hasWhitespaceBetween = true;
            break;
          }
          nodeBetween = nodeBetween.nextSibling;
        }

        // Skip if proper spacing exists
        if (currentEndsWithSpace || nextStartsWithSpace || hasWhitespaceBetween) {
          nextTextNode = currentTextNode;
          continue;
        }

        const testText = currentTextNode.data.slice(-1) + nextTextNode.data.slice(0, 1);
        const testNewText = this.spacingText(testText);

        // Special handling for quotes
        const currentLast = currentTextNode.data.slice(-1);
        const nextFirst = nextTextNode.data.slice(0, 1);
        const isQuote = (char: string) => /["\u201c\u201d]/.test(char);
        const isCJK = (char: string) => /[\u4e00-\u9fff]/.test(char);

        const skipSpacing = (isQuote(currentLast) && isCJK(nextFirst)) || (isCJK(currentLast) && isQuote(nextFirst));

        if (testNewText !== testText && !skipSpacing) {
          let nextNode: Node = nextTextNode;
          while (nextNode.parentNode && !this.spaceSensitiveTags.test(nextNode.nodeName) && this.isFirstTextChild(nextNode.parentNode, nextNode)) {
            nextNode = nextNode.parentNode;
          }

          let currentNode: Node = currentTextNode;
          while (currentNode.parentNode && !this.spaceSensitiveTags.test(currentNode.nodeName) && this.isLastTextChild(currentNode.parentNode, currentNode)) {
            currentNode = currentNode.parentNode;
          }

          if (currentNode.nextSibling) {
            if (this.spaceLikeTags.test(currentNode.nextSibling.nodeName)) {
              nextTextNode = currentTextNode;
              continue;
            }
          }

          if (!this.blockTags.test(currentNode.nodeName)) {
            if (!this.spaceSensitiveTags.test(nextNode.nodeName)) {
              if (!this.ignoredTags.test(nextNode.nodeName) && !this.blockTags.test(nextNode.nodeName)) {
                if (nextTextNode.previousSibling) {
                  if (!this.spaceLikeTags.test(nextTextNode.previousSibling.nodeName)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      // Check visibility before adding space
                      if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                } else {
                  if (!this.canIgnoreNode(nextTextNode)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      // Check visibility before adding space
                      if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                }
              }
            } else if (!this.spaceSensitiveTags.test(currentNode.nodeName)) {
              if (currentTextNode instanceof Text && !currentTextNode.data.endsWith(' ')) {
                // Check visibility before adding space
                if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                  currentTextNode.data = `${currentTextNode.data} `;
                }
              }
            } else {
              // Check visibility before inserting space element
              if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                const panguSpace = document.createElement('pangu');
                panguSpace.innerHTML = ' ';

                if (nextNode.parentNode) {
                  if (nextNode.previousSibling) {
                    if (!this.spaceLikeTags.test(nextNode.previousSibling.nodeName)) {
                      nextNode.parentNode.insertBefore(panguSpace, nextNode);
                    }
                  } else {
                    nextNode.parentNode.insertBefore(panguSpace, nextNode);
                  }
                }

                // Clean up orphaned space element
                if (!panguSpace.previousElementSibling) {
                  if (panguSpace.parentNode) {
                    panguSpace.parentNode.removeChild(panguSpace);
                  }
                }
              }
            }
          }
        }
      }

      nextTextNode = currentTextNode;
    }
  }

  protected collectTextNodes(contextNode: Node, reverse = false): Text[] {
    const nodes: Text[] = [];
    
    // Handle edge cases
    if (!contextNode || contextNode instanceof DocumentFragment) {
      return nodes;
    }

    const walker = document.createTreeWalker(
      contextNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip whitespace-only nodes
          if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip nodes that should be ignored (same as canIgnoreNode check)
          // We need to check the node itself and its ancestors
          let currentNode = node;
          while (currentNode) {
            if (currentNode instanceof Element) {
              // Check for ignored tags
              if (this.ignoredTags.test(currentNode.nodeName)) {
                return NodeFilter.FILTER_REJECT;
              }
              // Check for contentEditable
              if (this.isContentEditable(currentNode)) {
                return NodeFilter.FILTER_REJECT;
              }
              // Check for ignored class
              if (currentNode.classList.contains(this.ignoredClass)) {
                return NodeFilter.FILTER_REJECT;
              }
            }
            currentNode = currentNode.parentNode as Node;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    // Collect all text nodes
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }

    // Return in reverse order if requested
    return reverse ? nodes.reverse() : nodes;
  }

  protected spacingNodeWithTreeWalker(contextNode: Node) {
    // DocumentFragments don't support TreeWalker properly
    if (!(contextNode instanceof Node) || contextNode instanceof DocumentFragment) {
      return;
    }

    // Use TreeWalker to collect text nodes with content
    const textNodes = this.performanceMonitor.measure('collectTextNodes', () => {
      return this.collectTextNodes(contextNode, true);
    });

    // Choose processing method based on idle spacing configuration
    if (this.idleSpacingConfig.enabled) {
      this.processTextNodesWithIdleCallback(textNodes);
    } else {
      // Process the collected text nodes using the shared logic (synchronous)
      this.performanceMonitor.measure('processTextNodes', () => {
        this.processTextNodes(textNodes);
      });
    }
  }

  protected processTextNodesWithIdleCallback(textNodes: Node[], callbacks?: IdleSpacingCallbacks): void {
    if (textNodes.length === 0) {
      callbacks?.onComplete?.();
      return;
    }

    // Clear any existing work from previous calls
    this.idleQueue.clear();

    // Set up callbacks for progress tracking
    if (callbacks) {
      this.idleQueue.setCallbacks(callbacks);
    }

    // Split text nodes into chunks
    const chunkSize = this.idleSpacingConfig.chunkSize;
    const chunks: Node[][] = [];
    
    for (let i = 0; i < textNodes.length; i += chunkSize) {
      chunks.push(textNodes.slice(i, i + chunkSize));
    }

    // Add each chunk as a work item to the idle queue
    chunks.forEach((chunk, index) => {
      this.idleQueue.add(() => {
        this.performanceMonitor.measure(`processTextNodesChunk${index}`, () => {
          this.processTextNodes(chunk);
        });
      });
    });
  }

  protected setupAutoSpacingPageObserver(nodeDelayMs: number, nodeMaxWaitMs: number) {
    // Disconnect any existing auto-spacing observer
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }

    const queue: Node[] = [];

    const debouncedSpacingTitle = debounce(
      () => {
        this.spacingPageTitle();
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    const debouncedSpacingNode = debounce(
      () => {
        // NOTE: a single node could be very big which contains a lot of child nodes
        if (this.idleSpacingConfig.enabled) {
          // Use idle processing for dynamic content
          const nodesToProcess = [...queue];
          queue.length = 0; // Clear the queue
          
          if (nodesToProcess.length > 0) {
            this.spacingNodesWithIdleCallback(nodesToProcess);
          }
        } else {
          // Synchronous processing (original behavior)
          while (queue.length) {
            const node = queue.shift();
            if (node) {
              this.spacingNode(node);
            }
          }
        }
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    this.autoSpacingPageObserver = new MutationObserver((mutations) => {
      let titleChanged = false;

      // Element: https://developer.mozilla.org/en-US/docs/Web/API/Element
      // Text: https://developer.mozilla.org/en-US/docs/Web/API/Text
      for (const mutation of mutations) {
        // Skip to avoid double processing - title handled separately by debouncedSpacingTitle()
        if (mutation.target.parentNode?.nodeName === 'TITLE' || mutation.target.nodeName === 'TITLE') {
          titleChanged = true;
          continue;
        }

        // Queue parent elements for spacing processing
        switch (mutation.type) {
          case 'characterData':
            // Text content changed (e.g., textContent = '新文字new text')
            const { target: node } = mutation;
            if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
              // <p>Hello 世界</p>
              // "Hello 世界" is the text node, <p> is the parent element
              queue.push(node.parentNode); // Queue parent element, not text node
            }
            break;
          case 'childList':
            // New nodes added to DOM (e.g., innerHTML change, appendChild)
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                queue.push(node); // Element added, process its text content
              } else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                queue.push(node.parentNode); // Text node added, process its parent
              }
            }
            break;
          default:
            break;
        }
      }

      if (titleChanged) {
        debouncedSpacingTitle();
      }

      debouncedSpacingNode();
    });

    // NOTE: A single MutationObserver can observe multiple targets simultaneously
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe:

    // Observe page content changes
    this.autoSpacingPageObserver.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    // Observe page title changes
    this.autoSpacingPageObserver.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true, // Need subtree to observe text node changes inside title
    });
  }

  // Performance monitoring methods

  public enablePerformanceMonitoring(): void {
    this.performanceMonitor.setEnabled(true);
  }

  public disablePerformanceMonitoring(): void {
    this.performanceMonitor.setEnabled(false);
  }

  public getPerformanceReport(): PerformanceReport {
    return this.performanceMonitor.getAllStats();
  }

  public getPerformanceStats(label: string): PerformanceStats | null {
    return this.performanceMonitor.getStats(label);
  }

  public resetPerformanceMetrics(): void {
    this.performanceMonitor.reset();
  }

  public logPerformanceResults(): void {
    this.performanceMonitor.logResults();
  }

  // Idle processing configuration methods

  public enableIdleSpacing(config?: Partial<IdleSpacingConfig>): void {
    this.idleSpacingConfig = {
      ...this.idleSpacingConfig,
      enabled: true,
      ...config
    };
  }

  public disableIdleSpacing(): void {
    this.idleSpacingConfig.enabled = false;
    this.idleQueue.clear();
  }

  public getIdleSpacingConfig(): IdleSpacingConfig {
    return { ...this.idleSpacingConfig };
  }

  public getIdleQueueLength(): number {
    return this.idleQueue.length;
  }

  public clearIdleQueue(): void {
    this.idleQueue.clear();
  }

  public getIdleProgress(): { processed: number; total: number; percentage: number } {
    return this.idleQueue.progress;
  }

  public spacingPageWithIdleCallback(callbacks?: IdleSpacingCallbacks): void {
    if (!this.idleSpacingConfig.enabled) {
      // Fallback to synchronous processing if idle spacing is disabled
      this.spacingPage();
      callbacks?.onComplete?.();
      return;
    }

    // Process title synchronously (it's typically small)
    this.spacingPageTitle();
    
    // Process body with idle callback
    this.spacingNodeWithIdleCallback(document.body, callbacks);
  }

  public spacingNodeWithIdleCallback(contextNode: Node, callbacks?: IdleSpacingCallbacks): void {
    if (!this.idleSpacingConfig.enabled) {
      // Fallback to synchronous processing if idle spacing is disabled
      this.spacingNode(contextNode);
      callbacks?.onComplete?.();
      return;
    }

    // DocumentFragments don't support TreeWalker properly
    if (!(contextNode instanceof Node) || contextNode instanceof DocumentFragment) {
      callbacks?.onComplete?.();
      return;
    }

    // Use TreeWalker to collect text nodes with content
    const textNodes = this.performanceMonitor.measure('collectTextNodes', () => {
      return this.collectTextNodes(contextNode, true);
    });

    // Process with idle callback
    this.processTextNodesWithIdleCallback(textNodes, callbacks);
  }

  public spacingNodesWithIdleCallback(nodes: Node[], callbacks?: IdleSpacingCallbacks): void {
    if (!this.idleSpacingConfig.enabled) {
      // Fallback to synchronous processing if idle spacing is disabled
      for (const node of nodes) {
        this.spacingNode(node);
      }
      callbacks?.onComplete?.();
      return;
    }

    if (nodes.length === 0) {
      callbacks?.onComplete?.();
      return;
    }

    // Collect all text nodes from all input nodes
    const allTextNodes: Node[] = [];
    for (const node of nodes) {
      // Skip DocumentFragments as they don't support TreeWalker properly
      if (!(node instanceof Node) || node instanceof DocumentFragment) {
        continue;
      }

      const textNodes = this.performanceMonitor.measure('collectTextNodes', () => {
        return this.collectTextNodes(node, true);
      });
      
      allTextNodes.push(...textNodes);
    }

    // Process all collected text nodes with idle callback
    this.processTextNodesWithIdleCallback(allTextNodes, callbacks);
  }

  // Visibility check configuration methods

  public enableVisibilityCheck(config?: Partial<VisibilityCheckConfig>): void {
    this.visibilityCheckConfig = {
      ...this.visibilityCheckConfig,
      enabled: true,
      ...config
    };
  }

  public disableVisibilityCheck(): void {
    this.visibilityCheckConfig.enabled = false;
  }

  public getVisibilityCheckConfig(): VisibilityCheckConfig {
    return { ...this.visibilityCheckConfig };
  }

  // Visibility checking utility methods

  public isElementVisuallyHidden(element: Element): boolean {
    if (!this.visibilityCheckConfig.enabled) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const config = this.visibilityCheckConfig.commonHiddenPatterns;

    // Check display: none
    if (config.displayNone && style.display === 'none') {
      return true;
    }

    // Check visibility: hidden
    if (config.visibilityHidden && style.visibility === 'hidden') {
      return true;
    }

    // Check opacity: 0
    if (config.opacityZero && parseFloat(style.opacity) === 0) {
      return true;
    }

    // Check clip: rect patterns (screen reader only content)
    if (config.clipRect) {
      const clip = style.clip;
      // Common patterns: rect(1px, 1px, 1px, 1px) or rect(0, 0, 0, 0)
      if (clip && (
        clip.includes('rect(1px, 1px, 1px, 1px)') ||
        clip.includes('rect(0px, 0px, 0px, 0px)') ||
        clip.includes('rect(0, 0, 0, 0)')
      )) {
        return true;
      }
    }

    // Check height: 1px; width: 1px patterns
    if (config.heightWidth1px) {
      const height = parseInt(style.height, 10);
      const width = parseInt(style.width, 10);
      
      if (height === 1 && width === 1) {
        // Additional checks for common screen reader patterns
        const overflow = style.overflow;
        const position = style.position;
        
        if (overflow === 'hidden' && position === 'absolute') {
          return true;
        }
      }
    }

    return false;
  }

  protected shouldSkipSpacingAfterNode(node: Node): boolean {
    if (!this.visibilityCheckConfig.enabled) {
      return false;
    }

    // Check if the node or its parent element is visually hidden
    let elementToCheck: Element | null = null;
    
    if (node instanceof Element) {
      elementToCheck = node;
    } else if (node.parentElement) {
      elementToCheck = node.parentElement;
    }

    if (elementToCheck && this.isElementVisuallyHidden(elementToCheck)) {
      return true;
    }

    // Check if any ancestor is visually hidden
    let currentElement = elementToCheck?.parentElement;
    while (currentElement) {
      if (this.isElementVisuallyHidden(currentElement)) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }

    return false;
  }
}

export const pangu = new BrowserPangu();

export default pangu;
