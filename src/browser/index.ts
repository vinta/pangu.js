import { Pangu } from '../shared';
import { DomUtils } from './dom-utils';
import { IdleProcessor, type IdleSpacingConfig } from './idle-processor';
import { VisibilityDetector, type VisibilityCheckConfig } from './visibility-detector';

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

export class BrowserPangu extends Pangu {
  private isAutoSpacingPageExecuted = false;
  private idleProcessor: IdleProcessor;
  private visibilityDetector: VisibilityDetector;

  protected autoSpacingPageObserver: MutationObserver | null = null;

  constructor() {
    super();
    this.idleProcessor = new IdleProcessor();
    this.visibilityDetector = new VisibilityDetector();
  }

  // PUBLIC

  public autoSpacingPage({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacingPageConfig = {}) {
    if (!(document.body instanceof Node)) {
      return;
    }

    if (this.isAutoSpacingPageExecuted) {
      return;
    }

    this.isAutoSpacingPageExecuted = true;

    this.waitForVideosAndSpacePage(pageDelayMs);

    this.setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs);
  }

  public spacingPage() {
    this.spacingPageTitle();
    this.spacingPageBody();
  }

  public spacingPageTitle() {
    const titleElement = document.querySelector('head > title');
    if (titleElement) {
      this.spacingNode(titleElement);
    }
  }

  public spacingPageBody() {
    // Process the entire body element
    // The collectTextNodes method already filters out:
    // 1. Whitespace-only text nodes
    // 2. Text inside ignored tags (script, style, textarea, etc.)
    // 3. Text inside contentEditable elements
    // 4. Text inside elements with no-pangu-spacing class
    this.spacingNode(document.body);
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

  public get idleSpacingConfig() {
    return this.idleProcessor.config;
  }

  public get visibilityCheckConfig() {
    return this.visibilityDetector.config;
  }

  public updateIdleSpacingConfig(config: Partial<IdleSpacingConfig>) {
    this.idleProcessor.updateConfig(config);
  }

  public updateVisibilityCheckConfig(config: Partial<VisibilityCheckConfig>) {
    this.visibilityDetector.updateConfig(config);
  }

  public isElementVisuallyHidden(element: Element) {
    return this.visibilityDetector.isElementVisuallyHidden(element);
  }

  // INTERNAL

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
      if (DomUtils.canIgnoreNode(currentTextNode)) {
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
        if (currentTextNode.nextSibling && DomUtils.spaceLikeTags.test(currentTextNode.nextSibling.nodeName)) {
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
        while (currentAncestor.parentNode && DomUtils.isLastTextChild(currentAncestor.parentNode, currentAncestor) && !DomUtils.spaceSensitiveTags.test(currentAncestor.parentNode.nodeName)) {
          currentAncestor = currentAncestor.parentNode;
        }

        // Find the highest ancestor that contains only the next text node
        let nextAncestor = nextTextNode as Node;
        while (nextAncestor.parentNode && DomUtils.isFirstTextChild(nextAncestor.parentNode, nextAncestor) && !DomUtils.spaceSensitiveTags.test(nextAncestor.parentNode.nodeName)) {
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
          while (nextNode.parentNode && !DomUtils.spaceSensitiveTags.test(nextNode.nodeName) && DomUtils.isFirstTextChild(nextNode.parentNode, nextNode)) {
            nextNode = nextNode.parentNode;
          }

          let currentNode: Node = currentTextNode;
          while (currentNode.parentNode && !DomUtils.spaceSensitiveTags.test(currentNode.nodeName) && DomUtils.isLastTextChild(currentNode.parentNode, currentNode)) {
            currentNode = currentNode.parentNode;
          }

          if (currentNode.nextSibling) {
            if (DomUtils.spaceLikeTags.test(currentNode.nextSibling.nodeName)) {
              nextTextNode = currentTextNode;
              continue;
            }
          }

          if (!DomUtils.blockTags.test(currentNode.nodeName)) {
            if (!DomUtils.spaceSensitiveTags.test(nextNode.nodeName)) {
              if (!DomUtils.ignoredTags.test(nextNode.nodeName) && !DomUtils.blockTags.test(nextNode.nodeName)) {
                if (nextTextNode.previousSibling) {
                  if (!DomUtils.spaceLikeTags.test(nextTextNode.previousSibling.nodeName)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      // Check visibility before adding space
                      if (!this.visibilityDetector.shouldSkipSpacingAfterNode(currentTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                } else {
                  if (!DomUtils.canIgnoreNode(nextTextNode)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      // Check visibility before adding space
                      if (!this.visibilityDetector.shouldSkipSpacingAfterNode(currentTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                }
              }
            } else if (!DomUtils.spaceSensitiveTags.test(currentNode.nodeName)) {
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
                    if (!DomUtils.spaceLikeTags.test(nextNode.previousSibling.nodeName)) {
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

  protected collectTextNodes(contextNode: Node, reverse = false) {
    return DomUtils.collectTextNodes(contextNode, reverse);
  }

  protected spacingNodeWithTreeWalker(contextNode: Node) {
    // DocumentFragments don't support TreeWalker properly
    if (!(contextNode instanceof Node) || contextNode instanceof DocumentFragment) {
      return;
    }

    // Use TreeWalker to collect text nodes with content
    const textNodes = this.collectTextNodes(contextNode, true);

    // Choose processing method based on idle spacing configuration
    if (this.idleSpacingConfig.enabled) {
      this.processTextNodesWithIdleCallback(textNodes);
    } else {
      // Process the collected text nodes using the shared logic (synchronous)
      this.processTextNodes(textNodes);
    }
  }

  protected processTextNodesWithIdleCallback(textNodes: Node[], onComplete?: () => void) {
    this.idleProcessor.processInChunks(textNodes, (chunk) => this.processTextNodes(chunk), onComplete);
  }

  protected waitForVideosAndSpacePage(pageDelayMs: number) {
    // Wait for videos to load before spacing to avoid layout shifts
    // See: https://github.com/vinta/pangu.js/issues/117
    const spacingPageOnce = once(() => {
      this.spacingPage();
    });

    const videos = Array.from(document.getElementsByTagName('video'));

    if (videos.length === 0) {
      // No videos, proceed with normal delay
      setTimeout(spacingPageOnce, pageDelayMs);
    } else {
      // Check if all videos are already loaded
      const allVideosLoaded = videos.every((video) => video.readyState >= 3);

      if (allVideosLoaded) {
        // All videos loaded, proceed with normal delay
        setTimeout(spacingPageOnce, pageDelayMs);
      } else {
        // Wait for all videos to load
        let loadedCount = 0;
        const videoCount = videos.length;

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= videoCount) {
            setTimeout(spacingPageOnce, pageDelayMs);
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
        setTimeout(spacingPageOnce, pageDelayMs + 5000);
      }
    }
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
            // Collect all text nodes from all input nodes
            const allTextNodes: Node[] = [];
            for (const node of nodesToProcess) {
              // Skip DocumentFragments as they don't support TreeWalker properly
              if (!(node instanceof Node) || node instanceof DocumentFragment) {
                continue;
              }

              const textNodes = this.collectTextNodes(node, true);
              allTextNodes.push(...textNodes);
            }

            // Process all collected text nodes with idle callback
            this.processTextNodesWithIdleCallback(allTextNodes);
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
}

export const pangu = new BrowserPangu();

export default pangu;
