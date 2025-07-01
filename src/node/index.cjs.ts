/* eslint-disable @typescript-eslint/no-require-imports */
const { Pangu } = require('../shared/index.cjs');
const { readFileSync } = require('node:fs');
const { readFile } = require('node:fs/promises');
/* eslint-enable @typescript-eslint/no-require-imports */

// Re-implement NodePangu here to avoid circular imports
class NodePangu extends Pangu {
  async spacingFile(path: string) {
    const data = await readFile(path, 'utf8');
    return this.spacingText(data);
  }

  spacingFileSync(path: string) {
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
