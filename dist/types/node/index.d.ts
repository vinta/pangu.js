import { Pangu } from '../shared';
export declare class NodePangu extends Pangu {
    spacingFile(path: string): Promise<string>;
    spacingFile(path: string, callback: (err: Error | null, data?: string) => void): Promise<string>;
    spacingFileSync(path: string): string;
}
declare const pangu: NodePangu;
export { pangu };
export default pangu;
