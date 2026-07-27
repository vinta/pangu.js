// Test CommonJS imports
const assert = require('node:assert/strict');

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

console.log('\nCommonJS imports working correctly!');
