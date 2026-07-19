// Test CommonJS imports
const assert = require('node:assert/strict');

const pangu = require('pangu');
const { NodePangu } = require('pangu');

console.log('=== Testing CommonJS Imports ===\n');

// Test default export
assert.equal(typeof pangu.spacingText, 'function');
console.log('Default require works');

// NodePangu is attached to the instance for CommonJS ergonomics
assert.equal(typeof pangu.NodePangu, 'function');
console.log('Can access NodePangu on the instance');

assert.notEqual(NodePangu, undefined);
console.log('NodePangu destructured');

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

console.log('\nCommonJS imports working correctly!');
