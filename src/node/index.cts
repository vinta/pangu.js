/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('node:fs') as typeof import('node:fs');
const { readFile } = require('node:fs/promises') as typeof import('node:fs/promises');
const { Pangu } = require('../shared/index.cjs') as typeof import('../shared/index.js');
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

// The module is a NodePangu instance carrying the named exports as properties. Declaring them here rather than casting to any is what puts them in the emitted .d.cts, so the published types show the same
// surface the runtime has instead of hiding it from every require() consumer
interface PanguModule extends NodePangu {
  NodePangu: typeof NodePangu;
  pangu: PanguModule;
  default: PanguModule;
}

// Create the pangu instance
const pangu = new NodePangu() as PanguModule;

// Add named exports as properties on the instance
// This allows both: const pangu = require('pangu') AND const { NodePangu } = require('pangu')
pangu.NodePangu = NodePangu;
pangu.pangu = pangu;
pangu.default = pangu;

// Export pangu instance as the module
export = pangu;
