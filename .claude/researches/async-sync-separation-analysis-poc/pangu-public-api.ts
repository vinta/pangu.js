import { BrowserPangu } from './pangu-ultra-simple';

// Clean public API with clear async/sync separation
export class PanguAPI {
  private pangu = new BrowserPangu();

  // ============ TEXT METHODS (for strings) ============
  
  spacingText(text: string): string {
    return this.pangu.spacingText(text);
  }

  // ============ DOM METHODS - ASYNC ============
  
  // Element by ID
  async spacingElementById(id: string): Promise<void> {
    const element = document.getElementById(id);
    if (element) {
      await this.pangu.spacingNodeAsync(element);
    }
  }

  // Elements by class
  async spacingElementsByClassName(className: string): Promise<void> {
    const elements = document.getElementsByClassName(className);
    await Promise.all(
      Array.from(elements).map(el => this.pangu.spacingNodeAsync(el))
    );
  }

  // Elements by tag
  async spacingElementsByTagName(tagName: string): Promise<void> {
    const elements = document.getElementsByTagName(tagName);
    await Promise.all(
      Array.from(elements).map(el => this.pangu.spacingNodeAsync(el))
    );
  }

  // Single node
  async spacingNode(node: Node): Promise<void> {
    await this.pangu.spacingNodeAsync(node);
  }

  // Entire page
  async spacingPage(): Promise<void> {
    await this.pangu.spacingPage();
  }

  // Page title only
  async spacingPageTitle(): Promise<void> {
    const title = document.querySelector('head > title');
    if (title) {
      await this.pangu.spacingNodeAsync(title);
    }
  }

  // Page body only
  async spacingPageBody(): Promise<void> {
    await this.pangu.spacingNodeAsync(document.body);
  }

  // ============ DOM METHODS - SYNC ============

  spacingElementByIdSync(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      this.pangu.spacingNodeSync(element);
    }
  }

  spacingElementsByClassNameSync(className: string): void {
    const elements = document.getElementsByClassName(className);
    Array.from(elements).forEach(el => this.pangu.spacingNodeSync(el));
  }

  spacingElementsByTagNameSync(tagName: string): void {
    const elements = document.getElementsByTagName(tagName);
    Array.from(elements).forEach(el => this.pangu.spacingNodeSync(el));
  }

  spacingNodeSync(node: Node): void {
    this.pangu.spacingNodeSync(node);
  }

  spacingPageSync(): void {
    this.pangu.spacingPageSync();
  }

  spacingPageTitleSync(): void {
    const title = document.querySelector('head > title');
    if (title) {
      this.pangu.spacingNodeSync(title);
    }
  }

  spacingPageBodySync(): void {
    this.pangu.spacingNodeSync(document.body);
  }

  // ============ AUTO SPACING ============

  startAutoSpacing(): void {
    this.pangu.startAutoSpacing();
  }

  stopAutoSpacing(): void {
    this.pangu.stopAutoSpacing();
  }

  // ============ CONFIGURATION ============

  enableVisibilityDetection(): void {
    this.pangu.visibilityDetector.config.enabled = true;
  }

  disableVisibilityDetection(): void {
    this.pangu.visibilityDetector.config.enabled = false;
  }

  isElementHidden(element: Element): boolean {
    return this.pangu.visibilityDetector.isElementVisuallyHidden(element);
  }
}

// Export singleton instance
export const pangu = new PanguAPI();

// Usage examples:
// 
// Async (returns Promise):
// await pangu.spacingPage();
// await pangu.spacingElementById('content');
// 
// Sync (immediate):
// pangu.spacingPageSync();
// pangu.spacingTextNode(node);
//
// Auto-spacing:
// pangu.startAutoSpacing();
// pangu.stopAutoSpacing();