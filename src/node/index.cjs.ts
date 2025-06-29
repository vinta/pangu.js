// CommonJS entry point that provides the expected interface:
// const pangu = require('pangu') -> gives pangu instance directly
import { Pangu } from '../shared/index';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

// Re-implement NodePangu here to avoid circular imports
class NodePangu extends Pangu {
  async spacingFile(path: string): Promise<string> {
    const data = await readFile(path, 'utf8');
    return this.spacingText(data);
  }

  spacingFileSync(path: string): string {
    return this.spacingText(readFileSync(path, 'utf8'));
  }
}

// Create the pangu instance
const pangu = new NodePangu();

// Add named exports as properties on the instance
// This allows both: const pangu = require('pangu') AND const { NodePangu } = require('pangu')
/* eslint-disable @typescript-eslint/no-explicit-any */
(pangu as any).NodePangu = NodePangu;
(pangu as any).pangu = pangu;
(pangu as any).default = pangu;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Export pangu instance as the module
// @ts-expect-error - Using CommonJS export for compatibility
export = pangu;
