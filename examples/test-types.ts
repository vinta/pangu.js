// Type-level counterpart to the runtime examples.
//
// The runtime examples cannot catch a broken .d.ts: Vite rewrites module specifiers when it emits the JS, so the published JavaScript works even when the published types do not. tsc emits the .d.ts files
// verbatim, so a relative import written without a file extension ships as-is and fails to resolve for any consumer on moduleResolution node16/nodenext. This file is checked the way such a consumer
// resolves the package, so that class of bug fails here instead of reaching npm.
// 'pangu/browser' is intentionally absent here: its export has no require condition, so a CJS consumer cannot resolve it and only test-types.mts covers that subpath
import panguNode, { NodePangu } from 'pangu';

// Members inherited from the shared Pangu base class. These are the ones that disappear when dist/node/index.d.ts cannot resolve its '../shared/index.js' import, because NodePangu then extends an error type
export const spaced: string = panguNode.spacingText('當你凝視著bug');
export const isProper: boolean = panguNode.hasProperSpacing('當你凝視著 bug');
export const version: string = panguNode.version;

// Members declared directly on NodePangu
export const fileSpaced: Promise<string> = panguNode.spacingFile('example.txt');
export const fileSpacedSync: string = panguNode.spacingFileSync('example.txt');

// The named exports must stay constructible and keep the inherited surface. The CJS entry is `export =` an instance, so NodePangu arrives as a value only and InstanceType is how a require() consumer names
// the type; test-types.mts covers the class-as-type spelling that the ESM declarations support
export const nodeInstance: InstanceType<typeof NodePangu> = new NodePangu();
export const nodeInstanceSpaced: string = nodeInstance.spacingText('當你凝視著bug');
