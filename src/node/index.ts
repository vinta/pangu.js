import { Pangu } from '../shared';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

export class NodePangu extends Pangu {
  async spacingFile(path: string) {
    const data = await readFile(path, 'utf8');
    return this.spacingText(data);
  }

  spacingFileSync(path: string) {
    return this.spacingText(readFileSync(path, 'utf8'));
  }
}

export const pangu = new NodePangu();

export default pangu;
