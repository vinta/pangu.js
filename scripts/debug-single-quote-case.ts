// Debug the failing test case with single quotes

const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const QUOTES_FULL = '\`"\u05f4';

const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES_FULL}])`, 'g');
const QUOTE_CJK = new RegExp(`([${QUOTES_FULL}])([${CJK}])`, 'g');

// The failing test case
const input = `'! git commit -a -m "蛤"'`;
console.log(`Input: "${input}"`);
console.log(`Expected: "${input}"` );
console.log('');

// Step by step processing
let text = input;

// Step 1: Protect backtick content (no backticks in this case)
console.log('Step 1: Protect backtick content');
console.log(`No backticks found, text unchanged: "${text}"`);
console.log('');

// Step 2: Apply CJK_QUOTE
console.log('Step 2: Apply CJK_QUOTE');
console.log(`Pattern matches CJK followed by quotes (including ")`);
const cjkQuoteMatches = [...text.matchAll(CJK_QUOTE)];
console.log(`Matches found: ${cjkQuoteMatches.length}`);
cjkQuoteMatches.forEach(match => {
  console.log(`  Match: "${match[0]}" at index ${match.index} (${match[1]} + ${match[2]})`);
});
text = text.replace(CJK_QUOTE, '$1 $2');
console.log(`After CJK_QUOTE: "${text}"`);
console.log('');

// Step 3: Apply QUOTE_CJK
console.log('Step 3: Apply QUOTE_CJK');
console.log(`Pattern matches quotes (including ") followed by CJK`);
const quoteCjkMatches = [...text.matchAll(QUOTE_CJK)];
console.log(`Matches found: ${quoteCjkMatches.length}`);
quoteCjkMatches.forEach(match => {
  console.log(`  Match: "${match[0]}" at index ${match.index} (${match[1]} + ${match[2]})`);
});
text = text.replace(QUOTE_CJK, '$1 $2');
console.log(`After QUOTE_CJK: "${text}"`);
console.log('');

console.log('=== Analysis ===');
console.log('The issue is that double quotes inside single quotes are being processed.');
console.log('Even though the outer quotes are single quotes, the inner double quotes');
console.log('are matched by CJK_QUOTE and QUOTE_CJK patterns because " is in QUOTES_FULL.');
console.log('');
console.log('This is actually correct behavior for most cases, but in this specific');
console.log('test case, the expectation is that quotes inside other quote types');
console.log('should not be spaced.');