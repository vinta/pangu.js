// Test CommonJS imports
const pangu = require('pangu');
const { NodePangu } = require('pangu');

console.log('=== Testing CommonJS Imports ===\n');

// Test default export
console.log('Default require works:', typeof pangu.spacingText === 'function');
console.log('Can access NodePangu:', typeof pangu.NodePangu === 'function');
console.log('NodePangu destructured:', NodePangu !== undefined);

// Test functionality
const text = '測試CommonJS模組';
const spaced = pangu.spacingText(text);
console.log(`\nTest spacing: "${text}" → "${spaced}"`);

// Test instance creation
const customPangu = new NodePangu();
console.log('Custom instance works:', customPangu.spacingText('測試test') === '測試 test');

// Test that pangu is the instance itself
console.log('\nVerifying pangu is an instance:', pangu instanceof NodePangu);

console.log('\nCommonJS imports working correctly!');
