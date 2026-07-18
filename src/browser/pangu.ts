import { Pangu } from '../shared';
import { decideBoundarySpacing, decideTextRunSpacing } from './boundary-spacing';
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
    this.schedule(textNodes);
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

  private isSpaceLikeSibling(node: Node | null) {
    return !!node && DomWalker.spaceLikeTags.test(node.nodeName);
  }

  private isGridOrFlexContainer(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    const style = window.getComputedStyle(node as Element);
    const display = style.display;
    return display === 'grid' || display === 'inline-grid' || display === 'flex' || display === 'inline-flex';
  }

  private spacingTextNodes(textNodes: Node[]) {
    let currentTextNode: Node | null;
    let nextTextNode: Node | null = null;

    // Process nodes in the order provided
    for (let i = 0; i < textNodes.length; i++) {
      currentTextNode = textNodes[i];
      if (!currentTextNode) {
        continue;
      }

      if (currentTextNode instanceof Text) {
        this.applyTextRunSpacing(currentTextNode);
      }

      // Handle nested tag text processing
      if (nextTextNode) {
        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }

        const currentBoundaryNode = DomWalker.findBoundaryNode(currentTextNode, 'last');
        const nextBoundaryNode = DomWalker.findBoundaryNode(nextTextNode, 'first');
        const { whitespaceBetween, contentBetween } = this.scanBetweenTextRuns(currentBoundaryNode, nextBoundaryNode);

        // Stable bindings for the lazy facts: the loop variables are reassigned across iterations
        const currentRun = currentTextNode;
        const nextRun = nextTextNode;

        const verdict = decideBoundarySpacing({
          currentLast: currentTextNode.data.slice(-1),
          nextFirst: nextTextNode.data.slice(0, 1),
          currentEndsWithSpace: currentTextNode.data.endsWith(' '),
          nextStartsWithSpace: nextTextNode.data.startsWith(' '),
          whitespaceBetween,
          contentBetween,
          spaceLikeSiblingAfterCurrent: this.isSpaceLikeSibling(currentTextNode.nextSibling),
          spaceLikeSiblingAfterCurrentBoundary: this.isSpaceLikeSibling(currentBoundaryNode.nextSibling),
          spaceLikeSiblingBeforeNext: this.isSpaceLikeSibling(nextTextNode.previousSibling),
          spaceLikeSiblingBeforeNextBoundary: this.isSpaceLikeSibling(nextBoundaryNode.previousSibling),
          currentBoundaryIsBlock: DomWalker.blockTags.test(currentBoundaryNode.nodeName),
          currentBoundaryIsSpaceSensitive: DomWalker.spaceSensitiveTags.test(currentBoundaryNode.nodeName),
          nextBoundaryIsBlock: DomWalker.blockTags.test(nextBoundaryNode.nodeName),
          nextBoundaryIsIgnored: DomWalker.ignoredTags.test(nextBoundaryNode.nodeName),
          nextBoundaryIsSpaceSensitive: DomWalker.spaceSensitiveTags.test(nextBoundaryNode.nodeName),
          hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(nextRun),
          hiddenBoundaryAfter: () => this.isHiddenBoundaryAfter(currentRun),
          inGridOrFlexContainer: () => !!nextBoundaryNode.parentNode && this.isGridOrFlexContainer(nextBoundaryNode.parentNode),
        });

        switch (verdict) {
          case 'prepend-next':
            nextTextNode.data = ` ${nextTextNode.data}`;
            break;
          case 'append-current':
            currentTextNode.data = `${currentTextNode.data} `;
            break;
          case 'insert-element':
            this.insertPanguElement(nextBoundaryNode);
            break;
          case 'none':
            break;
        }
      }

      nextTextNode = currentTextNode;
    }
  }

  private applyTextRunSpacing(textNode: Text) {
    const verdicts = decideTextRunSpacing({
      text: textNode.data,
      previousElementLastChar: this.findPreviousElementLastChar(textNode),
      hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(textNode),
    });

    for (const verdict of verdicts) {
      switch (verdict) {
        case 'trim-leading-space':
          textNode.data = textNode.data.substring(1);
          break;
        case 'prepend-space':
          textNode.data = ` ${textNode.data}`;
          break;
        case 'apply-text-spacing': {
          const newText = this.spacingText(textNode.data);
          if (textNode.data !== newText) {
            textNode.data = newText;
          }
          break;
        }
      }
    }
  }

  private insertPanguElement(nextBoundaryNode: Node) {
    const panguSpace = document.createElement('pangu');
    panguSpace.innerHTML = ' ';

    if (nextBoundaryNode.parentNode) {
      nextBoundaryNode.parentNode.insertBefore(panguSpace, nextBoundaryNode);
    }

    // Clean up orphaned space element
    if (!panguSpace.previousElementSibling) {
      if (panguSpace.parentNode) {
        panguSpace.parentNode.removeChild(panguSpace);
      }
    }
  }

  private findPreviousElementLastChar(textNode: Node) {
    const previousNode = textNode.previousSibling;
    if (previousNode && previousNode.nodeType === Node.ELEMENT_NODE && previousNode.textContent) {
      return previousNode.textContent.slice(-1);
    }
    return null;
  }

  private scanBetweenTextRuns(currentBoundaryNode: Node, nextBoundaryNode: Node) {
    // Scan the document-order gap between the two boundary nodes. Whitespace
    // text means the runs are already separated. Collectable text (checked
    // through the same DomWalker rules that build the runs, so ignored islands
    // like <code> do not count) means the runs are not adjacent at all
    let whitespaceBetween = false;
    let contentBetween = false;

    const scan = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        if (/\s/.test(node.textContent)) {
          whitespaceBetween = true;
        }
        if (/\S/.test(node.textContent)) {
          contentBetween = true;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && DomWalker.collectTextNodes(node).length > 0) {
        contentBetween = true;
      }
    };

    // Climb from the current boundary, scanning the following siblings at each
    // level until one is or holds the next boundary. The climb never escapes
    // the common ancestor because the next boundary is found below it first
    let containerOfNext: Node | null = null;
    let node: Node | null = currentBoundaryNode;
    while (node && !containerOfNext) {
      let sibling = node.nextSibling;
      while (sibling && !sibling.contains(nextBoundaryNode)) {
        scan(sibling);
        sibling = sibling.nextSibling;
      }
      containerOfNext = sibling;
      node = node.parentNode;
    }

    // Descend to the next boundary, scanning the children before its path at
    // each level. Nothing past the boundary is ever visited
    while (containerOfNext && containerOfNext !== nextBoundaryNode) {
      let child: Node | null = containerOfNext.firstChild;
      while (child && !child.contains(nextBoundaryNode)) {
        scan(child);
        child = child.nextSibling;
      }
      containerOfNext = child;
    }

    return { whitespaceBetween, contentBetween };
  }

  private isHiddenBoundaryBefore(node: Node) {
    return this.visibilityDetector.shouldSkipSpacingBeforeNode(node);
  }

  private isHiddenBoundaryAfter(node: Node) {
    return this.visibilityDetector.shouldSkipSpacingAfterNode(node);
  }

  // The single seam that decides how spacing work is executed: synchronously,
  // as one idle-time batch, or in idle-time chunks. Visibility detection needs
  // adjacent-run context, so it always batches instead of chunking
  private schedule(textNodes: Node[]) {
    if (!this.taskScheduler.config.enabled) {
      this.spacingTextNodes(textNodes);
      return;
    }

    if (this.visibilityDetector.config.enabled) {
      this.taskScheduler.queue.add(() => {
        this.spacingTextNodes(textNodes);
      });
      return;
    }

    const { chunkSize } = this.taskScheduler.config;
    for (let i = 0; i < textNodes.length; i += chunkSize) {
      const chunk = textNodes.slice(i, i + chunkSize);
      this.taskScheduler.queue.add(() => {
        this.spacingTextNodes(chunk);
      });
    }
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
        const nodesToProcess = [...queue];
        queue.length = 0; // Clear the queue

        if (nodesToProcess.length === 0) {
          return;
        }

        // Merge all queued nodes' text runs into one reverse-document-order pass,
        // so boundary spacing sees pairs that span separately queued nodes.
        // Sort into document order first (mutation order is not document order)
        // and drop duplicate runs (a parent and its child can both be queued)
        nodesToProcess.sort((a, b) => {
          if (a === b) {
            return 0;
          }
          return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        const seenTextNodes = new Set<Node>();
        const allTextNodes: Node[] = [];
        for (const node of nodesToProcess) {
          for (const textNode of DomWalker.collectTextNodes(node)) {
            if (!seenTextNodes.has(textNode)) {
              seenTextNodes.add(textNode);
              allTextNodes.push(textNode);
            }
          }
        }
        allTextNodes.reverse();

        this.schedule(allTextNodes);
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
