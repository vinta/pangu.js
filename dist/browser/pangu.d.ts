import { Pangu } from '../shared';
export interface AutoSpacingPageConfig {
    pageDelayMs?: number;
    nodeDelayMs?: number;
    nodeMaxWaitMs?: number;
}
export interface SmartAutoSpacingPageConfig extends AutoSpacingPageConfig {
    sampleSize?: number;
    cjkObserverMaxWaitMs?: number;
}
export declare class BrowserPangu extends Pangu {
    isAutoSpacingPageExecuted: boolean;
    protected autoSpacingPageObserver: MutationObserver | null;
    protected cjkObserver: MutationObserver | null;
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
    autoSpacingPage({ pageDelayMs, nodeDelayMs, nodeMaxWaitMs, }?: AutoSpacingPageConfig): void;
    hasCjk(sampleSize?: number): boolean;
    smartAutoSpacingPage({ pageDelayMs, nodeDelayMs, nodeMaxWaitMs, sampleSize, cjkObserverMaxWaitMs, }?: SmartAutoSpacingPageConfig): void;
    protected isContentEditable(node: any): any;
    protected isSpecificTag(node: Node, tagRegex: RegExp): boolean | "";
    protected isInsideSpecificTag(node: Node, tagRegex: RegExp, checkCurrent?: boolean): boolean;
    protected hasIgnoredClass(node: Node): boolean;
    protected canIgnoreNode(node: Node): boolean;
    protected isFirstTextChild(parentNode: Node, targetNode: Node): boolean;
    protected isLastTextChild(parentNode: Node, targetNode: Node): boolean;
    stopAutoSpacingPage(): void;
    protected setupCjkObserver({ pageDelayMs, nodeDelayMs, nodeMaxWaitMs, sampleSize, cjkObserverMaxWaitMs, }: SmartAutoSpacingPageConfig): void;
}
export declare const pangu: BrowserPangu;
export default pangu;
