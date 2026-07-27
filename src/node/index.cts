// TypeScript 5.8+ under NodeNext models Node's require(esm) and resolves the ESM entry's types directly. Runtime never performs the require either way, since Rolldown inlines the ESM entry into this bundle.

// `import =` rather than `import from` because `verbatimModuleSyntax` rejects ESM syntax in a CommonJS file (TS1286), and this file has to emit CommonJS for the `export =` at the bottom to be legal
// at all. Unlike a bare `require()` call, this form is typed by the compiler.
// The namespace access below (`index.NodePangu`) is also load-bearing: a top-level `NodePangu` binding would collide with the inlined `class NodePangu`, and Rolldown would rename the class to `NodePangu$1`,
// which is observable through `constructor.name` and in stack traces
import index = require('./index.js');

// The module is a NodePangu instance carrying the named exports as class fields, so the object is complete at construction and no cast is needed anywhere. The class declaration is also what puts the
// properties in the emitted .d.cts, so the published types show the same surface the runtime has instead of hiding it from every require() consumer
class PanguModule extends index.NodePangu {
  // Allows both: const pangu = require('pangu') AND const { NodePangu } = require('pangu')
  NodePangu = index.NodePangu;
  pangu: PanguModule = this;
  // Pure surface parity, not interop. `export =` sets no `__esModule` flag, so a default import already receives the whole module and does not need this. What needs it is explicit `.default` access
  // from a require() consumer, which is undefined without it.
  default: PanguModule = this;
}

const pangu = new PanguModule();

// `export =` is not a preference here, it is the only spelling that both runs and types. `export default` and `export const` are ESM syntax, which `verbatimModuleSyntax` rejects in a CommonJS file.
// A plain `module.exports = pangu` assignment compiles and behaves identically at runtime, but TypeScript models export assignment only in .js files, so the emitted .d.cts collapses to `export {}`
// and every property access in a consumer becomes TS2339.
export = pangu;
