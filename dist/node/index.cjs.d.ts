import { Pangu } from '../shared/index';
declare class NodePangu extends Pangu {
    spacingFile(path: string): Promise<string>;
    spacingFileSync(path: string): string;
}
declare const pangu: NodePangu;
export = pangu;
