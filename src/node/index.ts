import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { Pangu } from '../shared/index.js';

export class NodePangu extends Pangu {
  async spaceFile(path: string) {
    const data = await readFile(path, 'utf8');
    return this.spaceText(data);
  }

  spaceFileSync(path: string) {
    return this.spaceText(readFileSync(path, 'utf8'));
  }
}

export const pangu = new NodePangu();

export default pangu;
