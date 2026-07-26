/* eslint-disable @typescript-eslint/no-require-imports */
// Aliased because the bundler inlines `class NodePangu` from the ESM entry into this output. An unaliased binding would collide with it, and Rolldown would rename the class to `NodePangu$1`, which is
// observable through `constructor.name` and in stack traces
const { NodePangu: NodePanguClass } = require('./index.js') as typeof import('./index.js');
/* eslint-enable @typescript-eslint/no-require-imports */

// The module is a NodePangu instance carrying the named exports as properties. Declaring them here rather than casting to any is what puts them in the emitted .d.cts, so the published types show the same
// surface the runtime has instead of hiding it from every require() consumer
interface PanguModule extends InstanceType<typeof NodePanguClass> {
  NodePangu: typeof NodePanguClass;
  pangu: PanguModule;
  default: PanguModule;
}

// Create the pangu instance
const pangu = new NodePanguClass() as PanguModule;

// Add named exports as properties on the instance
// This allows both: const pangu = require('pangu') AND const { NodePangu } = require('pangu')
pangu.NodePangu = NodePanguClass;
pangu.pangu = pangu;
pangu.default = pangu;

// Export pangu instance as the module
export = pangu;
