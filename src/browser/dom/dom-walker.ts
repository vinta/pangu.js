export class DomWalker {
  public static readonly blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
  public static readonly ignoredTags = /^(code|pre|script|style|textarea|iframe|input)$/i;
  public static readonly spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
  public static readonly spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
  public static readonly ignoredClass = 'no-pangu-spacing';

  public static collectTextNodes(contextNode: Node, reverse = false) {
    const nodes: Text[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS callers can pass a missing element
    if (!contextNode || contextNode instanceof DocumentFragment) {
      return nodes;
    }

    const walker = this.createTextWalker(contextNode);

    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }

    return reverse ? nodes.reverse() : nodes;
  }

  // The nearest text node collectTextNodes() would return before or after the given one, across inline ancestors. The search stops at the closest block ancestor, since boundary spacing never crosses
  // a block edge, and at <body>, so a body text node never pairs with the title
  public static findAdjacentTextNode(textNode: Text, direction: 'previous' | 'next') {
    let root: Node = textNode;
    while (root.parentNode && root !== document.body && !this.blockTags.test(root.nodeName)) {
      root = root.parentNode;
    }
    const walker = this.createTextWalker(root);
    walker.currentNode = textNode;
    return (direction === 'previous' ? walker.previousNode() : walker.nextNode()) as Text | null;
  }

  // The highest ancestor that starts (edge 'first') or ends (edge 'last') with the
  // given text node. Stops ON a space-sensitive element, so the returned boundary
  // node can be the <a> itself
  public static findBoundaryNode(textNode: Node, edge: 'first' | 'last') {
    let node: Node = textNode;
    while (node.parentNode && !this.spaceSensitiveTags.test(node.nodeName) && (edge === 'first' ? this.isFirstTextChild(node.parentNode, node) : this.isLastTextChild(node.parentNode, node))) {
      node = node.parentNode;
    }
    return node;
  }

  public static isFirstTextChild(parentNode: Node, targetNode: Node) {
    const { childNodes } = parentNode;

    // Check if targetNode is the first child node (excluding comments) that has textContent
    // Note: textContent includes text from all descendants, so element nodes can match too
    for (const childNode of childNodes) {
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }

  public static isLastTextChild(parentNode: Node, targetNode: Node) {
    const { childNodes } = parentNode;

    // Check if targetNode is the last child node (excluding comments) that has textContent
    // Note: textContent includes text from all descendants, so element nodes can match too
    for (let i = childNodes.length - 1; i > -1; i--) {
      const childNode = childNodes[i]!;
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }

  // Walks the non-whitespace text nodes under root that are not inside an ignored element
  private static createTextWalker(root: Node) {
    return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }

        return this.isIgnoredNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
  }

  public static isIgnoredNode(node: Node) {
    let currentNode: Node | null = node;
    while (currentNode) {
      if (currentNode instanceof Element && this.isIgnoredElement(currentNode)) {
        return true;
      }
      currentNode = currentNode.parentNode;
    }
    return false;
  }

  public static isIgnoredElement(element: Element) {
    return this.ignoredTags.test(element.nodeName) || this.isContentEditable(element) || element.classList.contains(this.ignoredClass);
  }

  private static isContentEditable(node: Node) {
    return node instanceof HTMLElement && (node.isContentEditable || node.getAttribute('g_editable') === 'true');
  }
}
