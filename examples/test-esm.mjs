// Test both ESM and CommonJS imports
import pangu from 'pangu';
import { NodePangu } from 'pangu';

console.log('=== Testing ESM Imports ===\n');

// Test default export
console.log('Default import works:', typeof pangu.spacingText === 'function');
console.log('Can access NodePangu:', typeof pangu.NodePangu === 'function');
console.log('NodePangu destructured:', NodePangu !== undefined);

// Test functionality
const text = '測試ESM模組';
const spaced = pangu.spacingText(text);
console.log(`\nTest spacing: "${text}" → "${spaced}"`);

// Test instance creation
const customPangu = new NodePangu();
console.log('Custom instance works:', customPangu.spacingText('測試test') === '測試 test');

// Test that pangu is the instance itself
console.log('\nVerifying pangu is an instance:', pangu instanceof NodePangu);

console.log('\nESM imports working correctly!');
