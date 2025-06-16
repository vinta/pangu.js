export declare class NodePangu extends Pangu {
    spacingFile(path: string): Promise<string>;
    spacingFile(path: string, callback: (err: Error | null, data?: string) => void): Promise<string>;
    spacingFileSync(path: string): string;
}

declare class Pangu {
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

declare const pangu: NodePangu;
export default pangu;
export { pangu }

export { }
