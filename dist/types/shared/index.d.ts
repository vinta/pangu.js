export declare class Pangu {
    version: string;
    constructor();
    convertToFullwidth(symbols: string): string;
    spacingSync(text: string): string;
    spacing(text: string): string;
}
export declare const pangu: Pangu;
export default pangu;
