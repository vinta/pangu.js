export type BoundarySpacingVerdict = 'none' | 'prepend-next' | 'append-current' | 'insert-element';
export type TextRunSpacingVerdict = 'trim-leading-space' | 'prepend-space' | 'apply-text-spacing';
export interface BoundarySpacingContext {
    currentLast: string;
    nextFirst: string;
    currentEndsWithSpace: boolean;
    nextStartsWithSpace: boolean;
    whitespaceBetween: boolean;
    spaceLikeSiblingAfterCurrent: boolean;
    spaceLikeSiblingAfterCurrentBoundary: boolean;
    spaceLikeSiblingBeforeNext: boolean;
    spaceLikeSiblingBeforeNextBoundary: boolean;
    currentBoundaryIsBlock: boolean;
    currentBoundaryIsSpaceSensitive: boolean;
    nextBoundaryIsBlock: boolean;
    nextBoundaryIsIgnored: boolean;
    nextBoundaryIsSpaceSensitive: boolean;
    hiddenBoundaryBefore: () => boolean;
    hiddenBoundaryAfter: () => boolean;
    inGridOrFlexContainer: () => boolean;
}
export interface TextRunSpacingContext {
    text: string;
    previousElementLastChar: string | null;
    hiddenBoundaryBefore: () => boolean;
}
export declare function decideBoundarySpacing(context: BoundarySpacingContext): "none" | "prepend-next" | "append-current" | "insert-element";
export declare function decideTextRunSpacing(context: TextRunSpacingContext): TextRunSpacingVerdict[];
