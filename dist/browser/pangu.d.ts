import { Pangu } from '../shared';
export interface AutoSpacingPageConfig {
    pageDelayMs: number;
    nodeDelayMs: number;
    nodeMaxWaitMs: number;
}
export interface SmartAutoSpacingPageConfig extends AutoSpacingPageConfig {
    sampleSize: number;
}
export declare class BrowserPangu extends Pangu {
    isAutoSpacingPageExecuted: boolean;
    blockTags: RegExp;
    ignoredTags: RegExp;
    presentationalTags: RegExp;
    spaceLikeTags: RegExp;
    spaceSensitiveTags: RegExp;
    ignoredClass: string;
    constructor();
    spacingNodeByXPath(xPathQuery: string, contextNode: Node): void;
    spacingNode(contextNode: Node): void;
    spacingElementById(idName: string): void;
    spacingElementByClassName(className: string): void;
    spacingElementByTagName(tagName: string): void;
    spacingPageTitle(): void;
    spacingPageBody(): void;
    spacingPage(): void;
    autoSpacingPage(config?: Partial<AutoSpacingPageConfig>): void;
    hasCJK(sampleSize?: number): boolean;
    smartAutoSpacingPage(config?: Partial<SmartAutoSpacingPageConfig>): void;
    protected isContentEditable(node: any): any;
    protected isSpecificTag(node: Node, tagRegex: RegExp): boolean | "";
    protected isInsideSpecificTag(node: Node, tagRegex: RegExp, checkCurrent?: boolean): boolean;
    protected hasIgnoredClass(node: Node): boolean;
    protected canIgnoreNode(node: Node): boolean;
    protected isFirstTextChild(parentNode: Node, targetNode: Node): boolean;
    protected isLastTextChild(parentNode: Node, targetNode: Node): boolean;
    protected watchForCJKContent(config: AutoSpacingPageConfig): void;
}
export declare const pangu: BrowserPangu;
export default pangu;
