import { Pangu } from '../shared';
export declare class NodePangu extends Pangu {
    spacingFile(path: string): Promise<string>;
    spacingFileSync(path: string): string;
}
declare const pangu: NodePangu;
export { pangu };
export default pangu;
