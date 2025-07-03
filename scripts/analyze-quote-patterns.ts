// Analyze why we have separate CJK_QUOTE and QUOTE_CJK patterns

const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const QUOTES_FULL = '\`"\u05f4';

// Current approach: separate patterns
const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES_FULL}])`, 'g');
const QUOTE_CJK = new RegExp(`([${QUOTES_FULL}])([${CJK}])`, 'g');

// Alternative: paired quote pattern
const QUOTE_CONTENT_QUOTE = new RegExp(`([${QUOTES_FULL}])([^${QUOTES_FULL}]+)\\1`, 'g');
const QUOTE_CJK_QUOTE = new RegExp(`([${QUOTES_FULL}])([${CJK}][^${QUOTES_FULL}]*)\\1`, 'g');

console.log('=== Current Approach (Separate Patterns) ===\n');

const testCases = [
  '中文"English"中文',
  '前面`中間`後面',
  'Hello"世界"test',
  '"中文only"',
  'Mixed"中文and English"text',
  '嵌套"外层"内容"内层"结束',
  'Unclosed"中文',
  '"Unclosed中文',
  '`! git commit -a -m "蛤"`',
  'Multiple"quotes"in"text"here'
];

for (const test of testCases) {
  console.log(`Input: "${test}"`);
  
  // Apply current approach
  let current = test;
  current = current.replace(CJK_QUOTE, '$1 $2');
  current = current.replace(QUOTE_CJK, '$1 $2');
  console.log(`Current approach: "${current}"`);
  
  // Try paired approach
  let paired = test;
  paired = paired.replace(QUOTE_CONTENT_QUOTE, (match, quote, content) => {
    // Check if content has CJK
    const hasCJK = new RegExp(`[${CJK}]`).test(content);
    if (hasCJK) {
      // Add spaces around quotes
      return `${quote} ${content} ${quote}`;
    }
    return match;
  });
  console.log(`Paired approach:  "${paired}"`);
  
  console.log('');
}

console.log('\n=== Analysis ===\n');
console.log('Advantages of separate patterns (current):');
console.log('1. Handles unclosed quotes gracefully');
console.log('2. Works with nested or multiple quotes');
console.log('3. Simple and predictable - each boundary is handled independently');
console.log('4. No need to match closing quotes');
console.log('');

console.log('Disadvantages of separate patterns:');
console.log('1. Can add unwanted spaces inside code blocks (like backticks)');
console.log('2. Treats opening and closing quotes independently');
console.log('3. May add spaces where not semantically needed');
console.log('');

console.log('Advantages of paired patterns:');
console.log('1. Treats quoted content as a semantic unit');
console.log('2. Could handle different quote types differently');
console.log('3. Better control over what gets spaced');
console.log('');

console.log('Disadvantages of paired patterns:');
console.log('1. Fails with unclosed quotes');
console.log('2. Complex with nested quotes');
console.log('3. Harder to handle mixed quote types');
console.log('4. Regex complexity increases significantly');