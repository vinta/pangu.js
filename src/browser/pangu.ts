import { Pangu } from '../shared/index.js';
import { decideBoundarySpacing, decideTextNodeSpacing, respaceCurrentTail } from './dom/boundary-spacing.js';
import { DomWalker } from './dom/dom-walker.js';
import { VisibilityDetector } from './dom/visibility-detector.js';
import { TaskScheduler } from './scheduling/task-scheduler.js';
import { debounce, once, waitForVideosToLoad } from './scheduling/timing.js';

export interface AutoSpacePageConfig {
  pageDelayMs?: number;
  nodeDelayMs?: number;
  nodeMaxWaitMs?: number;
}

interface UnsettledTextNode {
  readonly node: Text; // the spaced but unsettled text is in node.data
  readonly unspaced: string;
}

export interface SettledTextNode extends UnsettledTextNode {
  readonly settled: string;
}

export interface LateFix {
  readonly node: Text;
  readonly settled: string;
  readonly data: string;
}

const TRAILING_WHITESPACE = /\s$/;
const LEADING_WHITESPACE = /^\s/;

export class BrowserPangu extends Pangu {
  // Pre-paint re-space stays bounded: subtrees with more text nodes than this fall back to the queue
  private static readonly maxSyncTextNodes = 256;

  private autoSpacePageObserver: MutationObserver | null = null;

  // Last data we wrote per text node: distinguishes pangu's own mutation records
  // (data still equals the entry, drop them) from page re-renders of spaced content
  // (data differs, re-space before the next paint)
  private readonly lastWrittenData = new WeakMap<Text, string>();

  // Text nodes a late fix wrote. While such a node still holds what pangu last wrote, the rules leave its text alone and only pair its boundaries
  private readonly lateFixedTextNodes = new WeakSet<Text>();

  public readonly taskScheduler = new TaskScheduler();
  public readonly visibilityDetector = new VisibilityDetector();

  // A callback called after spaceTextNodes() settles a batch of text nodes, carrying each node's text before/after spacing
  // The Chrome extension's AI spacing uses it to apply late fixes from LLM
  public onTextNodesSettled: ((settledTextNodes: SettledTextNode[]) => void) | null = null;

  // PUBLIC

  public autoSpacePage({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacePageConfig = {}) {
    if (!(document.body instanceof Node)) {
      return;
    }

    if (this.autoSpacePageObserver) {
      return;
    }

    const observer = this.setupAutoSpacePageObserver(nodeDelayMs, nodeMaxWaitMs);

    // Skipped once stopAutoSpacePage() dropped this observer before the delay elapsed
    waitForVideosToLoad(
      pageDelayMs,
      once(() => {
        if (this.autoSpacePageObserver === observer) {
          this.spacePage();
        }
      }),
    );
  }

  public spacePage() {
    // Page title
    const title = document.querySelector('head > title');
    if (title) {
      this.spaceNode(title);
    }

    // Page body
    this.spaceNode(document.body);
  }

  public spaceNode(contextNode: Node) {
    // Only process nodes with actual content (excluding text nodes that contain only whitespace)
    const textNodes = DomWalker.collectTextNodes(contextNode, true);
    this.schedule(() => this.spaceTextNodes(textNodes));
  }

  public stopAutoSpacePage() {
    if (this.autoSpacePageObserver) {
      this.autoSpacePageObserver.disconnect();
      this.autoSpacePageObserver = null;
    }
  }

  public applyLateFixes(lateFixes: readonly LateFix[]) {
    this.schedule(() => {
      for (const lateFix of lateFixes) {
        if (!lateFix.node.isConnected || lateFix.node.data !== lateFix.settled) {
          continue;
        }

        lateFix.node.data = lateFix.data;
        this.lastWrittenData.set(lateFix.node, lateFix.data);
        this.lateFixedTextNodes.add(lateFix.node);
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

  private spaceTextNodes(textNodes: Node[]) {
    // Visibility answers are memoized per batch; styles may change between batches
    this.visibilityDetector.clearCache();

    // Text nodes waiting for the batch to settle: unspaced text captured now, settled text read at the batch tail
    const unsettledTextNodes: UnsettledTextNode[] = [];

    let nextTextNode: Node | null = null;

    // Process nodes in the order provided
    for (const currentTextNode of textNodes) {
      if (currentTextNode instanceof Text) {
        // A node holding a late fix takes part in boundary spacing only: text spacing would undo the fix. The host still gets it at the batch tail, since a boundary can rewrite it
        if (this.holdsLateFix(currentTextNode)) {
          if (this.onTextNodesSettled) {
            unsettledTextNodes.push({ node: currentTextNode, unspaced: currentTextNode.data });
          }
        } else {
          this.applyTextNodeSpacing(currentTextNode, unsettledTextNodes);
        }
      }

      // Boundary between this text node and the following one, for every adjacent pair rather than only nested tags. The list is in reverse document order, so nextTextNode is the previously visited node
      if (nextTextNode) {
        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }

        // Superscripts attach to their base, including when their text is wrapped in a link or another inline element
        const nextSuperscript: Element | null | undefined = nextTextNode.parentElement?.closest('sup');
        if (nextSuperscript && !nextSuperscript.contains(currentTextNode)) {
          nextTextNode = currentTextNode;
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

        const boundarySpacingDecision = decideBoundarySpacing({
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
          currentBoundaryIsSpaceSensitive: DomWalker.spaceSensitiveTags.test(currentBoundaryNode.nodeName) || currentTextNode.parentElement?.closest('sup')?.contains(nextTextNode) === false,
          nextBoundaryIsBlock: DomWalker.blockTags.test(nextBoundaryNode.nodeName),
          nextBoundaryIsIgnored: DomWalker.ignoredTags.test(nextBoundaryNode.nodeName),
          nextBoundaryIsSpaceSensitive: DomWalker.spaceSensitiveTags.test(nextBoundaryNode.nodeName),
          hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(nextNode),
          hiddenBoundaryAfter: () => this.isHiddenBoundaryAfter(currentNode),
          inGridOrFlexContainer: () => !!nextBoundaryNode.parentNode && this.isGridOrFlexContainer(nextBoundaryNode.parentNode),
        });

        // A junction space can come with a second space that belongs inside the current text node's tail (CJK/ + CJK reads CJK / CJK): write the respaced tail back before placing the junction space
        if (boundarySpacingDecision !== 'none' && !this.holdsLateFix(currentTextNode)) {
          const respacedTail = respaceCurrentTail(currentTail, nextFirst);
          if (respacedTail !== null) {
            currentTextNode.data = currentTextNode.data.slice(0, currentTextNode.data.length - currentTail.length) + respacedTail;
            this.lastWrittenData.set(currentTextNode, currentTextNode.data);
          }
        }

        switch (boundarySpacingDecision) {
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

    // At this point, the text nodes in this batch are "settled": the loop above is over, so nothing in this batch writes to them again
    // Settled only means the rules are done with them. A late fix from applyLateFixes() can still change them in a later batch
    this.emitTextNodesSettled(unsettledTextNodes);
  }

  // A page rewrite breaks the equality, so the node is spaced by the rules again until the host fixes it again
  private holdsLateFix(textNode: Text) {
    return this.lateFixedTextNodes.has(textNode) && this.lastWrittenData.get(textNode) === textNode.data;
  }

  private emitTextNodesSettled(unsettledTextNodes: readonly UnsettledTextNode[]) {
    if (unsettledTextNodes.length === 0) {
      return;
    }

    const settledTextNodes = unsettledTextNodes.map(({ node, unspaced }) => ({ node, unspaced, settled: node.data }));
    this.onTextNodesSettled?.(settledTextNodes);
  }

  private applyTextNodeSpacing(textNode: Text, unsettledTextNodes: UnsettledTextNode[]) {
    // A node the rules space again no longer holds a late fix
    this.lateFixedTextNodes.delete(textNode);
    const textNodeSpacingDecisions = decideTextNodeSpacing({
      text: textNode.data,
      previousElementLastChar: this.findPreviousElementLastChar(textNode),
      hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(textNode),
    });

    for (const textNodeSpacingDecision of textNodeSpacingDecisions) {
      switch (textNodeSpacingDecision) {
        case 'trim-leading-space':
          textNode.data = textNode.data.substring(1);
          this.lastWrittenData.set(textNode, textNode.data);
          break;
        case 'prepend-space':
          textNode.data = ` ${textNode.data}`;
          this.lastWrittenData.set(textNode, textNode.data);
          break;
        case 'apply-text-spacing': {
          if (this.onTextNodesSettled) {
            unsettledTextNodes.push({ node: textNode, unspaced: textNode.data });
          }
          const newText = this.spaceText(textNode.data);
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
  private spaceNodeSync(contextNode: Node, maxTextNodes: number) {
    const textNodes = DomWalker.collectTextNodes(contextNode);
    if (textNodes.length > maxTextNodes) {
      return false;
    }
    this.spaceTextNodes(this.withNeighborTextNodes(textNodes).reverse());
    return true;
  }

  // A mutated node's text nodes plus the text node on each side, so the junction with an unchanged sibling is paired too: a placeholder span filled after the page was spaced sits tight against
  // text the page pass already settled
  private withNeighborTextNodes(textNodes: Text[]) {
    const firstTextNode = textNodes[0];
    const lastTextNode = textNodes[textNodes.length - 1];
    if (!firstTextNode || !lastTextNode) {
      return textNodes;
    }
    const previousTextNode = DomWalker.findAdjacentTextNode(firstTextNode, 'previous');
    const nextTextNode = DomWalker.findAdjacentTextNode(lastTextNode, 'next');
    return [...(previousTextNode ? [previousTextNode] : []), ...textNodes, ...(nextTextNode ? [nextTextNode] : [])];
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
    if (previousNode?.nodeType === Node.ELEMENT_NODE && previousNode.textContent) {
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

  private setupAutoSpacePageObserver(nodeDelayMs: number, nodeMaxWaitMs: number) {
    const queue: Node[] = [];

    // Debounce timers outlive disconnect(): both callbacks bail once stopAutoSpacePage() dropped this observer
    const spaceTitleDebounced = debounce(
      () => {
        if (this.autoSpacePageObserver !== observer) {
          return;
        }
        const titleElement = document.querySelector('head > title');
        if (titleElement) {
          this.spaceNode(titleElement);
        }
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    const spaceQueuedNodesDebounced = debounce(
      () => {
        if (this.autoSpacePageObserver !== observer) {
          return;
        }
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
          const textNodes = DomWalker.collectTextNodes(node);
          for (const textNode of this.withNeighborTextNodes(textNodes)) {
            if (!seenTextNodes.has(textNode)) {
              seenTextNodes.add(textNode);
              allTextNodes.push(textNode);
            }
          }
        }
        allTextNodes.reverse();

        this.schedule(() => this.spaceTextNodes(allTextNodes));
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    // See: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    const observer = new MutationObserver((mutations) => {
      let titleChanged = false;

      // If this batch removed content we already spaced, there is usually a page re-render
      // So the added nodes below are re-spaced with spaceNodeSync(), before the browser paints the re-rendered text
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
        // Skip to avoid double processing - title handled separately by spaceTitleDebounced()
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
                  break;
                }

                // The current text node's data doesn't match what we last wrote, which usually means there is a page re-render
                // So re-space it before the next paint so the re-render never paints
                if (this.spaceNodeSync(node.parentNode, BrowserPangu.maxSyncTextNodes)) {
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
                if (removedSpacedContent && this.spaceNodeSync(node, BrowserPangu.maxSyncTextNodes)) {
                  continue;
                }
                queue.push(node); // Element added, process its text content
              } else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                if (removedSpacedContent && this.spaceNodeSync(node.parentNode, BrowserPangu.maxSyncTextNodes)) {
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
        spaceTitleDebounced();
      }

      spaceQueuedNodesDebounced();
    });
    this.autoSpacePageObserver = observer;

    // A single MutationObserver can observe multiple targets simultaneously
    observer.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return observer;
  }
}

export const pangu = new BrowserPangu();

export default pangu;
