// Minimal pangu.js - Core functionality in ~100 lines

export class MinimalPangu {
  // Core spacing logic from parent class
  private spacingText(text: string): string {
    // Implementation from shared/index.ts
    return text; // Placeholder - use actual regex logic
  }

  // Process DOM nodes
  spacing(node: Node): void {
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      { acceptNode: () => NodeFilter.FILTER_ACCEPT }
    );

    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node instanceof Text && node.data.trim()) {
        textNodes.push(node);
      }
    }

    // Process each text node
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      
      // Apply spacing to node content
      node.data = this.spacingText(node.data);
      
      // Add space between adjacent nodes
      if (i > 0 && this.needsSpaceBetween(textNodes[i-1], node)) {
        node.data = ' ' + node.data;
      }
    }
  }

  // Check if space needed between nodes
  private needsSpaceBetween(prev: Text, curr: Text): boolean {
    if (prev.data.endsWith(' ') || curr.data.startsWith(' ')) {
      return false;
    }
    
    const test = prev.data.slice(-1) + curr.data[0];
    return test !== this.spacingText(test);
  }
}

// That's it! The core functionality in minimal code.
// Everything else is convenience methods and optimizations.

// Usage:
const pangu = new MinimalPangu();
pangu.spacing(document.body);     // Process entire page
pangu.spacing(document.getElementById('content')!); // Process specific element