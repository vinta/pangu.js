import { Pangu } from '../shared';
import { DomWalker } from './dom-walker';
import { TaskScheduler } from './task-scheduler';
import { VisibilityDetector } from './visibility-detector';

export interface AutoSpacingPageConfig {
  pageDelayMs?: number;
  nodeDelayMs?: number;
  nodeMaxWaitMs?: number;
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

// Main call flow from autoSpacingPage() to requestIdleCallback():
//
// 1. autoSpacingPage()
// ↓
// 2. spacingPage()
// ↓
// 3. spacingNode()
//    - Collects text nodes via DomWalker.collectTextNodes()
//    - Decision point: taskScheduler.config.enabled?
//      ├─ YES → calls spacingTextNodesInQueue()
//      └─ NO  → calls spacingTextNodes() directly (synchronous, no requestIdleCallback)
// ↓
// 4. spacingTextNodesInQueue() (only if taskScheduler enabled)
//    - Decision point: visibilityDetector.config.enabled?
//      ├─ YES (default: true) → Process all nodes in one batch
//      │   └─ taskScheduler.queue.add(() => spacingTextNodes(allNodes))
//      └─ NO → Process in chunks via taskScheduler.processInChunks()
//          └─ Splits into chunks of 40 nodes
// ↓
// 5. TaskQueue.add() → scheduleProcessing() → requestIdleCallback()
//    - Timeout: 5000ms
//    - Processes tasks when browser is idle
//    - Uses IdleDeadline to check remaining time
//
// Summary of paths to requestIdleCallback():
// - taskScheduler.enabled=true + visibilityDetector.enabled=true → Single batch via requestIdleCallback
// - taskScheduler.enabled=true + visibilityDetector.enabled=false → Multiple chunks via requestIdleCallback  
// - taskScheduler.enabled=false → No requestIdleCallback (synchronous processing)
export class BrowserPangu extends Pangu {
  private isAutoSpacingPageExecuted = false;
  private autoSpacingPageObserver: MutationObserver | null = null;
  public readonly taskScheduler = new TaskScheduler();
  public readonly visibilityDetector = new VisibilityDetector();

  // PUBLIC

  public autoSpacingPage({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacingPageConfig = {}) {
    if (!(document.body instanceof Node)) {
      return;
    }

    if (this.isAutoSpacingPageExecuted) {
      return;
    }

    this.isAutoSpacingPageExecuted = true;

    // prettier-ignore
    this.waitForVideosToLoad(pageDelayMs, once(() => this.spacingPage()));
    this.setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs);
  }

  public spacingPage() {
    // Page title
    const title = document.querySelector('head > title');
    if (title) {
      this.spacingNode(title);
    }

    // Page body
    this.spacingNode(document.body);
  }

  public spacingNode(contextNode: Node) {
    // Only process nodes with actual content (excluding text nodes that contain only whitespace)
    const textNodes = DomWalker.collectTextNodes(contextNode, true);

    // Choose processing method based on idle spacing configuration
    if (this.taskScheduler.config.enabled) {
      this.spacingTextNodesInQueue(textNodes);
    } else {
      // Process the collected text nodes using the shared logic (synchronous)
      this.spacingTextNodes(textNodes);
    }
  }

  public stopAutoSpacingPage() {
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }

    this.isAutoSpacingPageExecuted = false;
  }

  public isElementVisuallyHidden(element: Element) {
    return this.visibilityDetector.isElementVisuallyHidden(element);
  }

  // INTERNAL

  // TODO: Refactor this method - it's too large and handles too many responsibilities
  private spacingTextNodes(textNodes: Node[]) {
    let currentTextNode: Node | null;
    let nextTextNode: Node | null = null;

    // Process nodes in the order provided
    for (let i = 0; i < textNodes.length; i++) {
      currentTextNode = textNodes[i];
      if (!currentTextNode) {
        continue;
      }

      // Skip nodes that should be ignored
      if (DomWalker.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }

      if (currentTextNode instanceof Text) {
        // Check if this text node starts with a space and comes after a hidden element
        if (this.visibilityDetector.config.enabled && currentTextNode.data.startsWith(' ') && this.visibilityDetector.shouldSkipSpacingBeforeNode(currentTextNode)) {
          // Remove the leading space that comes after a hidden element
          currentTextNode.data = currentTextNode.data.substring(1);
        }

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
        if (currentTextNode.nextSibling && DomWalker.spaceLikeTags.test(currentTextNode.nextSibling.nodeName)) {
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
        while (currentAncestor.parentNode && DomWalker.isLastTextChild(currentAncestor.parentNode, currentAncestor) && !DomWalker.spaceSensitiveTags.test(currentAncestor.parentNode.nodeName)) {
          currentAncestor = currentAncestor.parentNode;
        }

        // Find the highest ancestor that contains only the next text node
        let nextAncestor = nextTextNode as Node;
        while (nextAncestor.parentNode && DomWalker.isFirstTextChild(nextAncestor.parentNode, nextAncestor) && !DomWalker.spaceSensitiveTags.test(nextAncestor.parentNode.nodeName)) {
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
          while (nextNode.parentNode && !DomWalker.spaceSensitiveTags.test(nextNode.nodeName) && DomWalker.isFirstTextChild(nextNode.parentNode, nextNode)) {
            nextNode = nextNode.parentNode;
          }

          let currentNode: Node = currentTextNode;
          while (currentNode.parentNode && !DomWalker.spaceSensitiveTags.test(currentNode.nodeName) && DomWalker.isLastTextChild(currentNode.parentNode, currentNode)) {
            currentNode = currentNode.parentNode;
          }

          if (currentNode.nextSibling) {
            if (DomWalker.spaceLikeTags.test(currentNode.nextSibling.nodeName)) {
              nextTextNode = currentTextNode;
              continue;
            }
          }

          if (!DomWalker.blockTags.test(currentNode.nodeName)) {
            if (!DomWalker.spaceSensitiveTags.test(nextNode.nodeName)) {
              if (!DomWalker.ignoredTags.test(nextNode.nodeName) && !DomWalker.blockTags.test(nextNode.nodeName)) {
                if (nextTextNode.previousSibling) {
                  if (!DomWalker.spaceLikeTags.test(nextTextNode.previousSibling.nodeName)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      // Check visibility before adding space
                      if (!this.visibilityDetector.shouldSkipSpacingBeforeNode(nextTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                } else {
                  if (!DomWalker.canIgnoreNode(nextTextNode)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      // Check visibility before adding space
                      if (!this.visibilityDetector.shouldSkipSpacingBeforeNode(nextTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                }
              }
            } else if (!DomWalker.spaceSensitiveTags.test(currentNode.nodeName)) {
              if (currentTextNode instanceof Text && !currentTextNode.data.endsWith(' ')) {
                // Check visibility before adding space
                if (!this.visibilityDetector.shouldSkipSpacingAfterNode(currentTextNode)) {
                  currentTextNode.data = `${currentTextNode.data} `;
                }
              }
            } else {
              // Check visibility before inserting space element
              if (!this.visibilityDetector.shouldSkipSpacingAfterNode(currentTextNode)) {
                const panguSpace = document.createElement('pangu');
                panguSpace.innerHTML = ' ';

                if (nextNode.parentNode) {
                  if (nextNode.previousSibling) {
                    if (!DomWalker.spaceLikeTags.test(nextNode.previousSibling.nodeName)) {
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

  private spacingTextNodesInQueue(textNodes: Node[], onComplete?: () => void) {
    // When visibility detection is enabled, process all nodes together to maintain context between adjacent nodes
    // This prevents incorrect spacing after hidden elements
    if (this.visibilityDetector.config.enabled) {
      // Still use idle callback for performance, but process all nodes in one batch
      if (this.taskScheduler.config.enabled) {
        this.taskScheduler.queue.add(() => {
          this.spacingTextNodes(textNodes);
        });
        if (onComplete) {
          this.taskScheduler.queue.setOnComplete(onComplete);
        }
      } else {
        // Synchronous processing
        this.spacingTextNodes(textNodes);
        onComplete?.();
      }
      return;
    }

    // Normal chunked processing when visibility detection is disabled
    const task = (chunkedTextNodes: Node[]) => this.spacingTextNodes(chunkedTextNodes);
    this.taskScheduler.processInChunks(textNodes, task, onComplete);
  }

  private waitForVideosToLoad(delayMs: number, onLoaded: () => void) {
    // Wait for videos to load before spacing to avoid layout shifts
    // See: https://github.com/vinta/pangu.js/issues/117
    const videos = Array.from(document.getElementsByTagName('video'));

    if (videos.length === 0) {
      // No videos, proceed with normal delay
      setTimeout(onLoaded, delayMs);
    } else {
      // Check if all videos are already loaded
      const allVideosLoaded = videos.every((video) => video.readyState >= 3);

      if (allVideosLoaded) {
        // All videos loaded, proceed with normal delay
        setTimeout(onLoaded, delayMs);
      } else {
        // Wait for all videos to load
        let loadedCount = 0;
        const videoCount = videos.length;

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= videoCount) {
            setTimeout(onLoaded, delayMs);
          }
        };

        for (const video of videos) {
          if (video.readyState >= 3) {
            checkAllLoaded();
          } else {
            video.addEventListener('loadeddata', checkAllLoaded, { once: true });
          }
        }

        // Fallback timeout in case videos never load
        setTimeout(onLoaded, delayMs + 5000);
      }
    }
  }

  private setupAutoSpacingPageObserver(nodeDelayMs: number, nodeMaxWaitMs: number) {
    // Disconnect any existing auto-spacing observer
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }

    const queue: Node[] = [];

    const debouncedSpacingTitle = debounce(
      () => {
        const titleElement = document.querySelector('head > title');
        if (titleElement) {
          this.spacingNode(titleElement);
        }
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    const debouncedSpacingNode = debounce(
      () => {
        // NOTE: a single node could be very big which contains a lot of child nodes
        if (this.taskScheduler.config.enabled) {
          // Use idle processing for dynamic content
          const nodesToProcess = [...queue];
          queue.length = 0; // Clear the queue

          if (nodesToProcess.length > 0) {
            // Collect all text nodes from all input nodes
            const allTextNodes: Node[] = [];
            for (const node of nodesToProcess) {
              const textNodes = DomWalker.collectTextNodes(node, true);
              allTextNodes.push(...textNodes);
            }

            // Process all collected text nodes with idle callback
            this.spacingTextNodesInQueue(allTextNodes);
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

    // Observe page title changes
    this.autoSpacingPageObserver.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true, // Need subtree to observe text node changes inside title
    });

    // Observe page content changes
    this.autoSpacingPageObserver.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }
}

export const pangu = new BrowserPangu();

export default pangu;
