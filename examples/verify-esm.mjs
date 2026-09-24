// Test ESM imports
import assert from 'node:assert/strict';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as panguNamespace from 'pangu';
import pangu, { NodePangu, pangu as namedPangu } from 'pangu';
// The browser entry is importable in plain Node: the spacing engine is platform-free and DOM APIs are only touched inside the DOM-walking methods, never at module scope
import browserPangu, { BrowserPangu, DomWalker, TaskScheduler, VisibilityDetector, pangu as namedBrowserPangu } from 'pangu/browser';
import standalonePangu from 'pangu/browser/standalone';
import sharedPangu, { CJK, Pangu, pangu as namedSharedPangu } from 'pangu/shared';

console.log('=== Testing ESM Imports ===\n');

// Test default export
assert.equal(typeof pangu.spaceText, 'function');
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
const spaced = pangu.spaceText(text);
assert.equal(spaced, '測試 ESM 模組');
console.log(`\nTest spacing: "${text}" → "${spaced}"`);

// Test instance creation
const customPangu = new NodePangu();
assert.equal(customPangu.spaceText('測試test'), '測試 test');
console.log('Custom instance works');

// Test that pangu is the instance itself
assert.ok(pangu instanceof NodePangu);
console.log('\nVerifying pangu is an instance');

// Test async file spacing
const filePath = join(tmpdir(), 'pangu-example-esm.txt');
await writeFile(filePath, '測試spaceFile方法');
try {
  assert.equal(await pangu.spaceFile(filePath), '測試 spaceFile 方法');
  console.log('spaceFile() works');
} finally {
  await unlink(filePath);
}

// The ./browser subpath has the same three-face surface, and its text engine works anywhere
assert.equal(namedBrowserPangu, browserPangu);
assert.ok(browserPangu instanceof BrowserPangu);
assert.equal(browserPangu.spaceText('測試test'), '測試 test');
console.log('\npangu/browser default, named pangu, and BrowserPangu work');

// The classes behind the public taskScheduler and visibilityDetector fields are importable, and so is DomWalker
assert.ok(browserPangu.taskScheduler instanceof TaskScheduler);
assert.ok(browserPangu.visibilityDetector instanceof VisibilityDetector);
assert.equal(typeof DomWalker.isIgnoredElement, 'function');
console.log('pangu/browser DomWalker, TaskScheduler, and VisibilityDetector work');

// The ./browser/standalone subpath is the one-file build, so it inlines its own engine instead of sharing the Pangu class
assert.equal(standalonePangu.spaceText('測試test'), '測試 test');
console.log('pangu/browser/standalone default works');

// The ./shared subpath has the same three-face surface, plus the patterns the engine is built from
assert.equal(namedSharedPangu, sharedPangu);
assert.ok(sharedPangu instanceof Pangu);
assert.equal(sharedPangu.spaceText('測試test'), '測試 test');
assert.ok(new RegExp(`[${CJK}]`).test('測試'));
console.log('pangu/shared default, named pangu, Pangu, and CJK work');

// Every entry imports the one Pangu in pangu/shared instead of inlining its own copy
assert.ok(pangu instanceof Pangu);
assert.ok(browserPangu instanceof Pangu);
console.log('pangu and pangu/browser share the Pangu class of pangu/shared');

console.log('\nESM imports working correctly!');
