// Debug interaction between placeholders and FIX_QUOTE_ANY_QUOTE

const FIX_QUOTE_ANY_QUOTE = new RegExp(`(\`)[ ]*(.+?)[ ]*(\`)|(\")[ ]*(.+?)[ ]*(\")|(')[ ]*(.+?)[ ]*(')|(\u05f4)[ ]*(.+?)[ ]*(\u05f4)`, 'g');

// Test case with placeholder
const textWithPlaceholder = '"QUOTED_CONTENT_PLACEHOLDER_0"';
console.log(`Input with placeholder: "${textWithPlaceholder}"`);

// Check if FIX_QUOTE_ANY_QUOTE matches
const matches = [...textWithPlaceholder.matchAll(FIX_QUOTE_ANY_QUOTE)];
console.log(`FIX_QUOTE_ANY_QUOTE matches: ${matches.length}`);

matches.forEach((match, i) => {
  console.log(`Match ${i}:`, match[0]);
  console.log(`Groups:`, match.slice(1, 12));
});

// Apply the pattern
const result = textWithPlaceholder.replace(FIX_QUOTE_ANY_QUOTE, (match, ...groups) => {
  console.log(`Processing match: "${match}"`);
  
  // groups[0-2]: backticks, groups[3-5]: double quotes, groups[6-8]: single quotes, groups[9-11]: u05f4
  if (groups[0] && groups[2]) {
    return `${groups[0]}${groups[1]}${groups[2]}`;
  }
  if (groups[3] && groups[5]) {
    console.log(`Double quote match - groups[3]="${groups[3]}", groups[4]="${groups[4]}", groups[5]="${groups[5]}"`);
    return `${groups[3]}${groups[4]}${groups[5]}`;
  }
  if (groups[6] && groups[8]) {
    return `${groups[6]}${groups[7]}${groups[8]}`;
  }
  if (groups[9] && groups[11]) {
    return `${groups[9]}${groups[10]}${groups[11]}`;
  }
  return match;
});

console.log(`After FIX_QUOTE_ANY_QUOTE: "${result}"`);
console.log('');
console.log('ISSUE FOUND: FIX_QUOTE_ANY_QUOTE is matching our placeholder text!');
console.log('The pattern removes spaces inside quotes, which strips the delimiter characters.');