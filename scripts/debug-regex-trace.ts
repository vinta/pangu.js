import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Read the source file to extract regex patterns
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sourceCode = readFileSync(join(__dirname, '../src/shared/index.ts'), 'utf-8');

// Extract all regex replacements from spacingText method
const regexReplacements: Array<{ name: string; line: string }> = [];
const lines = sourceCode.split('\n');
let inSpacingText = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('public spacingText(text: string)')) {
    inSpacingText = true;
  }
  
  if (inSpacingText && line.includes('newText = newText.replace(')) {
    // Extract the regex name
    const regexMatch = line.match(/newText = newText\.replace\(([A-Z_]+)/);
    if (regexMatch) {
      regexReplacements.push({
        name: regexMatch[1],
        line: line.trim()
      });
    }
  }
  
  if (inSpacingText && line.trim() === '}' && !line.includes('});')) {
    break;
  }
}

// Now create a debug version of spacingText
console.log('Debug Trace for: `! git commit -a -m "蛤"`\n');
console.log('='.repeat(80));

let text = '`! git commit -a -m "蛤"`';
let newText = text;
let stepNumber = 0;

// Early checks
console.log(`Step ${stepNumber++}: Initial text`);
console.log(`Text: "${newText}"`);
console.log('');

// Check for CJK
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);

if (!ANY_CJK.test(text)) {
  console.log('No CJK characters found - would return unchanged');
} else {
  console.log('CJK characters found - proceeding with spacing');
}
console.log('');

// Manual application of each regex in order
const QUOTES_FULL = '\`"\u05f4';

// Key patterns we're interested in
const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES_FULL}])`, 'g');
const QUOTE_CJK = new RegExp(`([${QUOTES_FULL}])([${CJK}])`, 'g');
const FIX_QUOTE_ANY_QUOTE = new RegExp(`(\`)[ ]*(.+?)[ ]*(\`)|(\")[ ]*(.+?)[ ]*(\")|(')[ ]*(.+?)[ ]*(')|(\u05f4)[ ]*(.+?)[ ]*(\u05f4)`, 'g');

// Apply CJK_QUOTE first
console.log(`Step ${stepNumber++}: Apply CJK_QUOTE`);
console.log(`Pattern: /([${CJK}])([${QUOTES_FULL}])/g`);
const beforeCjkQuote = newText;
newText = newText.replace(CJK_QUOTE, '$1 $2');
if (beforeCjkQuote !== newText) {
  console.log(`Changed: "${beforeCjkQuote}" → "${newText}"`);
  // Show what matched
  const matches = [...beforeCjkQuote.matchAll(CJK_QUOTE)];
  matches.forEach(match => {
    console.log(`  Matched: "${match[0]}" (${match[1]} + ${match[2]})`);
  });
} else {
  console.log('No change');
}
console.log('');

// Apply QUOTE_CJK
console.log(`Step ${stepNumber++}: Apply QUOTE_CJK`);
console.log(`Pattern: /([${QUOTES_FULL}])([${CJK}])/g`);
const beforeQuoteCjk = newText;
newText = newText.replace(QUOTE_CJK, '$1 $2');
if (beforeQuoteCjk !== newText) {
  console.log(`Changed: "${beforeQuoteCjk}" → "${newText}"`);
  // Show what matched
  const matches = [...beforeQuoteCjk.matchAll(QUOTE_CJK)];
  matches.forEach(match => {
    console.log(`  Matched: "${match[0]}" (${match[1]} + ${match[2]})`);
  });
} else {
  console.log('No change');
}
console.log('');

// Apply FIX_QUOTE_ANY_QUOTE
console.log(`Step ${stepNumber++}: Apply FIX_QUOTE_ANY_QUOTE`);
console.log('Pattern: /(`)[ ]*(.+?)[ ]*(`)|(\")[ ]*(.+?)[ ]*(\")|(\')[ ]*(.+?)[ ]*(\')|(\\u05f4)[ ]*(.+?)[ ]*(\\u05f4)/g');
const beforeFixQuote = newText;
newText = newText.replace(FIX_QUOTE_ANY_QUOTE, (match, ...groups) => {
  console.log(`  Processing match: "${match}"`);
  console.log(`  Groups: ${JSON.stringify(groups.slice(0, 12))}`);
  
  // groups[0-2]: backticks, groups[3-5]: double quotes, groups[6-8]: single quotes, groups[9-11]: u05f4
  if (groups[0] && groups[2]) {
    const result = `${groups[0]}${groups[1]}${groups[2]}`;
    console.log(`  Backtick match - returning: "${result}"`);
    return result;
  }
  if (groups[3] && groups[5]) {
    const result = `${groups[3]}${groups[4]}${groups[5]}`;
    console.log(`  Double quote match - returning: "${result}"`);
    return result;
  }
  if (groups[6] && groups[8]) {
    const result = `${groups[6]}${groups[7]}${groups[8]}`;
    console.log(`  Single quote match - returning: "${result}"`);
    return result;
  }
  if (groups[9] && groups[11]) {
    const result = `${groups[9]}${groups[10]}${groups[11]}`;
    console.log(`  U05f4 match - returning: "${result}"`);
    return result;
  }
  console.log(`  No specific match - returning original: "${match}"`);
  return match;
});

if (beforeFixQuote !== newText) {
  console.log(`Changed: "${beforeFixQuote}" → "${newText}"`);
} else {
  console.log('No change');
}
console.log('');

console.log('='.repeat(80));
console.log(`Final result: "${newText}"`);
console.log(`Expected:     "\`! git commit -a -m "蛤"\`"`);
console.log(`Match: ${newText === '`! git commit -a -m "蛤"`' ? '✓' : '✗'}`);

// Analysis
console.log('\n' + '='.repeat(80));
console.log('ANALYSIS:');
console.log('1. The text starts with a backtick, so it should be protected by FIX_QUOTE_ANY_QUOTE');
console.log('2. However, QUOTE_CJK runs first and adds a space after the inner double quote');
console.log('3. FIX_QUOTE_ANY_QUOTE then tries to remove spaces, but the pattern has already been altered');
console.log('\nThe issue is the order of operations - quotes inside backticks are being processed');
console.log('by CJK_QUOTE/QUOTE_CJK before FIX_QUOTE_ANY_QUOTE can protect them.');