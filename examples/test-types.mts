// Type-level counterpart to the runtime examples.
//
// The runtime examples cannot catch a broken .d.ts: Vite rewrites module specifiers when it emits the JS, so the published JavaScript works even when the published types do not. tsc emits the .d.ts files
// verbatim, so a relative import written without a file extension ships as-is and fails to resolve for any consumer on moduleResolution node16/nodenext. This file is checked the way such a consumer
// resolves the package, so that class of bug fails here instead of reaching npm.
import panguNode, { NodePangu, pangu as namedPanguNode } from 'pangu';
import panguBrowser, { BrowserPangu, pangu as namedPanguBrowser, type AutoSpacingPageConfig } from 'pangu/browser';

// Members inherited from the shared Pangu base class. These are the ones that disappear when dist/node/index.d.ts cannot resolve its '../shared/index.js' import, because NodePangu then extends an error type
export const spaced: string = panguNode.spacingText('當你凝視著bug');
export const isProper: boolean = panguNode.hasProperSpacing('當你凝視著 bug');
export const version: string = panguNode.version;

// Members declared directly on NodePangu
export const fileSpaced: Promise<string> = panguNode.spacingFile('example.txt');
export const fileSpacedSync: string = panguNode.spacingFileSync('example.txt');

// The named exports must stay constructible and keep the inherited surface
export const nodeInstance: NodePangu = new NodePangu();
export const nodeInstanceSpaced: string = nodeInstance.spacingText('當你凝視著bug');

// The named `pangu` exports carry the same instance types as the defaults on both entries
export const namedNodeInstance: NodePangu = namedPanguNode;

// The ./browser subpath export resolves its own declaration chain, so it needs the same coverage
export const browserInstance: BrowserPangu = new BrowserPangu();
export const browserSpaced: string = browserInstance.spacingText('當你凝視著bug');
export const browserDefaultSpaced: string = panguBrowser.spacingText('當你凝視著bug');
export const namedBrowserInstance: BrowserPangu = namedPanguBrowser;

// The config interface is public API for autoSpacingPage() callers, so its exported shape is pinned here
export const config: AutoSpacingPageConfig = { pageDelayMs: 100, nodeDelayMs: 50, nodeMaxWaitMs: 200 };
