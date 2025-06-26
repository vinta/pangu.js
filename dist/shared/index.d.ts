declare const ANY_CJK: RegExp;
export declare class Pangu {
    version: string;
    constructor();
    spacingText(text: string): string;
    spacing(text: string): string;
    hasPerfectSpacing(text: string): boolean;
    protected convertToFullwidth(symbols: string): string;
}
export declare const pangu: Pangu;
export { ANY_CJK };
export default pangu;
