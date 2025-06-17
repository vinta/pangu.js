import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

import { Pangu } from '../shared';

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
