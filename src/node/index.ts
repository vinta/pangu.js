import * as fs from 'fs';
import { Pangu } from '../shared';

export class NodePangu extends Pangu {
  spacingFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const spacingData = this.spacingText(data);
        resolve(spacingData);
      });
    });
  }

  spacingFileSync(path: string): string {
    return this.spacingText(fs.readFileSync(path, 'utf8'));
  }
}

// Create default instance
const pangu = new NodePangu();

// Export for TypeScript/ESM
export { pangu };
export default pangu;
