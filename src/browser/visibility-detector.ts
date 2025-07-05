export interface VisibilityDetectorConfig {
  enabled: boolean;
  commonHiddenPatterns: {
    clipRect: boolean;
    displayNone: boolean;
    visibilityHidden: boolean;
    opacityZero: boolean;
    heightWidth1px: boolean;
  };
}

export class VisibilityDetector {
  public readonly config: VisibilityDetectorConfig = {
    enabled: true,
    commonHiddenPatterns: {
      clipRect: true, // clip: rect(1px, 1px, 1px, 1px) patterns
      displayNone: true, // display: none
      visibilityHidden: true, // visibility: hidden
      opacityZero: true, // opacity: 0
      heightWidth1px: true, // height: 1px; width: 1px
    },
  };

  public isElementVisuallyHidden(element: Element) {
    if (!this.config.enabled) {
      return false;
    }

    const style = getComputedStyle(element);
    const patterns = this.config.commonHiddenPatterns;

    // Check display: none
    if (patterns.displayNone && style.display === 'none') {
      return true;
    }

    // Check visibility: hidden
    if (patterns.visibilityHidden && style.visibility === 'hidden') {
      return true;
    }

    // Check opacity: 0
    if (patterns.opacityZero && parseFloat(style.opacity) === 0) {
      return true;
    }

    // Check clip: rect patterns (screen reader only content)
    if (patterns.clipRect) {
      const clip = style.clip;
      // Common patterns: rect(1px, 1px, 1px, 1px) or rect(0, 0, 0, 0)
      if (clip && (clip.includes('rect(1px, 1px, 1px, 1px)') || clip.includes('rect(0px, 0px, 0px, 0px)') || clip.includes('rect(0, 0, 0, 0)'))) {
        return true;
      }
    }

    // Check height: 1px; width: 1px patterns
    if (patterns.heightWidth1px) {
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

  public shouldSkipSpacingAfterNode(node: Node) {
    if (!this.config.enabled) {
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

  public shouldSkipSpacingBeforeNode(node: Node) {
    if (!this.config.enabled) {
      return false;
    }

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
      if (previousNode instanceof Element && this.isElementVisuallyHidden(previousNode)) {
        return true;
      } else if (previousNode instanceof Text && previousNode.parentElement && this.isElementVisuallyHidden(previousNode.parentElement)) {
        return true;
      }
    }

    return false;
  }

  public updateConfig(config: Partial<VisibilityDetectorConfig>) {
    Object.assign(this.config, config);

    // Handle nested commonHiddenPatterns object if provided
    if (config.commonHiddenPatterns) {
      Object.assign(this.config.commonHiddenPatterns, config.commonHiddenPatterns);
    }
  }
}
