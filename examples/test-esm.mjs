// Test ESM imports
import assert from 'node:assert/strict';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import pangu, { NodePangu, pangu as namedPangu } from 'pangu';
import * as panguNamespace from 'pangu';
// The browser entry is importable in plain Node: the spacing engine is platform-free and DOM APIs are only touched inside the DOM-walking methods, never at module scope
import browserPangu, { BrowserPangu, pangu as namedBrowserPangu } from 'pangu/browser';

console.log('=== Testing ESM Imports ===\n');

// Test default export
assert.equal(typeof pangu.spacingText, 'function');
console.log('Default import works');

// In ESM, use the named import (NodePangu is not attached to the instance)
assert.notEqual(NodePangu, undefined);
console.log('NodePangu named import works');

// The named `pangu` export is the same instance as the default export
assert.equal(namedPangu, pangu);
console.log('Named pangu import is the default instance');

// A namespace import exposes the full surface, and every face is the same instance
assert.equal(panguNamespace.default, pangu);
assert.equal(panguNamespace.pangu, pangu);
assert.equal(panguNamespace.NodePangu, NodePangu);
console.log('Namespace import exposes default, pangu, and NodePangu');

// Test functionality
const text = '測試ESM模組';
const spaced = pangu.spacingText(text);
assert.equal(spaced, '測試 ESM 模組');
console.log(`\nTest spacing: "${text}" → "${spaced}"`);

// Test instance creation
const customPangu = new NodePangu();
assert.equal(customPangu.spacingText('測試test'), '測試 test');
console.log('Custom instance works');

// Test that pangu is the instance itself
assert.ok(pangu instanceof NodePangu);
console.log('\nVerifying pangu is an instance');

// Test async file spacing
const filePath = join(tmpdir(), 'pangu-example-esm.txt');
await writeFile(filePath, '測試spacingFile方法');
try {
  assert.equal(await pangu.spacingFile(filePath), '測試 spacingFile 方法');
  console.log('spacingFile() works');
} finally {
  await unlink(filePath);
}

// The ./browser subpath has the same three-face surface, and its text engine works anywhere
assert.equal(namedBrowserPangu, browserPangu);
assert.ok(browserPangu instanceof BrowserPangu);
assert.equal(browserPangu.spacingText('測試test'), '測試 test');
console.log('\npangu/browser default, named pangu, and BrowserPangu work');

console.log('\nESM imports working correctly!');
