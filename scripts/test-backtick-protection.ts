// Test script to verify backtick protection approach

const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const QUOTES_FULL = '\`"\u05f4';

class PlaceholderReplacer {
  private placeholder: string;
  private items: string[] = [];
  private index: number = 0;
  private startDelimiter: string;
  private endDelimiter: string;

  constructor(placeholder: string, startDelimiter: string, endDelimiter: string) {
    this.placeholder = placeholder;
    this.startDelimiter = startDelimiter;
    this.endDelimiter = endDelimiter;
  }

  store(item: string) {
    this.items[this.index] = item;
    return `${this.startDelimiter}${this.placeholder}${this.index++}${this.endDelimiter}`;
  }

  restore(text: string) {
    const pattern = new RegExp(`${this.startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${this.placeholder}(\\d+)${this.endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    return text.replace(pattern, (_match, index) => {
      return this.items[parseInt(index, 10)] || '';
    });
  }

  reset() {
    this.items = [];
    this.index = 0;
  }
}

// Test the approach
console.log('Testing backtick protection approach:\n');

const testCases = [
  '`! git commit -a -m "蛤"`',
  '这是`代码"示例"`文本',
  '`echo "你好"`世界',
  'Hello `"世界"` test',
  '`multiple "quotes" with "中文"`'
];

const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES_FULL}])`, 'g');
const QUOTE_CJK = new RegExp(`([${QUOTES_FULL}])([${CJK}])`, 'g');
const BACKTICK_CONTENT = /`([^`]+)`/g;

for (const testCase of testCases) {
  console.log(`Input: "${testCase}"`);
  
  // Approach 1: Process without protection
  let withoutProtection = testCase;
  withoutProtection = withoutProtection.replace(CJK_QUOTE, '$1 $2');
  withoutProtection = withoutProtection.replace(QUOTE_CJK, '$1 $2');
  console.log(`Without protection: "${withoutProtection}"`);
  
  // Approach 2: Protect backticks first
  let withProtection = testCase;
  const backtickManager = new PlaceholderReplacer('BACKTICK_PLACEHOLDER_', '\uE040', '\uE041');
  
  // Store backtick content
  withProtection = withProtection.replace(BACKTICK_CONTENT, (match) => {
    return backtickManager.store(match);
  });
  
  // Apply quote spacing
  withProtection = withProtection.replace(CJK_QUOTE, '$1 $2');
  withProtection = withProtection.replace(QUOTE_CJK, '$1 $2');
  
  // Restore backticks
  withProtection = backtickManager.restore(withProtection);
  console.log(`With protection: "${withProtection}"`);
  console.log('');
}