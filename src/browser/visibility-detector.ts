export class VisibilityDetector {
  // Verdicts repeat heavily within one spacing batch: every boundary re-checks
  // the same ancestor chain (p → body → html). Scoped to a batch via clearCache()
  // because page styles can change between batches
  private verdictCache = new WeakMap<Element, boolean>();

  public clearCache() {
    this.verdictCache = new WeakMap();
  }

  public isElementVisuallyHidden(element: Element) {
    const style = getComputedStyle(element);

    // Check display: none
    if (style.display === 'none') {
      return true;
    }

    // Check visibility: hidden
    if (style.visibility === 'hidden') {
      return true;
    }

    // Check opacity: 0
    if (parseFloat(style.opacity) === 0) {
      return true;
    }

    // Check clip: rect patterns (screen reader only content)
    // Common patterns: rect(1px, 1px, 1px, 1px) or rect(0, 0, 0, 0)
    const clip = style.clip;
    if (clip && (clip.includes('rect(1px, 1px, 1px, 1px)') || clip.includes('rect(0px, 0px, 0px, 0px)') || clip.includes('rect(0, 0, 0, 0)'))) {
      return true;
    }

    // Check height: 1px; width: 1px patterns (screen reader only content).
    // height/width are layout-dependent, so reading them forces a reflow on a
    // dirty tree — gate them behind the style-only overflow/position checks
    if (style.overflow === 'hidden' && style.position === 'absolute') {
      const height = parseInt(style.height, 10);
      const width = parseInt(style.width, 10);

      if (height === 1 && width === 1) {
        return true;
      }
    }

    return false;
  }

  public shouldSkipSpacingAfterNode(node: Node) {
    // Check if the node or its parent element is visually hidden
    let elementToCheck: Element | null = null;

    if (node instanceof Element) {
      elementToCheck = node;
    } else if (node.parentElement) {
      elementToCheck = node.parentElement;
    }

    if (elementToCheck && this.isElementVisuallyHiddenCached(elementToCheck)) {
      return true;
    }

    // Check if any ancestor is visually hidden
    let currentElement = elementToCheck?.parentElement;
    while (currentElement) {
      if (this.isElementVisuallyHiddenCached(currentElement)) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }

    return false;
  }

  public shouldSkipSpacingBeforeNode(node: Node) {
    // Find the previous sibling that might be hidden
    let previousNode = node.previousSibling;

    // Walk up the DOM tree to find the actual previous element
    if (!previousNode && node.parentElement) {
      let parent: Element | null = node.parentElement;
      while (parent && !previousNode) {
        previousNode = parent.previousSibling;
        if (!previousNode) {
          parent = parent.parentElement;
        }
      }
    }

    // Check if the previous node is hidden
    if (previousNode) {
      if (previousNode instanceof Element && this.isElementVisuallyHiddenCached(previousNode)) {
        return true;
      } else if (previousNode instanceof Text && previousNode.parentElement && this.isElementVisuallyHiddenCached(previousNode.parentElement)) {
        return true;
      }
    }

    return false;
  }

  private isElementVisuallyHiddenCached(element: Element) {
    const cached = this.verdictCache.get(element);
    if (cached !== undefined) {
      return cached;
    }
    const verdict = this.isElementVisuallyHidden(element);
    this.verdictCache.set(element, verdict);
    return verdict;
  }
}
