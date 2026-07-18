export declare class DomWalker {
    static readonly blockTags: RegExp;
    static readonly ignoredTags: RegExp;
    static readonly spaceLikeTags: RegExp;
    static readonly spaceSensitiveTags: RegExp;
    static readonly ignoredClass = "no-pangu-spacing";
    static collectTextNodes(contextNode: Node, reverse?: boolean): Text[];
    static findBoundaryNode(textNode: Node, edge: 'first' | 'last'): Node;
    static isFirstTextChild(parentNode: Node, targetNode: Node): boolean;
    static isLastTextChild(parentNode: Node, targetNode: Node): boolean;
    private static isContentEditable;
}
