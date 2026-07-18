export class DomWalker {
  public static readonly blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
  public static readonly ignoredTags = /^(code|pre|script|style|textarea|iframe|input)$/i;
  public static readonly spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
  public static readonly spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
  public static readonly ignoredClass = 'no-pangu-spacing';

  public static collectTextNodes(contextNode: Node, reverse = false) {
    const nodes: Text[] = [];

    // Handle edge cases
    if (!contextNode || contextNode instanceof DocumentFragment) {
      return nodes;
    }

    const walker = document.createTreeWalker(contextNode, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // Skip whitespace-only nodes
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip nodes that should be ignored
        // We need to check the node itself and its ancestors
        let currentNode = node;
        while (currentNode) {
          if (currentNode instanceof Element && this.isIgnoredElement(currentNode)) {
            return NodeFilter.FILTER_REJECT;
          }
          currentNode = currentNode.parentNode as Node;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    // Collect all text nodes
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }

    // Return in reverse order if requested
    return reverse ? nodes.reverse() : nodes;
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
    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
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
      const childNode = childNodes[i];
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
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
