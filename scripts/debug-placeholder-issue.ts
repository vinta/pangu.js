// Debug placeholder issue

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

// Test the issue
const input = '"! git commit -a -m \'蛤\'"';
console.log(`Input: "${input}"`);

const manager = new PlaceholderReplacer('QUOTED_CONTENT_PLACEHOLDER_', '\uE040', '\uE041');

// Step 1: Store content
const DOUBLE_QUOTE_WITH_CONTENT = /"([^"]+)"/g;
let text = input;

text = text.replace(DOUBLE_QUOTE_WITH_CONTENT, (_match, content) => {
  console.log(`Storing content: "${content}"`);
  const placeholder = manager.store(content);
  console.log(`Placeholder: "${placeholder}"`);
  console.log(`Placeholder bytes:`, Array.from(placeholder).map(c => c.charCodeAt(0).toString(16)));
  return `"${placeholder}"`;
});

console.log(`After replacement: "${text}"`);
console.log(`Text bytes:`, Array.from(text).map(c => c.charCodeAt(0).toString(16)));

// Step 2: Try to restore
const restored = manager.restore(text);
console.log(`After restore: "${restored}"`);

// Debug the regex pattern
const pattern = new RegExp(`${'\uE040'.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${'QUOTED_CONTENT_PLACEHOLDER_'}(\\d+)${'\uE041'.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
console.log(`Restore pattern:`, pattern);
console.log(`Pattern test:`, pattern.test(text));