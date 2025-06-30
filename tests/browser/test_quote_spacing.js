// Quick test to understand quote spacing behavior
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

console.log('Testing quote spacing patterns:\n');

const testCases = [
  // Basic quote cases
  '前面的文字"中间的内容"后面的文字',
  '社"DF',
  '"數毛社"',
  '【UCG中字】"數毛社"DF的《戰神4》全新演示解析',
  
  // Individual components
  '"中间的内容"',
  '前面的文字"',
  '"后面的文字',
  '中间的内容',
  
  // Quote patterns
  '文"D',
  '"D',
  '社"',
  '"DF'
];

testCases.forEach(input => {
  const output = pangu.spacingText(input);
  console.log(`"${input}" → "${output}"`);
});

console.log('\n\nAnalyzing specific patterns:');

// Test the exact patterns
const patterns = [
  { text: '社"', desc: 'CJK + quote' },
  { text: '"DF', desc: 'quote + AN' },
  { text: '社"DF', desc: 'CJK + quote + AN' },
  { text: '文"中', desc: 'CJK + quote + CJK' }
];

patterns.forEach(({ text, desc }) => {
  const output = pangu.spacingText(text);
  console.log(`${desc}: "${text}" → "${output}"`);
});