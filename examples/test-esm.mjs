// Test ESM imports
import assert from 'node:assert/strict';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import pangu from 'pangu';
import { NodePangu } from 'pangu';

console.log('=== Testing ESM Imports ===\n');

// Test default export
assert.equal(typeof pangu.spacingText, 'function');
console.log('Default import works');

// In ESM, use the named import (NodePangu is not attached to the instance)
assert.notEqual(NodePangu, undefined);
console.log('NodePangu named import works');

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

console.log('\nESM imports working correctly!');
