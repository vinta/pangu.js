export declare class Pangu {
    version: string;
    constructor();
    convertToFullwidth(symbols: string): string;
    spacingSync(text: string): string;
    spacing(text: string): Promise<string>;
    spacing(text: string, callback: (err: any, result?: string) => void): void;
    spacingText(text: string): Promise<string>;
    spacingText(text: string, callback: (err: any, result?: string) => void): void;
    spacingTextSync(text: string): string;
}
export declare const pangu: Pangu;
export default pangu;
