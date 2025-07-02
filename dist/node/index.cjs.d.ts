declare const Pangu: any;
declare class NodePangu extends Pangu {
    spacingFile(path: string): Promise<any>;
    spacingFileSync(path: string): any;
}
declare const pangu: NodePangu;
export = pangu;
