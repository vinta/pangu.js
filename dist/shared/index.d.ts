export declare class Pangu {
    version: string;
    constructor();
    spacingText(text: string): string;
    spacing(text: string): string;
    protected convertToFullwidth(symbols: string): string;
}
export declare const pangu: Pangu;
export default pangu;
