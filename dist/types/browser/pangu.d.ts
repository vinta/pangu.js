import { Pangu } from '../shared';
export declare class BrowserPangu extends Pangu {
    blockTags: RegExp;
    ignoredTags: RegExp;
    presentationalTags: RegExp;
    spaceLikeTags: RegExp;
    spaceSensitiveTags: RegExp;
    isAutoSpacingPageExecuted: boolean;
    constructor();
    isContentEditable(node: any): boolean;
    isSpecificTag(node: any, tagRegex: RegExp): boolean;
    isInsideSpecificTag(node: any, tagRegex: RegExp, checkCurrent?: boolean): boolean;
    canIgnoreNode(node: Node): boolean;
    isFirstTextChild(parentNode: Node, targetNode: Node): boolean;
    isLastTextChild(parentNode: Node, targetNode: Node): boolean;
    spacingNodeByXPath(xPathQuery: string, contextNode: Node): void;
    spacingNode(contextNode: Node): void;
    spacingElementById(idName: string): void;
    spacingElementByClassName(className: string): void;
    spacingElementByTagName(tagName: string): void;
    spacingPageTitle(): void;
    spacingPageBody(): void;
    spacingPage(): void;
    autoSpacingPage(pageDelay?: number, nodeDelay?: number, nodeMaxWait?: number): void;
}
declare const pangu: BrowserPangu;
export { pangu };
export default pangu;
