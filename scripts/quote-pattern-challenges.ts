// Demonstrate challenges with paired quote patterns

const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

console.log('=== Why Paired Quote Patterns Are Challenging ===\n');

// Challenge 1: Mixed quote types
console.log('1. Mixed Quote Types:');
console.log('   Input: 他说"这是`代码`"然后...');
console.log('   Need to handle: " pairs AND ` pairs separately');
console.log('   Regex would need to match same-type quotes\n');

// Challenge 2: Nested quotes
console.log('2. Nested Quotes:');
console.log('   Input: 外层"包含\'单引号\'的"文本');
console.log('   Paired pattern might match incorrectly\n');

// Challenge 3: Unclosed quotes (common in real text)
console.log('3. Unclosed Quotes:');
console.log('   Input: 他说"中文 (missing closing quote)');
console.log('   Paired patterns would fail entirely\n');

// Challenge 4: Adjacent quotes
console.log('4. Adjacent Different Quotes:');
console.log('   Input: 中文"`backtick after quote');
console.log('   Need spaces: 中文 " ` backtick after quote\n');

// Challenge 5: Quote at text boundary
console.log('5. Quotes at Boundaries:');
console.log('   Input: "中文开头');
console.log('   Input: 结尾中文"');
console.log('   Both need handling without pairs\n');

// Demonstrate a complex paired pattern attempt
console.log('=== Attempting Complex Paired Pattern ===\n');

// This would need to handle all quote types separately
const PAIRED_BACKTICK = /`([^`]*[${CJK}][^`]*)`/g;
const PAIRED_DOUBLE = /"([^"]*[${CJK}][^"]*)"/g;
const PAIRED_SINGLE = /'([^']*[${CJK}][^']*)'/g;

const complexExample = '中文"quote"和`code`以及\'single\'混合';
console.log(`Input: "${complexExample}"`);

// Would need to apply each pattern separately
let result = complexExample;
result = result.replace(PAIRED_BACKTICK, (match, content) => {
  return `\` ${content} \``;
});
result = result.replace(PAIRED_DOUBLE, (match, content) => {
  return `" ${content} "`;
});
result = result.replace(PAIRED_SINGLE, (match, content) => {
  return `' ${content} '`;
});

console.log(`After paired patterns: "${result}"`);
console.log('Still missing spaces between CJK and quote starts!\n');

console.log('=== Conclusion ===');
console.log('Separate CJK_QUOTE and QUOTE_CJK patterns are used because:');
console.log('1. They handle ALL edge cases reliably');
console.log('2. They work with unclosed quotes');
console.log('3. They handle mixed and nested quotes correctly');
console.log('4. They are simple and predictable');
console.log('5. The main challenge is protecting certain contexts (like backticks)');
console.log('   which is better solved with placeholders than complex regex');