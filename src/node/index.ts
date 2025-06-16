import * as fs from 'fs';
import { Pangu } from '../shared';

export class NodePangu extends Pangu {
  spacingFile(path: string): Promise<string>;
  spacingFile(path: string, callback: (err: Error | null, data?: string) => void): Promise<string>;
  spacingFile(path: string, callback?: (err: Error | null, data?: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          if (callback) {
            return callback(err);
          }
          return;
        }

        const spacingData = this.spacingSync(data);
        resolve(spacingData);
        if (callback) {
          return callback(null, spacingData);
        }
      });
    });
  }

  spacingFileSync(path: string): string {
    return this.spacingSync(fs.readFileSync(path, 'utf8'));
  }
}

// Create default instance
export const pangu = new NodePangu();

// Default export
export default pangu;
