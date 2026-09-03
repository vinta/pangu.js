import { Pangu } from '../shared/index.js';
import { decideBoundarySpacing, decideTextNodeSpacing, respaceCurrentTail } from './boundary-spacing.js';
import { DomWalker } from './dom-walker.js';
import { TaskScheduler } from './task-scheduler.js';
import { VisibilityDetector } from './visibility-detector.js';

export interface AutoSpacingPageConfig {
  pageDelayMs?: number;
  nodeDelayMs?: number;
  nodeMaxWaitMs?: number;
}

// An already settled (== spaced) text node, with before/after of the spacing
export interface SettledTextNode {
  readonly node: Text;
  readonly before: string;
  readonly after: string;
}

// A late fix: a correction to the rules output, anything that comes from a non-rules spacing engine like an LLM (the Chrome Prompt API)
export interface LateFix {
  readonly node: Text;
  readonly settled: string;
  readonly data: string;
}

// Any whitespace at a text node's edge already separates it from the neighboring text node, matching the /\s/ that scanBetweenTextNodes uses on the nodes in the gap.
// \s covers NBSP, which spacingText never rewrites, so an author's NBSP reaches this check intact and must still count as a space
const TRAILING_WHITESPACE = /\s$/;
const LEADING_WHITESPACE = /^\s/;

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

// Main call flows from autoSpacingPage() to requestIdleCallback():
//
// Entry A and Entry B are independent: the observer is live at once while the sweep waits pageDelayMs, so a mutation in that window is spaced before the sweep. Both land in the same FIFO
// queue, and a second pass over spaced text is a no-op, so the order only costs duplicate work.
//
//                          autoSpacingPage()
//                                  ↓
//     ┌────────────────────────────┴────────────────────────────┐
//     |                                                         |
// Entry A: initial page sweep                               Entry B: dynamic content (MutationObserver)
//     |                                                         |
// 1a. waitForVideosToLoad(pageDelayMs)                      1b. setupAutoSpacingPageObserver()
//     ↓                                                         ↓
// 2a. spacingPage()                                         2b. observer fires on characterData/childList
//     ├─ spacingNode(<head><title>)                             ├─ a page re-render (the page writes its own unspaced data over a text node pangu spaced, in place or by replacing the node)
//     └─ spacingNode(document.body)                             │  runs spacingNodeSync() inline, before paint, unless the subtree exceeds maxSyncTextNodes (then it is queued like everything else)
//     ↓                                                         ↓ push affected nodes onto queue
// 3a. spacingNode(node)                                         ↓ debounce(nodeDelayMs, max nodeMaxWaitMs)
//     - DomWalker.collectTextNodes(node, true)              3b. sort queued nodes into document order, dedupe, merge all their text nodes via DomWalker.collectTextNodes(), reverse
//       (reverse document order, skips                          ↓
//       whitespace-only and ignored tags)                       (title changes take their own debounce → spacingNode(<title>))
//     ↓                                                         ↓
//     └────────────────────────────┬────────────────────────────┘
//                                  ↓
// 4. schedule(task)
//    - Callers pass a closure. Spacing callers pass () => spacingTextNodes(textNodes), always ONE task holding the whole list, never chunked. applyLateFixes() (step 7) passes its
//      compare-and-set writes through the same seam
//    - Decision point: taskScheduler.config.enabled && requestIdleCallback supported?
//      ├─ NO  → task()                       (synchronous, no requestIdleCallback)
//      └─ YES (default) → taskScheduler.queue.add(task)
// ↓
// 5. TaskQueue.add() → scheduleProcessing() → requestIdleCallback(process, { timeout: 5000 })
//    - process(deadline): pops and runs queued tasks while deadline.timeRemaining() > 0; if tasks remain when the slice ends, re-arms requestIdleCallback for the rest
// ↓
// 6. spacingTextNodes(textNodes)
//    - per text node: decideTextNodeSpacing() → trim-leading-space / prepend-space / apply-text-spacing (spacingText)
//    - per adjacent text node pair: decideBoundarySpacing() → prepend-next / append-current / insert <pangu> element / none; a non-none verdict first writes back the respaced current tail
//      (respaceCurrentTail) when the junction needs one
//    - visibility detection happens here: always on, consulted lazily per boundary (hiddenBoundaryBefore / hiddenBoundaryAfter), not a scheduling decision
//    - batch tail: onTextNodesSettled fires once with every text node text spacing read (only when the extension assigned it; the package alone captures nothing)
// ↓
// 7. applyLateFixes(fixes)   (Chrome extension only, from its onTextNodesSettled handler)
//    - the extension decides AI spacing fixes off the settled nodes and hands them back as LateFix { node, settled, data }
//    - schedule(() => for each fix: write data only if node is connected and still holds settled) → back to step 4, so the fix lands with the same beat as any pending spacing,
//      including at focus on a hidden tab
//
// Summary of paths to requestIdleCallback():
// - taskScheduler.enabled=true + requestIdleCallback available → one task per schedule() call (a spacing batch or a late-fix batch), drained in idle slices
// - taskScheduler.enabled=false, or no requestIdleCallback (stock Safari) → never (fully synchronous processing)
// - pre-paint re-space inside the observer callback (2b) → never; it runs spacingTextNodes() directly and bypasses schedule()
export class BrowserPangu extends Pangu {
  // Pre-paint re-space stays bounded: subtrees with more text nodes than this fall back to the queue
  private static readonly maxSyncTextNodes = 256;

  private isAutoSpacingPageExecuted = false;
  private autoSpacingPageObserver: MutationObserver | null = null;

  // Last data pangu wrote per text node: distinguishes pangu's own mutation records
  // (data still equals the entry, drop them) from external rewrites of spaced content
  // (data differs, re-space before the next paint)
  private readonly lastWrittenData = new WeakMap<Text, string>();

  // Text nodes waiting for the batch to settle, captured from pre-spacing text and resolved against post-spacing data at the batch tail
  private unsettledTextNodes: { node: Text; before: string }[] = [];

  public readonly taskScheduler = new TaskScheduler();
  public readonly visibilityDetector = new VisibilityDetector();

  // A callback called after spacingTextNodes() settles a batch of text nodes, carrying each node's text before/after spacing
  // The Chrome extension's AI spacing uses it to apply late fixes from LLM
  public onTextNodesSettled: ((settledTextNodes: SettledTextNode[]) => void) | null = null;

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
    this.schedule(() => this.spacingTextNodes(textNodes));
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

  // Late fixes go through schedule() like every other spacing write
  public applyLateFixes(lateFixes: readonly LateFix[]) {
    this.schedule(() => {
      for (const lateFix of lateFixes) {
        // Skip if the node is no longer in the document or changed since the fix was computed
        if (!lateFix.node.isConnected || lateFix.node.data !== lateFix.settled) {
          continue;
        }

        lateFix.node.data = lateFix.data;
        this.lastWrittenData.set(lateFix.node, lateFix.data);
      }
    });
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
    // Visibility verdicts are memoized per batch; styles may change between batches
    this.visibilityDetector.clearCache();

    let currentTextNode: Node | undefined;
    let nextTextNode: Node | null = null;

    // Process nodes in the order provided
    for (let i = 0; i < textNodes.length; i++) {
      currentTextNode = textNodes[i];
      if (!currentTextNode) {
        continue;
      }

      if (currentTextNode instanceof Text) {
        this.applyTextNodeSpacing(currentTextNode);
      }

      // Boundary between this text node and the following one, for every adjacent pair rather than only nested tags. The list is in reverse document order, so nextTextNode is the previously visited node
      if (nextTextNode) {
        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }

        const currentBoundaryNode = DomWalker.findBoundaryNode(currentTextNode, 'last');
        const nextBoundaryNode = DomWalker.findBoundaryNode(nextTextNode, 'first');
        const { whitespaceBetween, contentBetween } = this.scanBetweenTextNodes(currentBoundaryNode, nextBoundaryNode);

        // Stable bindings for the lazy facts: the loop variables are reassigned across iterations
        const currentNode = currentTextNode;
        const nextNode = nextTextNode;

        const currentTail = currentTextNode.data.slice(-3);
        const nextFirst = nextTextNode.data.slice(0, 1);

        const boundarySpacingVerdict = decideBoundarySpacing({
          currentTail,
          nextFirst,
          currentEndsWithSpace: TRAILING_WHITESPACE.test(currentTextNode.data),
          nextStartsWithSpace: LEADING_WHITESPACE.test(nextTextNode.data),
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
          hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(nextNode),
          hiddenBoundaryAfter: () => this.isHiddenBoundaryAfter(currentNode),
          inGridOrFlexContainer: () => !!nextBoundaryNode.parentNode && this.isGridOrFlexContainer(nextBoundaryNode.parentNode),
        });

        // A junction space can come with a second space that belongs inside the current text node's tail (CJK/ + CJK reads CJK / CJK): write the respaced tail back before placing the junction space
        if (boundarySpacingVerdict !== 'none') {
          const respacedTail = respaceCurrentTail(currentTail, nextFirst);
          if (respacedTail !== null) {
            currentTextNode.data = currentTextNode.data.slice(0, currentTextNode.data.length - currentTail.length) + respacedTail;
            this.lastWrittenData.set(currentTextNode, currentTextNode.data);
          }
        }

        switch (boundarySpacingVerdict) {
          case 'prepend-next':
            nextTextNode.data = ` ${nextTextNode.data}`;
            this.lastWrittenData.set(nextTextNode, nextTextNode.data);
            break;
          case 'append-current':
            currentTextNode.data = `${currentTextNode.data} `;
            this.lastWrittenData.set(currentTextNode, currentTextNode.data);
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

    this.flushSettledTextNodes();
  }

  // The batch tail. Boundary spacing rewrites tails and prepends junction spaces to nodes text spacing already visited, so a snapshot is only settled once the whole batch is done.
  // unsettledTextNodes is batch-scoped state kept on the instance, which only works because spacingTextNodes runs synchronously from the first push to this drain; if that ever changes, thread a
  // local array through applyTextNodeSpacing and this function instead
  private flushSettledTextNodes() {
    if (this.unsettledTextNodes.length === 0) {
      return;
    }

    const settledTextNodes = this.unsettledTextNodes.map(({ node, before }) => ({ node, before, after: node.data }));
    this.unsettledTextNodes = [];

    this.onTextNodesSettled?.(settledTextNodes);
  }

  private applyTextNodeSpacing(textNode: Text) {
    const textNodeSpacingVerdicts = decideTextNodeSpacing({
      text: textNode.data,
      previousElementLastChar: this.findPreviousElementLastChar(textNode),
      hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(textNode),
    });

    for (const textNodeSpacingVerdict of textNodeSpacingVerdicts) {
      switch (textNodeSpacingVerdict) {
        case 'trim-leading-space':
          textNode.data = textNode.data.substring(1);
          this.lastWrittenData.set(textNode, textNode.data);
          break;
        case 'prepend-space':
          textNode.data = ` ${textNode.data}`;
          this.lastWrittenData.set(textNode, textNode.data);
          break;
        case 'apply-text-spacing': {
          // Captured before the write, because only the tight original proves which spaces the rules wrote; what any of it means is the host's policy, and lives in the extension
          if (this.onTextNodesSettled) {
            this.unsettledTextNodes.push({ node: textNode, before: textNode.data });
          }
          const newText = this.spacingText(textNode.data);
          if (textNode.data !== newText) {
            textNode.data = newText;
            this.lastWrittenData.set(textNode, textNode.data);
          }
          break;
        }
      }
    }
  }

  // Same processing as the queued paths, but synchronous, for pre-paint re-spacing
  // inside the MutationObserver callback. Returns false when the subtree exceeds
  // maxTextNodes, so the caller can fall back to the debounced queue
  private spacingNodeSync(contextNode: Node, maxTextNodes: number) {
    const textNodes = DomWalker.collectTextNodes(contextNode, true);
    if (textNodes.length > maxTextNodes) {
      return false;
    }
    this.spacingTextNodes(textNodes);
    return true;
  }

  private hasSpacedTextInSubtree(node: Node) {
    if (node instanceof Text) {
      return this.lastWrittenData.has(node);
    }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (this.lastWrittenData.has(walker.currentNode as Text)) {
        return true;
      }
    }
    return false;
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

  private scanBetweenTextNodes(currentBoundaryNode: Node, nextBoundaryNode: Node) {
    // Scan the document-order gap between the two boundary nodes. Whitespace
    // text means the nodes are already separated. Collectable text (checked
    // through the same DomWalker rules that build the list, so ignored islands
    // like <code> do not count) means the nodes are not adjacent at all
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
      } else if (node instanceof Element && !DomWalker.isIgnoredElement(node)) {
        // Descend so wrapped whitespace counts too. Ignored islands like <code>
        // stay invisible, matching how the nodes themselves are collected
        for (let child = node.firstChild; child; child = child.nextSibling) {
          scan(child);
        }
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

  // The single seam that decides how spacing work is executed: synchronously
  // or as one idle-time batch. Boundary spacing needs adjacent-node context, so
  // the node list a task closes over is never split across calls
  private schedule(task: () => void) {
    // Stock Safari ships requestIdleCallback behind a preference flag, so fall
    // back to synchronous spacing instead of throwing in TaskQueue
    if (!this.taskScheduler.config.enabled || typeof requestIdleCallback !== 'function') {
      task();
      return;
    }

    this.taskScheduler.queue.add(task);
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

        // Merge all queued nodes' text nodes into one reverse-document-order pass,
        // so boundary spacing sees pairs that span separately queued nodes.
        // Sort into document order first (mutation order is not document order)
        // and drop duplicate nodes (a parent and its child can both be queued)
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

        this.schedule(() => this.spacingTextNodes(allTextNodes));
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    this.autoSpacingPageObserver = new MutationObserver((mutations) => {
      let titleChanged = false;

      // When this batch removed content pangu already spaced, the page is re-rendering
      // over processed DOM (e.g. a framework's second render pass): added subtrees are
      // then re-spaced synchronously below, before the browser paints the reverted text
      let removedSpacedContent = false;
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (this.hasSpacedTextInSubtree(node)) {
            removedSpacedContent = true;
            break;
          }
        }
        if (removedSpacedContent) {
          break;
        }
      }

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
          case 'characterData': {
            // Text content changed (e.g., textContent set to a string with CJK directly followed by ANS)
            const { target: node } = mutation;
            if (node instanceof Text && node.parentNode) {
              const lastWritten = this.lastWrittenData.get(node);
              if (lastWritten !== undefined) {
                if (node.data === lastWritten) {
                  // pangu's own write: nothing to reprocess
                  break;
                }
                // External rewrite of a node pangu already spaced is a revert:
                // re-space it before the next paint so the revert never renders
                if (this.spacingNodeSync(node.parentNode, BrowserPangu.maxSyncTextNodes)) {
                  break;
                }
              }
              // <p>Hello CJK</p>
              // "Hello CJK" is the text node, <p> is the parent element
              queue.push(node.parentNode); // Queue parent element, not text node
            }
            break;
          }
          case 'childList': {
            // New nodes added to DOM (e.g., innerHTML change, appendChild)
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (removedSpacedContent && this.spacingNodeSync(node, BrowserPangu.maxSyncTextNodes)) {
                  continue;
                }
                queue.push(node); // Element added, process its text content
              } else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                if (removedSpacedContent && this.spacingNodeSync(node.parentNode, BrowserPangu.maxSyncTextNodes)) {
                  continue;
                }
                queue.push(node.parentNode); // Text node added, process its parent
              }
            }
            break;
          }
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
