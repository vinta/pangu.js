/* eslint-disable @typescript-eslint/no-require-imports */
// `require` rather than `import` because `verbatimModuleSyntax` rejects ESM syntax in a CommonJS file (TS1286), and this file has to emit CommonJS for the `export =` at the bottom to be legal at all
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

const pangu = new NodePanguClass() as PanguModule;

// Add named exports as properties on the instance
// This allows both: const pangu = require('pangu') AND const { NodePangu } = require('pangu')
pangu.NodePangu = NodePanguClass;
pangu.pangu = pangu;
// Pure surface parity, not interop. `export =` sets no `__esModule` flag, so a default import already receives the whole module and does not need this. What needs it is explicit `.default` access from a
// require() consumer, which is undefined without it. Pinned by examples/test-commonjs.js so the CJS surface keeps matching the ESM namespace
pangu.default = pangu;

// `export =` is not a preference here, it is the only spelling that both runs and types. `export default` and `export const` are ESM syntax, which `verbatimModuleSyntax` rejects in a CommonJS file.
// A plain `module.exports = pangu` assignment compiles and behaves identically at runtime, but TypeScript models export assignment only in .js files, so the emitted .d.cts collapses to
// `export {}` and every property access in a consumer becomes TS2339. attw stays green on that, since types and runtime still agree on format, so nothing in `lint:package` would catch the regression
export = pangu;
