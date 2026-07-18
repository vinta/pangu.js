export interface VisibilityDetectorConfig {
    enabled: boolean;
}
export declare class VisibilityDetector {
    readonly config: VisibilityDetectorConfig;
    isElementVisuallyHidden(element: Element): boolean;
    shouldSkipSpacingAfterNode(node: Node): boolean;
    shouldSkipSpacingBeforeNode(node: Node): boolean;
}
