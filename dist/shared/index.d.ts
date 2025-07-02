declare const ANY_CJK: RegExp;
export declare class Pangu {
    version: string;
    constructor();
    spacingText(text: string): string;
    hasProperSpacing(text: string): boolean;
}
export declare const pangu: Pangu;
export { ANY_CJK };
export default pangu;
