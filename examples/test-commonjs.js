// Test CommonJS imports
const assert = require('node:assert/strict');
const { unlink, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const pangu = require('pangu');
const { NodePangu, pangu: namedPangu } = require('pangu');

console.log('=== Testing CommonJS Imports ===\n');

// Test default export
assert.equal(typeof pangu.spacingText, 'function');
console.log('Default require works');

// NodePangu is attached to the instance for CommonJS ergonomics
assert.equal(typeof pangu.NodePangu, 'function');
console.log('Can access NodePangu on the instance');

assert.notEqual(NodePangu, undefined);
console.log('NodePangu destructured');

// The named exports mirror the ESM surface: `pangu` and `default` are the instance itself, so destructuring and interop default access both land on the same object
assert.equal(namedPangu, pangu);
assert.equal(pangu.pangu, pangu);
assert.equal(pangu.default, pangu);
console.log('Named pangu and interop default both point at the instance');

// Test functionality
const text = '測試CommonJS模組';
const spaced = pangu.spacingText(text);
assert.equal(spaced, '測試 CommonJS 模組');
console.log(`\nTest spacing: "${text}" → "${spaced}"`);

// Test instance creation
const customPangu = new NodePangu();
assert.equal(customPangu.spacingText('測試test'), '測試 test');
console.log('Custom instance works');

// Test that pangu is the instance itself
assert.ok(pangu instanceof NodePangu);
console.log('\nVerifying pangu is an instance');

// pangu/browser is ESM-only by design (its export has no require condition), so require() must keep failing loudly rather than resolving to something half-working
assert.throws(() => require('pangu/browser'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
console.log('require("pangu/browser") fails with ERR_PACKAGE_PATH_NOT_EXPORTED as designed');

// The exports map locks the code surface but still exposes package metadata, so tools that read a dependency's package.json at runtime keep working
assert.equal(require('pangu/package.json').name, 'pangu');
console.log('require("pangu/package.json") resolves');

// Async file spacing trails every synchronous assertion because CommonJS has no top-level await, so source order here matches execution order rather than mirroring test-esm.mjs. A failed assertion inside
// rejects, and Node exits non-zero on an unhandled rejection, so the IIFE still fails the suite
const filePath = join(tmpdir(), 'pangu-example-commonjs.txt');
(async () => {
  await writeFile(filePath, '測試spacingFile方法');
  try {
    assert.equal(await pangu.spacingFile(filePath), '測試 spacingFile 方法');
    console.log('\nspacingFile() works');
  } finally {
    await unlink(filePath);
  }

  console.log('\nCommonJS imports working correctly!');
})();
