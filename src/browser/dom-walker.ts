export const blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
export const ignoredTags = /^(code|pre|script|style|textarea|iframe|input)$/i;
export const presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i;
export const spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
export const spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
export const ignoredClass = 'no-pangu-spacing';

function isSpecificTag(node: Node, tagRegex: RegExp) {
  return !!(node && node.nodeName && tagRegex.test(node.nodeName));
}

function isContentEditable(node: Node) {
  return node instanceof HTMLElement && (node.isContentEditable || node.getAttribute('g_editable') === 'true');
}

function hasIgnoredClass(node: Node) {
  // Check the node itself if it's an element
  if (node instanceof Element && node.classList.contains(ignoredClass)) {
    return true;
  }

  // Check the parent node (for text nodes)
  if (node.parentNode && node.parentNode instanceof Element && node.parentNode.classList.contains(ignoredClass)) {
    return true;
  }
  return false;
}

export function collectTextNodes(contextNode: Node, reverse = false) {
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

      // Skip nodes that should be ignored (same as canIgnoreNode check)
      // We need to check the node itself and its ancestors
      let currentNode = node;
      while (currentNode) {
        if (currentNode instanceof Element) {
          // Check for ignored tags
          if (ignoredTags.test(currentNode.nodeName)) {
            return NodeFilter.FILTER_REJECT;
          }
          // Check for contentEditable
          if (isContentEditable(currentNode)) {
            return NodeFilter.FILTER_REJECT;
          }
          // Check for ignored class
          if (currentNode.classList.contains(ignoredClass)) {
            return NodeFilter.FILTER_REJECT;
          }
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

export function canIgnoreNode(node: Node) {
  let currentNode = node;
  if (
    currentNode &&
    (isSpecificTag(currentNode, ignoredTags) || isContentEditable(currentNode) || hasIgnoredClass(currentNode))
  ) {
    // We will skip processing any children of ignored elements, so don't need to check all ancestors
    return true;
  }
  while (currentNode.parentNode) {
    currentNode = currentNode.parentNode;
    if (currentNode && (isSpecificTag(currentNode, ignoredTags) || isContentEditable(currentNode))) {
      return true;
    }
  }
  return false;
}

export function isFirstTextChild(parentNode: Node, targetNode: Node) {
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

export function isLastTextChild(parentNode: Node, targetNode: Node) {
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
